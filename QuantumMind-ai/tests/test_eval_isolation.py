"""Guards the eval harness's isolation from production data (PLAN.md L25).

The harness ingests a golden corpus and then DROPS the collection it used. That
makes collection isolation a data-safety property, not a tidiness one.

The original bug: ``runner.py`` selected its collection with
``os.environ.setdefault("MILVUS_COLLECTION", ...)``. ``setdefault`` is a no-op
when the variable is already set — and it always is, because ``.env`` sets it and
the Makefile passes ``--env-file .env``. So every eval run used the production
collection and dropped it on teardown, with no visible symptom: the run passed,
the metrics were right, and only the collection name in one log line gave it away.

These tests are cheap and they pin the two guards that fix it. No Milvus, no
API key.
"""
import os
import re

import pytest


REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RUNNER_PATH = os.path.join(REPO_ROOT, "eval", "runner.py")


@pytest.fixture(scope="module")
def runner_source() -> str:
    with open(RUNNER_PATH, encoding="utf-8") as fh:
        return fh.read()


# --------------------------------------------------------- the assignment guard
def test_collection_is_assigned_not_defaulted(runner_source: str):
    """MILVUS_COLLECTION must be forced, because .env always pre-sets it."""
    assert re.search(
        r"""os\.environ\[\s*["']MILVUS_COLLECTION["']\s*\]\s*=""",
        runner_source,
    ), "runner.py must ASSIGN MILVUS_COLLECTION so .env cannot win"


def test_collection_is_never_setdefault(runner_source: str):
    """A setdefault here silently re-enables the L25 data-loss bug."""
    # Strip comments and docstring prose, which legitimately mention the old
    # broken form to explain why it is forbidden.
    code = "\n".join(
        line.split("#", 1)[0] for line in runner_source.splitlines()
    )
    assert not re.search(
        r"""setdefault\(\s*["']MILVUS_COLLECTION["']""", code
    ), "MILVUS_COLLECTION must not use setdefault — see PLAN.md L25"


def test_eval_collection_name_is_namespaced_per_run(runner_source: str):
    """Each run needs its own collection so concurrent runs cannot collide."""
    assert re.search(
        r"""_EVAL_COLLECTION\s*=\s*f["']eval_\{_RUN_ID\}["']""", runner_source
    ), "the eval collection must be namespaced with the run id"


# ------------------------------------------------------------ the teardown guard
def test_teardown_refuses_foreign_collections():
    """Teardown must verify its target rather than trust configuration.

    Simulates the exact failure mode: settings resolve to the production
    collection while the run expected its own. Nothing may be dropped.
    """
    from unittest.mock import MagicMock, patch

    from eval import runner as runner_mod

    r = runner_mod.EvalRunner()

    fake_settings = MagicMock()
    fake_settings.milvus_collection = "quantummind_knowledge"

    fake_utility = MagicMock()

    with patch("app.config.get_settings", return_value=fake_settings), patch.dict(
        "sys.modules", {"pymilvus": MagicMock(utility=fake_utility)}
    ):
        r.teardown()

    fake_utility.drop_collection.assert_not_called()


def test_teardown_drops_its_own_collection():
    """The happy path still works — the guard must not block legitimate cleanup."""
    from unittest.mock import MagicMock, patch

    from eval import runner as runner_mod

    r = runner_mod.EvalRunner()

    fake_settings = MagicMock()
    fake_settings.milvus_collection = runner_mod._EVAL_COLLECTION

    fake_pymilvus = MagicMock()

    with patch("app.config.get_settings", return_value=fake_settings), patch.dict(
        "sys.modules", {"pymilvus": fake_pymilvus}
    ):
        r.teardown()

    fake_pymilvus.utility.drop_collection.assert_called_once_with(
        runner_mod._EVAL_COLLECTION, using="default"
    )


def test_importing_runner_sets_an_eval_collection():
    """Importing the module must redirect the collection away from production."""
    from eval import runner as runner_mod

    assert os.environ["MILVUS_COLLECTION"] == runner_mod._EVAL_COLLECTION
    assert os.environ["MILVUS_COLLECTION"].startswith("eval_")
