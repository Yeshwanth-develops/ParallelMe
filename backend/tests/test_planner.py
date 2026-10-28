import pytest
from pydantic import ValidationError

from app.agents.planner import (
    PlannedCandidate,
    PlannerError,
    PlannerOutput,
    _validate_plan,
    generate_strategies,
)


def test_planned_candidate_markdown_stripping():
    candidate = PlannedCandidate(
        strategy_name="Iterative Solution",
        approach="straightforward",
        rationale="A standard iterative loop over elements.",
        code="```python\ndef solution(x):\n    return x * 2\n```",
    )
    assert "```" not in candidate.code
    assert candidate.code == "def solution(x):\n    return x * 2"


def test_planned_candidate_syntax_error():
    with pytest.raises(ValidationError):
        PlannedCandidate(
            strategy_name="Broken Solution",
            approach="algorithmic",
            rationale="This has a broken syntax line.",
            code="def broken_syntax(: return 1",
        )


def test_validate_plan_valid():
    c1 = PlannedCandidate(
        strategy_name="Strategy 1",
        approach="straightforward",
        rationale="Straightforward implementation.",
        code="def solve(a): return a",
    )
    c2 = PlannedCandidate(
        strategy_name="Strategy 2",
        approach="algorithmic",
        rationale="Algorithmic decomposition implementation.",
        code="def solve(a): return 2 * a // 2",
    )
    c3 = PlannedCandidate(
        strategy_name="Strategy 3",
        approach="optimized",
        rationale="Optimized memory implementation.",
        code="def solve(a):\n    # optimized\n    return a + 0",
    )
    plan = PlannerOutput(candidates=[c1, c2, c3])
    validated = _validate_plan(plan)
    assert len(validated.candidates) == 3


def test_validate_plan_duplicate_code():
    c1 = PlannedCandidate(
        strategy_name="Strategy 1",
        approach="straightforward",
        rationale="Straightforward implementation.",
        code="def solve(a): return a",
    )
    c2 = PlannedCandidate(
        strategy_name="Strategy 2",
        approach="algorithmic",
        rationale="Algorithmic implementation.",
        code="def solve(a): return a",
    )
    c3 = PlannedCandidate(
        strategy_name="Strategy 3",
        approach="optimized",
        rationale="Optimized implementation.",
        code="def solve(a): return a + 1",
    )
    plan = PlannerOutput(candidates=[c1, c2, c3])
    with pytest.raises(PlannerError, match="duplicate code"):
        _validate_plan(plan)


import asyncio


def test_generate_strategies_empty_task():
    with pytest.raises(PlannerError, match="cannot be empty"):
        asyncio.run(generate_strategies("   "))


def test_generate_strategies_too_long():
    with pytest.raises(PlannerError, match="too long"):
        asyncio.run(generate_strategies("a" * 12001))
