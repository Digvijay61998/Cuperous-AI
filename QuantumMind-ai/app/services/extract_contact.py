"""Pull a person's name, e-mail and phone out of one short chat message (R16.5).

The backend runs its own regexes first and only calls this when the text looks
like it carries contact details. So the job here is precision, not recall: a
wrong value would be written onto a CRM contact, so every field the model
returns is re-checked deterministically against the input text and dropped if it
does not hold up. The model can only ever *select* values from the text, never
invent them.

Flow:

1. Ask the provider for a JSON object ``{"name", "email", "phone"}``.
2. Parse and validate it with a lenient pydantic model.
3. Post-validate each field against the text (``_check_email`` / ``_check_phone``
   / ``_check_name``).
4. If the call raises or the output is not valid JSON of the right shape, fall
   back to regex-only extraction (email + phone, name always null).

This never raises: the endpoint must not 500 on bad model output.
"""
from __future__ import annotations

import json
import logging
import re
from typing import Optional

from pydantic import BaseModel, ConfigDict, ValidationError

from app.llm.base import LLMProvider
from app.llm.factory import get_llm_provider
from app.schemas import EXTRACT_CONTACT_MAX_NAME, ExtractContactResponse
from app.tracing import span

logger = logging.getLogger("ai.extract_contact")

PHONE_MIN_DIGITS = 7
PHONE_MAX_DIGITS = 15

# Pragmatic address shape; full RFC 5322 is not the goal, rejecting junk is.
_EMAIL_RE = re.compile(
    r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?"
    r"(?:\.[A-Za-z0-9](?:[A-Za-z0-9\-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}"
)
# A run of digits with the usual separators, optionally led by "+".
_PHONE_SPAN_RE = re.compile(r"\+?\d[\d\s().\-]{5,}\d")

SYSTEM_PROMPT = (
    "You extract contact details from ONE chat message written by a customer. "
    "Reply with a single JSON object and nothing else, exactly with these keys:\n"
    '{"name": string|null, "email": string|null, "phone": string|null}\n'
    "Rules:\n"
    "- Only copy values that literally appear in the message. Never guess, "
    "complete, or invent anything. Use null when a value is not clearly present.\n"
    "- name: the customer's OWN name, only when they state it (e.g. \"I'm ...\", "
    "\"my name is ...\", \"this is ...\"). Not a company, product, assistant or "
    "bot name, and not anyone else's name.\n"
    "- email: one e-mail address exactly as written in the message.\n"
    "- phone: one phone number exactly as written in the message (digits, "
    "spaces, dashes, brackets or a leading + are fine). Do not add a country code.\n"
    "No markdown, no code fences, no explanation."
)


class _LLMContact(BaseModel):
    """Lenient shape for the model's reply; strict checks happen afterwards."""

    model_config = ConfigDict(extra="ignore")

    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None


# --------------------------------------------------------------------- parsing

def _parse_llm_json(raw: str) -> _LLMContact:
    """Parse the model's text into ``_LLMContact``. Raises ValueError on junk."""
    text = (raw or "").strip()
    # Tolerate a ```json fence or a sentence around the object.
    fenced = re.search(r"```(?:json)?\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    if fenced:
        text = fenced.group(1).strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise ValueError("no JSON object in model output")
    try:
        data = json.loads(text[start : end + 1])
    except json.JSONDecodeError as exc:
        raise ValueError(f"invalid JSON: {exc}") from exc
    if not isinstance(data, dict):
        raise ValueError("model output is not a JSON object")
    try:
        return _LLMContact.model_validate(data)
    except ValidationError as exc:
        raise ValueError(f"model output has the wrong shape: {exc}") from exc


# ------------------------------------------------------------ post-validation

def _digits(value: str) -> str:
    return re.sub(r"\D", "", value)


def _normalise_phone(value: str) -> Optional[str]:
    """Digits plus an optional leading "+", 7..15 digits, else None."""
    value = (value or "").strip()
    digits = _digits(value)
    if not (PHONE_MIN_DIGITS <= len(digits) <= PHONE_MAX_DIGITS):
        return None
    return ("+" if value.startswith("+") else "") + digits


def _phone_spans(text: str) -> list[str]:
    """Phone-looking spans in ``text``, with e-mail addresses removed first."""
    without_emails = _EMAIL_RE.sub(" ", text)
    return [m.group(0) for m in _PHONE_SPAN_RE.finditer(without_emails)]


def _check_email(candidate: Optional[str], text: str) -> Optional[str]:
    if not candidate:
        return None
    email = candidate.strip().lower()
    if not _EMAIL_RE.fullmatch(email):
        return None
    if email not in text.lower():
        return None
    return email


def _check_phone(candidate: Optional[str], text: str) -> Optional[str]:
    if not candidate:
        return None
    phone = _normalise_phone(candidate)
    if phone is None:
        return None
    want = _digits(phone)
    for spot in _phone_spans(text):
        have = _digits(spot)
        if want == have:
            # Take the "+" from the text, not from the model.
            return _normalise_phone(spot)
        if want in have:
            return want
    return None


def _check_name(candidate: Optional[str], text: str) -> Optional[str]:
    if not candidate:
        return None
    name = re.sub(r"\s+", " ", candidate).strip().strip(".,;:!?\"'")
    if not name or len(name) > EXTRACT_CONTACT_MAX_NAME:
        return None
    # A name never carries an address or a number.
    if "@" in name or re.search(r"\d", name):
        return None
    collapsed_text = re.sub(r"\s+", " ", text).lower()
    if name.lower() not in collapsed_text:
        return None
    return name


# -------------------------------------------------------------------- fallback

def regex_extract(text: str) -> ExtractContactResponse:
    """Deterministic extraction: first e-mail, first 7..15-digit phone, no name."""
    email_match = _EMAIL_RE.search(text)
    email = email_match.group(0).lower() if email_match else None
    phone = None
    for spot in _phone_spans(text):
        phone = _normalise_phone(spot)
        if phone:
            break
    return ExtractContactResponse(name=None, email=email, phone=phone)


# --------------------------------------------------------------------- service

class ExtractContactService:
    def __init__(self, provider: LLMProvider | None = None) -> None:
        self._provider = provider

    @property
    def provider(self) -> LLMProvider:
        if self._provider is None:
            self._provider = get_llm_provider()
        return self._provider

    def extract(self, text: str) -> ExtractContactResponse:
        try:
            parsed = self._ask_model(text)
        except Exception as exc:  # noqa: BLE001 - any failure means "use regexes"
            logger.warning("[EXTRACT] LLM extraction failed, using regex fallback: %s", exc)
            return regex_extract(text)

        result = ExtractContactResponse(
            name=_check_name(parsed.name, text),
            email=_check_email(parsed.email, text),
            phone=_check_phone(parsed.phone, text),
        )
        dropped = [
            field
            for field in ("name", "email", "phone")
            if getattr(parsed, field) and getattr(result, field) is None
        ]
        if dropped:
            logger.info("[EXTRACT] dropped unverifiable fields: %s", ", ".join(dropped))
        return result

    def _ask_model(self, text: str) -> _LLMContact:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": text},
        ]
        provider = self.provider
        with span(
            "extract_contact",
            provider=getattr(provider, "name", None),
            chars=len(text),
        ) as sp:
            result = provider.generate(messages)
            sp.record_tokens(
                prompt=result.prompt_tokens,
                completion=result.completion_tokens,
                total=result.tokens_used,
                model=result.model,
            )
            parsed = _parse_llm_json(result.text)
            sp.set(
                has_name=bool(parsed.name),
                has_email=bool(parsed.email),
                has_phone=bool(parsed.phone),
            )
        return parsed
