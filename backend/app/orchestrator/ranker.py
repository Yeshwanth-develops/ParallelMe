
from typing import Any


def _pass_rate(result: dict[str, Any]) -> float:
    passed = result.get("passed_tests", 0)
    failed = result.get("failed_tests", 0)
    total = passed + failed

    return passed / total if total else 0.0


def ranking_key(candidate: dict[str, Any]) -> tuple:
    result = candidate["result"]

    fully_passed = (
        result.get("status") == "completed"
        and result.get("passed") is True
        and result.get("failed_tests", 0) == 0
    )

    return (
        -int(fully_passed),
        -_pass_rate(result),
        -result.get("passed_tests", 0),
        result.get("failed_tests", 0),
        result.get("duration_ms", float("inf")),
        candidate["candidate_id"],
    )


def rank_candidates(
    candidates: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Return evaluated candidates from strongest to weakest."""
    ranked = sorted(candidates, key=ranking_key)

    for position, candidate in enumerate(ranked, start=1):
        candidate["rank"] = position
        candidate["pass_rate"] = round(
            _pass_rate(candidate["result"]), 4
        )

    return ranked
