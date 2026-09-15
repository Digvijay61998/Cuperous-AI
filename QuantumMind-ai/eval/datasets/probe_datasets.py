#!/usr/bin/env python3
"""Run the five hand-graded suites against a live AI service.

These suites test *conversational behaviour* — tone, honesty, arithmetic,
escalation — which a lexical metric grades badly and a human grades well. So this
script does not score anything. It asks the questions in the right order, with the
right chat history, and prints each answer next to its grading criteria so a human
can score it in one pass.

For the numeric CI gate, use `eval/runner.py` instead. Different job.

Usage
-----
    python eval/datasets/probe_datasets.py --client <CLIENT_ID>
    python eval/datasets/probe_datasets.py --client <CLIENT_ID> --suite 2
    python eval/datasets/probe_datasets.py --client <CLIENT_ID> --suite 1 --suite 4
    python eval/datasets/probe_datasets.py --client <CLIENT_ID> --case 2.1

Reads `suites.yaml` beside this file. Talks to `--url` (default
http://localhost:8000) over plain HTTP with stdlib only, so it runs anywhere the
service is reachable without installing anything.
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

import yaml

_SUITES_PATH = Path(__file__).with_name("suites.yaml")

# Flag values worth surfacing per case, and what makes each one notable.
_ZERO_COST_NOTE = "expected: 0 tokens, 0 sources (no retrieval, no LLM call)"


def _load_suites() -> list[dict[str, Any]]:
    with _SUITES_PATH.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh)["suites"]


def _ask(
    url: str, client_id: str, question: str, history: list[dict], company: str
) -> dict[str, Any]:
    body = json.dumps(
        {
            "client_id": client_id,
            "question": question,
            "company_name": company,
            "chat_history": history,
        }
    ).encode()
    req = urllib.request.Request(
        f"{url.rstrip('/')}/query/ask",
        data=body,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        return json.loads(resp.read())


def _print_criteria(case: dict[str, Any]) -> None:
    for key, label in (("must_have", "MUST HAVE"), ("must_not_have", "MUST NOT")):
        values = case.get(key) or []
        if values:
            print(f"    {label:9} {'; '.join(str(v) for v in values)}")
    if case.get("expect_zero_cost"):
        print(f"    NOTE      {_ZERO_COST_NOTE}")
    if "expect_confident" in case:
        print(f"    NOTE      expected confident={case['expect_confident']}")
    if case.get("known_weak"):
        print(
            "    NOTE      KNOWN WEAK pre-Phase-1 (finding L1): scoring 1 here is "
            "the expected result, not a new regression"
        )
    if case.get("critical"):
        print(
            "    NOTE      CRITICAL: a 0 on this case fails the whole suite "
            "regardless of the total"
        )


def _run_case(
    url: str, client_id: str, company: str, case: dict[str, Any]
) -> None:
    turns: list[str] = case["turns"]
    print(f"\n  [{case['id']}]")
    _print_criteria(case)

    history: list[dict] = []
    for i, question in enumerate(turns, start=1):
        prefix = f"    turn {i}" if len(turns) > 1 else "    ask"
        print(f"{prefix} > {question}")
        try:
            data = _ask(url, client_id, question, history, company)
        except urllib.error.URLError as exc:
            print(f"          ! request failed: {exc}")
            return
        except Exception as exc:  # noqa: BLE001
            print(f"          ! {type(exc).__name__}: {exc}")
            return

        answer = data.get("answer")
        sources = data.get("sources") or []
        top = round(sources[0]["score"], 3) if sources else None
        print(
            f"          confident={data.get('confident')} "
            f"tokens={data.get('tokens_used')} chunks={len(sources)} top={top}"
        )
        for line in (answer or "(no answer)").splitlines():
            print(f"          {line}")

        history = history + [
            {"role": "user", "content": question},
            {"role": "assistant", "content": answer or ""},
        ]

    print("    score (0/1/2): ____")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--client", required=True, help="client_id to query against")
    parser.add_argument("--url", default="http://localhost:8000")
    parser.add_argument("--company", default="Nimbus")
    parser.add_argument(
        "--suite",
        action="append",
        type=int,
        help="suite number; repeatable. Omit for all five.",
    )
    parser.add_argument(
        "--case", action="append", help="case id such as 2.1; repeatable"
    )
    args = parser.parse_args()

    suites = _load_suites()
    wanted_suites = set(args.suite or [])
    wanted_cases = set(args.case or [])

    total = 0
    for suite in suites:
        if wanted_suites and suite["id"] not in wanted_suites:
            continue
        cases = [
            c for c in suite["cases"] if not wanted_cases or c["id"] in wanted_cases
        ]
        if not cases:
            continue
        print("\n" + "=" * 78)
        print(f"SUITE {suite['id']} — {suite['name']}  (guards: {', '.join(suite['guards'])})")
        print(f"max score: {2 * len(cases)}")
        print("=" * 78)
        for case in cases:
            _run_case(args.url, args.client, args.company, case)
            total += 2

    print("\n" + "=" * 78)
    print(f"max total across the cases run: {total}")
    print("Pass at >=90% of maximum with ZERO zeros. A single 0 fails the suite.")
    print("Record the result in PLAN.md section 7 with the date and commit.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
