
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.sandbox.docker_manager import execute_python

router = APIRouter(prefix="/api/sandbox", tags=["sandbox"])


class ExecuteRequest(BaseModel):
    code: str = Field(min_length=1, max_length=64_000)
    timeout_seconds: int = Field(default=5, ge=1, le=30)


@router.post("/execute")
def execute_code(request: ExecuteRequest) -> dict[str, Any]:
    try:
        return execute_python(
            code=request.code,
            timeout_seconds=request.timeout_seconds,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
