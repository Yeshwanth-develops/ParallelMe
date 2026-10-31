
from __future__ import annotations

import ast
import io
import json
import re
import tarfile
import time
from typing import Any

import docker
from docker.errors import DockerException, ImageNotFound

SANDBOX_IMAGE = "parallelme-sandbox:latest"
MAX_CODE_BYTES = 64 * 1024
MAX_TEST_BYTES = 64 * 1024
MAX_OUTPUT_BYTES = 16 * 1024


def _build_pytest_runner() -> str:
    """Measure pytest wall time inside the sandbox."""
    return r'''
import json
import time
import pytest

started = time.perf_counter()
exit_code = int(pytest.main([
    "-q",
    "-p", "no:cacheprovider",
    "/workspace/test_main.py",
]))
execution_ms = (time.perf_counter() - started) * 1000

print(
    "PARALLELME_METRICS=" + json.dumps({
        "execution_duration_ms": round(execution_ms, 3),
        "pytest_exit_code": exit_code,
    }),
    flush=True,
)
raise SystemExit(exit_code)
'''


def _create_archive(files: dict[str, str]) -> bytes:
    buffer = io.BytesIO()

    with tarfile.open(fileobj=buffer, mode="w") as archive:
        for filename, content in files.items():
            encoded = content.encode("utf-8")
            info = tarfile.TarInfo(filename)
            info.size = len(encoded)
            info.mode = 0o444
            info.uid = 10001
            info.gid = 10001
            archive.addfile(info, io.BytesIO(encoded))

    buffer.seek(0)
    return buffer.read()


def _validate_syntax(code: str) -> dict[str, Any] | None:
    try:
        ast.parse(code)
        return None
    except SyntaxError as exc:
        return {
            "status": "invalid_syntax",
            "passed": False,
            "syntax_error": {
                "message": exc.msg,
                "line": exc.lineno,
                "offset": exc.offset,
            },
            "passed_tests": 0,
            "failed_tests": 0,
            "duration_ms": 0,
        }


_docker_client: docker.DockerClient | None = None


def _get_docker_client() -> docker.DockerClient:
    global _docker_client
    if _docker_client is None:
        _docker_client = docker.from_env()
    else:
        try:
            _docker_client.ping()
        except Exception:
            _docker_client = docker.from_env()
    return _docker_client


def _run_container(
    files: dict[str, str],
    command: list[str],
    timeout_seconds: int,
) -> dict[str, Any]:
    archive = _create_archive(files)
    container = None

    try:
        try:
            client = _get_docker_client()
        except DockerException as exc:
            raise RuntimeError(
                f"Docker daemon is not accessible: {exc}"
            ) from exc

        try:
            client.images.get(SANDBOX_IMAGE)
        except ImageNotFound as exc:
            raise RuntimeError(
                f"Sandbox image '{SANDBOX_IMAGE}' is missing."
            ) from exc

        container = client.containers.create(
            image=SANDBOX_IMAGE,
            command=command,
            user="10001:10001",
            working_dir="/workspace",
            network_mode="none",
            read_only=False,
            mem_limit="256m",
            cpu_period=100000,
            cpu_quota=100000,
            pids_limit=64,
            cap_drop=["ALL"],
            security_opt=["no-new-privileges:true"],
            tmpfs={
                "/tmp": "rw,noexec,nosuid,nodev,size=16m",
            },
            environment={
                "PYTHONDONTWRITEBYTECODE": "1",
                "PYTHONUNBUFFERED": "1",
            },
            log_config=docker.types.LogConfig(
                type="json-file",
                config={"max-size": "1m", "max-file": "1"},
            ),
        )

        if not container.put_archive("/workspace", archive):
            raise RuntimeError("Could not copy files into sandbox.")

        container.start()
        exec_started = time.monotonic()
        deadline = exec_started + timeout_seconds

        while time.monotonic() < deadline:
            container.reload()
            if container.status == "exited":
                break
            time.sleep(0.05)
        else:
            container.kill()
            return {
                "status": "timeout",
                "passed": False,
                "passed_tests": 0,
                "failed_tests": 0,
                "duration_ms": round(
                    (time.monotonic() - exec_started) * 1000
                ),
            }

        result = container.wait(timeout=3)
        stdout = container.logs(
            stdout=True, stderr=False
        ).decode("utf-8", errors="replace")
        stderr = container.logs(
            stdout=False, stderr=True
        ).decode("utf-8", errors="replace")

        return {
            "status": "completed",
            "passed": result.get("StatusCode", 1) == 0,
            "exit_code": result.get("StatusCode", 1),
            "stdout": stdout[-MAX_OUTPUT_BYTES:],
            "stderr": stderr[-MAX_OUTPUT_BYTES:],
            "duration_ms": round(
                (time.monotonic() - exec_started) * 1000
            ),
        }

    except DockerException as exc:
        raise RuntimeError(f"Docker execution failed: {exc}") from exc

    finally:
        if container is not None:
            try:
                container.remove(force=True)
            except DockerException:
                pass


def execute_python(
    code: str,
    timeout_seconds: int = 5,
) -> dict[str, Any]:
    if not 1 <= timeout_seconds <= 30:
        raise ValueError("Timeout must be between 1 and 30 seconds.")

    if len(code.encode("utf-8")) > MAX_CODE_BYTES:
        raise ValueError("Candidate code is too large.")

    syntax_error = _validate_syntax(code)
    if syntax_error:
        return syntax_error

    result = _run_container(
        {"main.py": code},
        ["python", "-I", "/workspace/main.py"],
        timeout_seconds,
    )
    result.setdefault("passed_tests", 0)
    result.setdefault("failed_tests", 0)
    return result


def evaluate_python(
    code: str,
    tests: str,
    timeout_seconds: int = 5,
) -> dict[str, Any]:
    """Evaluate candidate Python code using isolated pytest execution."""
    if not 1 <= timeout_seconds <= 30:
        raise ValueError("Timeout must be between 1 and 30 seconds.")

    if len(code.encode("utf-8")) > MAX_CODE_BYTES:
        raise ValueError("Candidate code is too large.")

    if len(tests.encode("utf-8")) > MAX_TEST_BYTES:
        raise ValueError("Test code is too large.")

    syntax_error = _validate_syntax(code)
    if syntax_error:
        return syntax_error

    test_syntax_error = _validate_syntax(tests)
    if test_syntax_error:
        return {
            **test_syntax_error,
            "status": "invalid_test_syntax",
        }

    result = _run_container(
        {
            "main.py": code,
            "test_main.py": tests,
            "run_tests.py": _build_pytest_runner(),
        },
        ["python", "-I", "/workspace/run_tests.py"],
        timeout_seconds,
    )

    output = result.get("stdout", "") + "\n" + result.get("stderr", "")

    # Extract the runner's in-container measurement.
    metrics = None
    for line in output.splitlines():
        if line.startswith("PARALLELME_METRICS="):
            try:
                metrics = json.loads(
                    line.removeprefix("PARALLELME_METRICS=")
                )
            except json.JSONDecodeError:
                metrics = None

    if metrics:
        result["execution_duration_ms"] = metrics["execution_duration_ms"]
    else:
        result["execution_duration_ms"] = None

    # Parse pytest's final summary line, not arbitrary candidate output.
    summary_lines = [
        line.strip()
        for line in output.splitlines()
        if re.search(r"\b(passed|failed|error|skipped)\b", line)
        and not line.startswith("PARALLELME_METRICS=")
    ]
    final_summary = summary_lines[-1] if summary_lines else ""


    def count(label: str) -> int:
        match = re.search(rf"(\d+)\s+{label}\b", final_summary)
        return int(match.group(1)) if match else 0


    passed = count("passed")
    failed = count("failed") + count("error")

    result.update({
        "passed_tests": passed,
        "failed_tests": failed,
        "skipped_tests": count("skipped"),
        "passed": result.get("exit_code") == 0 and failed == 0,
    })

    if result.get("status") == "completed" and result.get("exit_code") != 0:
        result["status"] = "tests_failed"

    return result

