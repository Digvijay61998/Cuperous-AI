"""HTTP request/response logging middleware with correlation ids."""
from __future__ import annotations

import json
import logging
import time

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.config import get_settings
from app.logging_utils import (
    get_request_id,
    mask_headers,
    new_request_id,
    set_request_id,
)
from app.tracing import finish_trace, span_summary, start_trace

logger = logging.getLogger("http")

# Header the backend sends so ids correlate across services.
REQUEST_ID_HEADER = "x-request-id"

_MAX_BODY_LOG = 4000  # chars


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        settings = get_settings()
        debug = settings.debug_logs_enabled

        # 1. Establish / reuse the correlation id, and open a trace keyed by it
        #    so log lines and the trace summary share one identifier.
        request_id = request.headers.get(REQUEST_ID_HEADER) or new_request_id()
        set_request_id(request_id)
        start_trace(request_id)

        start = time.perf_counter()

        # 2. Capture and (optionally) log the incoming request.
        body_bytes = await request.body()

        async def receive():  # re-inject the consumed body for downstream handlers
            return {"type": "http.request", "body": body_bytes, "more_body": False}

        request = Request(request.scope, receive)

        if debug:
            body_preview = _decode_body(body_bytes)
            logger.info(
                "[HTTP ->] %s %s | headers=%s | body=%s",
                request.method,
                request.url.path,
                mask_headers(dict(request.headers)),
                body_preview,
            )
        else:
            logger.info("[HTTP ->] %s %s", request.method, request.url.path)

        # 3. Call the route, always surfacing failures.
        try:
            response = await call_next(request)
        except Exception:
            duration_ms = (time.perf_counter() - start) * 1000
            logger.exception(
                "[HTTP xx] %s %s failed after %.0fms",
                request.method,
                request.url.path,
                duration_ms,
            )
            finish_trace(level=logging.ERROR)
            raise

        duration_ms = (time.perf_counter() - start) * 1000

        # 4. Log the response (buffer the body so we can print it in debug).
        response.headers[REQUEST_ID_HEADER] = request_id
        stages = span_summary()

        if debug:
            resp_body = b""
            async for chunk in response.body_iterator:
                resp_body += chunk

            preview = _decode_body(resp_body)
            level = logging.INFO if response.status_code < 400 else logging.ERROR
            logger.log(
                level,
                "[HTTP <-] %s %s -> %d in %.0fms | stages=%s | body=%s",
                request.method,
                request.url.path,
                response.status_code,
                duration_ms,
                stages,
                preview,
            )
            finish_trace()
            return Response(
                content=resp_body,
                status_code=response.status_code,
                headers=dict(response.headers),
                media_type=response.media_type,
            )

        level = logging.INFO if response.status_code < 400 else logging.ERROR
        logger.log(
            level,
            "[HTTP <-] %s %s -> %d in %.0fms | stages=%s",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
            stages,
        )
        finish_trace()
        return response


def _decode_body(body: bytes) -> str:
    if not body:
        return "(empty)"
    try:
        text = body.decode("utf-8")
    except UnicodeDecodeError:
        return f"(binary {len(body)} bytes)"
    # Pretty-compact JSON when possible; truncate to keep logs readable.
    try:
        text = json.dumps(json.loads(text), ensure_ascii=False)
    except (json.JSONDecodeError, ValueError):
        pass
    if len(text) > _MAX_BODY_LOG:
        return text[:_MAX_BODY_LOG] + f"...(+{len(text) - _MAX_BODY_LOG} chars)"
    return text
