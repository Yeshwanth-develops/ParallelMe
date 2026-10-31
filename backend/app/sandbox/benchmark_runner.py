
from __future__ import annotations

import json
from typing import Any

from app.sandbox.docker_manager import (
    MAX_CODE_BYTES,
    _run_container,
)


def _benchmark_script() -> str:
    return r'''
import contextlib
import copy
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
rounds = config["rounds"]
case_results = []

for case_index, case in enumerate(config["cases"]):
    args_template = case.get("args", [])
    kwargs_template = case.get("kwargs", {})
    expected = case["expected"]
    all_samples = []
    round_medians = []
    round_results = []

    for round_index in range(rounds):
        # Warm up independently for each round.
        for _ in range(warmups):
            args = copy.deepcopy(args_template)
            kwargs = copy.deepcopy(kwargs_template)

            with contextlib.redirect_stdout(io.StringIO()):
                with contextlib.redirect_stderr(io.StringIO()):
                    actual = function(*args, **kwargs)

            if actual != expected:
                raise AssertionError(
                    f"Incorrect output in case {case_index}, "
                    f"round {round_index}"
                )

        round_samples = []
        for _ in range(repetitions):
            args = copy.deepcopy(args_template)
            kwargs = copy.deepcopy(kwargs_template)

            with contextlib.redirect_stdout(io.StringIO()):
                with contextlib.redirect_stderr(io.StringIO()):
                    started = time.perf_counter_ns()
                    actual = function(*args, **kwargs)
                    elapsed_ms = (
                        time.perf_counter_ns() - started
                    ) / 1_000_000

            # Output comparison is deliberately outside the timed interval.
            if actual != expected:
                raise AssertionError(
                    f"Incorrect output for case {case_index}: "
                    f"expected {expected!r}, got {actual!r}"
                )

            round_samples.append(elapsed_ms)
            all_samples.append(elapsed_ms)

        round_ordered = sorted(round_samples)
        round_p95_index = min(
            len(round_ordered) - 1,
            max(0, math.ceil(0.95 * len(round_ordered)) - 1),
        )
        round_median = statistics.median(round_samples)
        round_medians.append(round_median)
        round_results.append({
            "round_index": round_index,
            "median_ms": round_median,
            "p95_ms": round_ordered[round_p95_index],
            "repetitions": repetitions,
        })

    ordered = sorted(all_samples)
    p95_index = min(
        len(ordered) - 1,
        max(0, math.ceil(0.95 * len(ordered)) - 1),
    )

    case_results.append({
        "case_index": case_index,
        "median_ms": statistics.median(round_medians),
        "p95_ms": ordered[p95_index],
        "repetitions": repetitions,
        "rounds": rounds,
        "round_results": round_results,
        "correct": True,
    })

print(
    "PARALLELME_BENCHMARK=" + json.dumps({
        "cases": case_results,
        "benchmark_median_ms": statistics.median(
            item["median_ms"] for item in case_results
        ),
        "rounds": rounds,
        "correct": True,
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
    rounds: int = 5,
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

    if not 1 <= rounds <= 10:
        raise ValueError("Benchmark rounds must be between 1 and 10.")

    if timeout_seconds < 1:
        raise ValueError("Timeout must be at least 1 second.")

    for index, case in enumerate(cases):
        if not isinstance(case, dict):
            raise ValueError(f"Benchmark case {index} must be an object.")

        if "expected" not in case:
            raise ValueError(
                f"Benchmark case {index} must include an expected value."
            )

        if not isinstance(case.get("args", []), list):
            raise ValueError(
                f"Benchmark case {index}: args must be a list."
            )

        if not isinstance(case.get("kwargs", {}), dict):
            raise ValueError(
                f"Benchmark case {index}: kwargs must be an object."
            )

    config = {
        "function_name": function_name,
        "cases": cases,
        "repetitions": repetitions,
        "warmups": warmups,
        "rounds": rounds,
    }

    try:
        config_json = json.dumps(config)
    except (TypeError, ValueError) as exc:
        raise ValueError(
            "Benchmark cases must contain JSON-serializable values."
        ) from exc

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
            "correct": False,
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
            "correct": False,
            "error": "Benchmark runner did not return metrics.",
        }

    try:
        metrics = json.loads(payload)
    except json.JSONDecodeError:
        return {
            "status": "benchmark_failed",
            "passed": False,
            "correct": False,
            "error": "Benchmark runner returned invalid metrics.",
        }

    return {
        "status": "completed",
        "passed": True,
        "correct": metrics["correct"],
        "benchmark_median_ms": metrics["benchmark_median_ms"],
        "cases": metrics["cases"],
        "rounds": metrics.get("rounds", rounds),
        "duration_ms": result["duration_ms"],
    }
