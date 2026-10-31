import asyncio

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.agents.planner import PlannerError, generate_strategies
from app.orchestrator.engine import run_parallel_evaluation

from app.sandbox.benchmark_runner import benchmark_python
from app.orchestrator.ranker import rank_candidates

router = APIRouter(prefix="/api/tasks", tags=["orchestration"])


class CandidateInput(BaseModel):
    candidate_id: str = Field(min_length=1, max_length=80)
    strategy_name: str = Field(min_length=1, max_length=120)
    code: str = Field(min_length=1, max_length=64_000)


class ParallelEvaluationRequest(BaseModel):
    candidates: list[CandidateInput] = Field(min_length=1, max_length=10)
    tests: str = Field(min_length=1, max_length=64_000)
    timeout_seconds: int = Field(default=5, ge=1, le=30)
    max_concurrency: int = Field(default=3, ge=1, le=5)


@router.post("/evaluate")
async def evaluate_candidates(
    request: ParallelEvaluationRequest,
) -> dict[str, Any]:
    try:
        return await run_parallel_evaluation(
            candidates=[
                candidate.model_dump()
                for candidate in request.candidates
            ],
            tests=request.tests,
            timeout_seconds=request.timeout_seconds,
            max_concurrency=request.max_concurrency,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


async def benchmark_passing_candidates(
    ranked_candidates: list[dict[str, Any]],
    function_name: str,
    benchmark_cases: list[dict[str, Any]],
    repetitions: int = 20,
    warmups: int = 3,
    rounds: int = 5,
) -> list[dict[str, Any]]:
    """Benchmark only candidates that passed deterministic evaluation."""

    async def benchmark_one(candidate: dict[str, Any]) -> None:
        result = candidate["result"]

        if not (
            result.get("status") == "completed"
            and result.get("passed") is True
            and result.get("failed_tests", 0) == 0
        ):
            return

        try:
            metrics = await asyncio.to_thread(
                benchmark_python,
                candidate["code"],
                function_name,
                benchmark_cases,
                repetitions,
                warmups,
                rounds,
            )

            result["benchmark"] = metrics

            if metrics.get("status") == "completed":
                result["benchmark_median_ms"] = metrics[
                    "benchmark_median_ms"
                ]

        except Exception as exc:
            # A benchmark failure must not erase a successful test result.
            result["benchmark"] = {
                "status": "benchmark_error",
                "error": str(exc),
            }

    await asyncio.gather(
        *(
            benchmark_one(candidate)
            for candidate in ranked_candidates
        )
    )

    return ranked_candidates



class PlanAndEvaluateRequest(BaseModel):
    task_description: str = Field(min_length=10, max_length=12_000)
    tests: str = Field(min_length=1, max_length=64_000)
    timeout_seconds: int = Field(default=5, ge=1, le=30)
    max_concurrency: int = Field(default=3, ge=1, le=3)
    function_name: str | None = Field(default=None, max_length=100)
    benchmark_cases: list[dict[str, Any]] | None = Field(
        default=None,
        max_length=20,
    )
    benchmark_repetitions: int = Field(default=20, ge=5, le=200)
    benchmark_warmups: int = Field(default=3, ge=0, le=20)
    benchmark_rounds: int = Field(default=5, ge=1, le=10)


@router.post("/plan-and-evaluate")
async def plan_and_evaluate(
    request: PlanAndEvaluateRequest,
) -> dict[str, Any]:
    try:
        # 1. Generate strategies with Gemini.
        plan = await generate_strategies(request.task_description)

        # 2. Convert the plan into the existing engine's input format.
        candidates = [
            {
                "candidate_id": f"strategy-{index}",
                "strategy_name": item.strategy_name,
                "code": item.code,
            }
            for index, item in enumerate(plan.candidates, start=1)
        ]
        candidate_code = {
            candidate["candidate_id"]: candidate["code"]
            for candidate in candidates
        }

        # 3. Run the existing pruning, sandbox evaluation, and ranking.
        results = await run_parallel_evaluation(
            candidates=candidates,
            tests=request.tests,
            timeout_seconds=request.timeout_seconds,
            max_concurrency=request.max_concurrency,
        )

        if request.benchmark_cases is not None:
            if not request.function_name:
                raise HTTPException(
                    status_code=422,
                    detail="function_name is required when benchmark_cases are supplied.",
                )

            for candidate in results["ranked_candidates"]:
                candidate["code"] = candidate_code[candidate["candidate_id"]]

            await benchmark_passing_candidates(
                results["ranked_candidates"],
                request.function_name,
                request.benchmark_cases,
                request.benchmark_repetitions,
                request.benchmark_warmups,
                request.benchmark_rounds,
            )

            # Re-rank using correctness and actual benchmark medians.
            results["ranked_candidates"] = rank_candidates(
                results["ranked_candidates"]
            )

            # Do not expose candidate source code in the response.
            for candidate in results["ranked_candidates"]:
                candidate.pop("code", None)

        # 4. Return the planner's explanations alongside measured results.
        explanations = {
            f"strategy-{index}": {
                "approach": item.approach,
                "rationale": item.rationale,
            }
            for index, item in enumerate(plan.candidates, start=1)
        }

        return {
            "task_description": request.task_description,
            "planner": "Google Gemini",
            "strategies": explanations,
            "evaluation": results,
        }

    except PlannerError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=422,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        raise HTTPException(
            status_code=503,
            detail=str(exc),
        ) from exc

