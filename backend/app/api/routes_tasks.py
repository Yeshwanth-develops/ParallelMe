
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

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
