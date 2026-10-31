
from __future__ import annotations

import json
import math
import statistics
import time
from typing import Any

import docker
from docker.errors import DockerException

from app.sandbox.docker_manager import (
    MAX_CODE_BYTES,
    SANDBOX_IMAGE,
    _run_container,
)


def _benchmark_script() -> str:
    return r'''
import contextlib
import importlib.util
import io
import json
import math
import statistics
import time

with open("/workspace/cases.json", encoding="utf-8") as file:
    config = json.load(file)

spec = importlib.util.spec_from_file_location(
    "candidate_module", "/workspace/main.py"
)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

function = getattr(module, config["function_name"])
warmups = config["warmups"]
repetitions = config["repetitions"]
case_results = []

for case_index, case in enumerate(config["cases"]):
    args = case.get("args", [])
    kwargs = case.get("kwargs", {})
    samples = []

    # Suppress candidate prints so benchmark output stays machine-readable.
    for _ in range(warmups):
        with contextlib.redirect_stdout(io.StringIO()):
            with contextlib.redirect_stderr(io.StringIO()):
                function(*args, **kwargs)

    for _ in range(repetitions):
        started = time.perf_counter_ns()
        with contextlib.redirect_stdout(io.StringIO()):
            with contextlib.redirect_stderr(io.StringIO()):
                function(*args, **kwargs)
        elapsed_ms = (time.perf_counter_ns() - started) / 1_000_000
        samples.append(elapsed_ms)

    ordered = sorted(samples)
    p95_index = min(
        len(ordered) - 1,
        max(0, math.ceil(0.95 * len(ordered)) - 1),
    )

    case_results.append({
        "case_index": case_index,
        "median_ms": statistics.median(samples),
        "p95_ms": ordered[p95_index],
        "repetitions": repetitions,
    })

print(
    "PARALLELME_BENCHMARK=" + json.dumps({
        "cases": case_results,
        "benchmark_median_ms": statistics.median(
            item["median_ms"] for item in case_results
        ),
    }),
    flush=True,
)
'''


def benchmark_python(
    code: str,
    function_name: str,
    cases: list[dict[str, Any]],
    repetitions: int = 20,
    warmups: int = 3,
    timeout_seconds: int = 10,
) -> dict[str, Any]:
    if len(code.encode("utf-8")) > MAX_CODE_BYTES:
        raise ValueError("Candidate code is too large.")

    if not function_name.isidentifier():
        raise ValueError("Invalid Python function name.")

    if not cases or len(cases) > 20:
        raise ValueError("Provide between 1 and 20 benchmark cases.")

    if not 5 <= repetitions <= 200:
        raise ValueError("Repetitions must be between 5 and 200.")

    if not 0 <= warmups <= 20:
        raise ValueError("Warm-ups must be between 0 and 20.")

    config = {
        "function_name": function_name,
        "cases": cases,
        "repetitions": repetitions,
        "warmups": warmups,
    }

    config_json = json.dumps(config)
    if len(config_json.encode("utf-8")) > 64 * 1024:
        raise ValueError("Benchmark input data is too large.")

    result = _run_container(
        {
            "main.py": code,
            "cases.json": config_json,
            "run_benchmark.py": _benchmark_script(),
        },
        ["python", "-I", "/workspace/run_benchmark.py"],
        timeout_seconds,
    )

    if result.get("status") != "completed" or not result.get("passed"):
        return {
            "status": result.get("status", "benchmark_failed"),
            "passed": False,
            "error": result.get("stderr") or result.get("stdout"),
            "duration_ms": result.get("duration_ms"),
        }

    marker = "PARALLELME_BENCHMARK="
    payload = next(
        (
            line[len(marker):]
            for line in result.get("stdout", "").splitlines()
            if line.startswith(marker)
        ),
        None,
    )

    if payload is None:
        return {
            "status": "benchmark_failed",
            "passed": False,
            "error": "Benchmark runner did not return metrics.",
        }

    metrics = json.loads(payload)

    return {
        "status": "completed",
        "passed": True,
        "benchmark_median_ms": metrics["benchmark_median_ms"],
        "cases": metrics["cases"],
        "duration_ms": result["duration_ms"],
    }
