"""Centralized logging utilities for the AI service.

Provides:
  * a request-id context variable that is injected into every log line so a
    single request can be traced end-to-end,
  * an ANSI-colored formatter (INFO=blue, WARNING=yellow, ERROR=red,
    "SUCCESS" via logger.success-style helper=green),
  * helpers to mask secrets and build the boxed section banners the team uses,
  * a debug gate so verbose pipeline logs only appear in development / when
    LOG_LEVEL=debug.
"""
from __future__ import annotations

import logging
import sys
import uuid
from contextvars import ContextVar
from typing import Any

# ---------------------------------------------------------------------------
# Request-id context (populated by middleware; read by the log formatter)
# ---------------------------------------------------------------------------
_request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")


def set_request_id(request_id: str) -> None:
    _request_id_ctx.set(request_id)


def get_request_id() -> str:
    return _request_id_ctx.get()


def new_request_id() -> str:
    """ai-YYYYMMDD-<6 hex> style id used when the caller didn't send one."""
    from datetime import datetime

    return f"ai-{datetime.utcnow():%Y%m%d}-{uuid.uuid4().hex[:6]}"


# ---------------------------------------------------------------------------
# Colors
# ---------------------------------------------------------------------------
class Color:
    RESET = "\033[0m"
    BLUE = "\033[34m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    RED = "\033[31m"
    GREY = "\033[90m"
    BOLD = "\033[1m"


_LEVEL_COLORS = {
    logging.DEBUG: Color.GREY,
    logging.INFO: Color.BLUE,
    logging.WARNING: Color.YELLOW,
    logging.ERROR: Color.RED,
    logging.CRITICAL: Color.RED + Color.BOLD,
}


class RequestIdFilter(logging.Filter):
    """Attach the current request id to every record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = get_request_id()
        return True


class ColorFormatter(logging.Formatter):
    def __init__(self, use_color: bool = True) -> None:
        super().__init__()
        self.use_color = use_color and sys.stderr.isatty()

    def format(self, record: logging.LogRecord) -> str:
        rid = getattr(record, "request_id", "-")
        ts = self.formatTime(record, "%Y-%m-%d %H:%M:%S")
        base = f"{ts} [{record.levelname}] [{rid}] {record.name}: {record.getMessage()}"
        if record.exc_info:
            base += "\n" + self.formatException(record.exc_info)
        if self.use_color:
            color = _LEVEL_COLORS.get(record.levelno, "")
            return f"{color}{base}{Color.RESET}"
        return base


def configure_logging(level: str = "INFO") -> None:
    """Install the colored, request-id-aware handler on the root logger."""
    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    # Replace existing handlers so uvicorn's default formatting doesn't double up.
    for h in list(root.handlers):
        root.removeHandler(h)

    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(ColorFormatter())
    handler.addFilter(RequestIdFilter())
    root.addHandler(handler)

    # Align uvicorn access/error loggers with our handler.
    for name in ("uvicorn", "uvicorn.access", "uvicorn.error"):
        lg = logging.getLogger(name)
        lg.handlers = [handler]
        lg.propagate = False


# ---------------------------------------------------------------------------
# Secret masking
# ---------------------------------------------------------------------------
_SENSITIVE_KEYS = {
    "authorization",
    "api_key",
    "apikey",
    "openai_api_key",
    "moonshot_api_key",
    "anthropic_api_key",
    "password",
    "secret",
    "token",
    "cookie",
    "set-cookie",
    "x-api-key",
}


def mask_secret(value: str) -> str:
    if not value:
        return value
    s = str(value)
    if len(s) <= 8:
        return "****"
    return f"{s[:4]}...{s[-4:]}"


def mask_headers(headers: dict[str, Any]) -> dict[str, Any]:
    out: dict[str, Any] = {}
    for k, v in (headers or {}).items():
        if k.lower() in _SENSITIVE_KEYS:
            out[k] = mask_secret(v)
        else:
            out[k] = v
    return out


def mask_mapping(data: Any) -> Any:
    """Recursively mask sensitive keys in dicts/lists for safe logging."""
    if isinstance(data, dict):
        return {
            k: (mask_secret(v) if k.lower() in _SENSITIVE_KEYS else mask_mapping(v))
            for k, v in data.items()
        }
    if isinstance(data, list):
        return [mask_mapping(x) for x in data]
    return data


# ---------------------------------------------------------------------------
# Banner helpers
# ---------------------------------------------------------------------------
_BAR = "=" * 60


def banner(logger: logging.Logger, title: str, fields: dict[str, Any] | None = None,
           level: int = logging.INFO) -> None:
    """Log a boxed section like the team's requested format."""
    lines = [_BAR, title, _BAR]
    for k, v in (fields or {}).items():
        lines.append(f"  {k}: {v}")
    lines.append(_BAR)
    logger.log(level, "\n".join(lines))
