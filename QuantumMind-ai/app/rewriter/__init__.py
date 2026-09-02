"""Query rewriting strategies (PLAN.md Phase 1).

Package marker. `base.py` holds the frozen contract; concrete strategies and the
factory live alongside it. Kept empty of logic on purpose — importing
`app.rewriter` must never pull in a provider, a client, or `Settings`.
"""
