
from typing import Any


def _pass_rate(result: dict[str, Any]) -> float:
    passed = result.get("passed_tests", 0)
    failed = result.get("failed_tests", 0)
    total = passed + failed
    return passed / total if total else 0.0


def _ranking_key(candidate: dict[str, Any]) -> tuple:
    result = candidate["result"]

    fully_passed = (
        result.get("status") == "completed"
        and result.get("passed") is True
        and result.get("failed_tests", 0) == 0
    )

    # Only use latency from the dedicated benchmark harness.
    benchmark_median = result.get("benchmark_median_ms")
    has_benchmark = isinstance(benchmark_median, (int, float))

    return (
        -int(fully_passed),
        -_pass_rate(result),
        -result.get("passed_tests", 0),
        result.get("failed_tests", 0),
        0 if has_benchmark else 1,
        benchmark_median if has_benchmark else 0,
    )


def _tie_key(candidate: dict[str, Any]) -> tuple:
    """Metrics that determine whether candidates deserve the same rank."""
    return _ranking_key(candidate)


def rank_candidates(
    candidates: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    ranked = sorted(candidates, key=_ranking_key)

    previous_key = None
    current_rank = 0

    for index, candidate in enumerate(ranked, start=1):
        key = _tie_key(candidate)

        if key != previous_key:
            current_rank = index
            previous_key = key

        candidate["rank"] = current_rank
        candidate["pass_rate"] = round(
            _pass_rate(candidate["result"]), 4
        )

        has_benchmark = isinstance(
            candidate["result"].get("benchmark_median_ms"),
            (int, float),
        )
        candidate["performance_measured"] = has_benchmark

    return ranked
