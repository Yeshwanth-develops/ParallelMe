from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.agents.planner import PlannerError, generate_strategies
from app.orchestrator.engine import run_parallel_evaluation

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


class PlanAndEvaluateRequest(BaseModel):
    task_description: str = Field(min_length=10, max_length=12_000)
    tests: str = Field(min_length=1, max_length=64_000)
    timeout_seconds: int = Field(default=5, ge=1, le=30)
    max_concurrency: int = Field(default=3, ge=1, le=3)


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

        # 3. Run the existing pruning, sandbox evaluation, and ranking.
        results = await run_parallel_evaluation(
            candidates=candidates,
            tests=request.tests,
            timeout_seconds=request.timeout_seconds,
            max_concurrency=request.max_concurrency,
        )

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

