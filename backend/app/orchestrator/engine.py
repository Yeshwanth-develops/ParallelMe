
import asyncio
from typing import Any

from app.orchestrator.pruning import (
    check_duplicate,
    validate_candidate,
)
from app.orchestrator.ranker import rank_candidates
from app.sandbox.docker_manager import evaluate_python


async def run_parallel_evaluation(
    candidates: list[dict[str, str]],
    tests: str,
    timeout_seconds: int = 5,
    max_concurrency: int = 3,
) -> dict[str, Any]:
    """
    Evaluate distinct candidate strategies concurrently.

    Each candidate must contain:
      candidate_id, strategy_name, code
    """
    if max_concurrency < 1:
        raise ValueError("max_concurrency must be at least 1.")

    if not candidates:
        raise ValueError("Provide at least one candidate.")

    ids = [item["candidate_id"] for item in candidates]
    if len(ids) != len(set(ids)):
        raise ValueError("candidate_id values must be unique.")

    semaphore = asyncio.Semaphore(max_concurrency)
    seen: dict[str, str] = {}
    ready: list[dict[str, str]] = []
    evaluated: list[dict[str, Any]] = []
    pruned: list[dict[str, Any]] = []

    # Prune before allocating Docker containers.
    for candidate in candidates:
        candidate_id = candidate["candidate_id"]
        code = candidate["code"]

        invalid = validate_candidate(code)
        if invalid is not None:
            pruned.append({
                "candidate_id": candidate_id,
                "strategy_name": candidate["strategy_name"],
                "result": invalid,
            })
            continue

        duplicate_of, fingerprint = check_duplicate(code, seen)
        if duplicate_of is not None:
            pruned.append({
                "candidate_id": candidate_id,
                "strategy_name": candidate["strategy_name"],
                "result": {
                    "status": "pruned",
                    "reason": "duplicate_code",
                    "duplicate_of": duplicate_of,
                    "passed": False,
                    "passed_tests": 0,
                    "failed_tests": 0,
                    "duration_ms": 0,
                },
            })
            continue

        seen[fingerprint] = candidate_id
        ready.append(candidate)

    async def evaluate_one(
        candidate: dict[str, str],
    ) -> dict[str, Any]:
        async with semaphore:
            try:
                result = await asyncio.to_thread(
                    evaluate_python,
                    candidate["code"],
                    tests,
                    timeout_seconds,
                )
            except Exception as exc:
                # Preserve the failure without crashing other strategies.
                result = {
                    "status": "evaluation_error",
                    "passed": False,
                    "passed_tests": 0,
                    "failed_tests": 0,
                    "duration_ms": 0,
                    "error": str(exc),
                }

            return {
                "candidate_id": candidate["candidate_id"],
                "strategy_name": candidate["strategy_name"],
                "result": result,
            }

    if ready:
        evaluated = await asyncio.gather(
            *(evaluate_one(candidate) for candidate in ready)
        )

    ranked = rank_candidates(evaluated)

    # Keep the full results together; only actually evaluated candidates
    # receive ranking positions.
    return {
        "total_candidates": len(candidates),
        "evaluated_count": len(evaluated),
        "pruned_count": len(pruned),
        "ranked_candidates": ranked,
        "pruned_candidates": pruned,
    }
