
from __future__ import annotations

import asyncio
import hashlib
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field, ValidationError, field_validator
from typing import Literal


load_dotenv()


class PlannedCandidate(BaseModel):
    strategy_name: str = Field(min_length=3, max_length=100)
    approach: Literal[
        "straightforward",
        "algorithmic",
        "optimized",
    ]
    rationale: str = Field(min_length=10, max_length=1000)
    code: str = Field(min_length=1, max_length=64000)

    @field_validator("code")
    @classmethod
    def validate_python_syntax(cls, value: str) -> str:
        import ast

        clean = value.strip()
        if clean.startswith("```python"):
            clean = clean[9:]
        elif clean.startswith("```"):
            clean = clean[3:]
        if clean.endswith("```"):
            clean = clean[:-3]
        clean = clean.strip()

        try:
            ast.parse(clean)
        except SyntaxError as exc:
            raise ValueError(f"Invalid Python syntax: {exc}") from exc
        return clean


class PlannerOutput(BaseModel):
    candidates: list[PlannedCandidate]


class PlannerError(Exception):
    """Raised when the planner cannot produce a valid plan."""


def _fingerprint(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _validate_plan(plan: PlannerOutput) -> PlannerOutput:
    if len(plan.candidates) != 3:
        raise PlannerError("Planner must return exactly three candidates.")

    approaches = {item.approach for item in plan.candidates}
    if len(approaches) != 3:
        raise PlannerError(
            "Planner must provide all three required approaches."
        )

    fingerprints = [_fingerprint(item.code) for item in plan.candidates]
    if len(set(fingerprints)) != 3:
        raise PlannerError(
            "Planner returned duplicate code. Please try again."
        )

    names = [item.strategy_name.strip().casefold() for item in plan.candidates]
    if len(set(names)) != 3:
        raise PlannerError("Planner returned duplicate strategy names.")

    return plan


async def generate_strategies(
    task_description: str,
) -> PlannerOutput:
    api_key = os.getenv("GEMINI_API_KEY")
    configured_model = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
    models_to_try = [configured_model]
    for fallback in ["gemini-3.1-flash-lite", "gemini-flash-latest"]:
        if fallback not in models_to_try:
            models_to_try.append(fallback)

    if not api_key:
        raise PlannerError(
            "GEMINI_API_KEY is not configured in backend/.env."
        )

    if not task_description.strip():
        raise PlannerError("Task description cannot be empty.")

    if len(task_description) > 12000:
        raise PlannerError("Task description is too long.")

    prompt = f"""
You are the planning component of ParallelMe, a coding strategy
experimentation system.

Generate exactly THREE distinct Python implementations for the task below.

TASK:
{task_description}

Required approaches:
1. straightforward: simple, readable, direct implementation.
2. algorithmic: a meaningfully different algorithm or decomposition.
3. optimized: an approach designed to improve time or space complexity
   when the task permits it.

Requirements:
- Return Python code only inside each candidate's code field.
- Include the required function(s) in the code.
- Do not include Markdown fences.
- Do not include tests, file operations, network calls, subprocesses,
  or external dependencies.
- Do not merely rename variables or reformat the same implementation.
- Each approach must solve the same specification.
- State the rationale briefly and accurately.
- Do not claim an implementation is correct or faster without evidence.
- Follow the required structured output schema exactly.
"""

    client = genai.Client(api_key=api_key)

    try:
        last_error: Exception | None = None
        for current_model in models_to_try:
            try:
                response = await client.aio.models.generate_content(
                    model=current_model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=PlannerOutput,
                        temperature=0.7,
                    ),
                )

                if not response.text:
                    raise PlannerError("Gemini returned an empty response.")

                raw_text = response.text.strip()
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                elif raw_text.startswith("```"):
                    raw_text = raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                raw_text = raw_text.strip()

                plan = PlannerOutput.model_validate_json(raw_text)
                return _validate_plan(plan)

            except PlannerError:
                raise
            except ValidationError as exc:
                raise PlannerError(
                    "Gemini returned a plan that failed schema validation."
                ) from exc
            except Exception as exc:
                last_error = exc
                continue

        raise PlannerError(
            "Gemini strategy generation failed. Check server logs and "
            "verify the model name, API key, quota, and network access."
        ) from last_error
    finally:
        await client.aio.aclose()
