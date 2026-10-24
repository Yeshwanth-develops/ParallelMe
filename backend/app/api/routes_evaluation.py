
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.sandbox.docker_manager import evaluate_python

router = APIRouter(prefix="/api/evaluation", tags=["evaluation"])


class EvaluationRequest(BaseModel):
    code: str = Field(min_length=1, max_length=64_000)
    tests: str = Field(min_length=1, max_length=64_000)
    timeout_seconds: int = Field(default=5, ge=1, le=30)


@router.post("/evaluate")
def evaluate(request: EvaluationRequest) -> dict[str, Any]:
    try:
        return evaluate_python(
            code=request.code,
            tests=request.tests,
            timeout_seconds=request.timeout_seconds,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
