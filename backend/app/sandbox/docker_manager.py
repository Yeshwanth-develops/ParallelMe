
from __future__ import annotations

import io
import tarfile
import time
from typing import Any

import docker
from docker.errors import DockerException, ImageNotFound


SANDBOX_IMAGE = "parallelme-sandbox:latest"
DEFAULT_TIMEOUT_SECONDS = 5
MAX_CODE_BYTES = 64 * 1024
MAX_OUTPUT_BYTES = 16 * 1024


def _create_code_archive(code: str) -> bytes:
    """Package candidate code for transfer into the isolated container."""
    encoded = code.encode("utf-8")

    if len(encoded) > MAX_CODE_BYTES:
        raise ValueError(
            f"Code exceeds the {MAX_CODE_BYTES}-byte size limit."
        )

    archive_buffer = io.BytesIO()

    with tarfile.open(fileobj=archive_buffer, mode="w") as archive:
        info = tarfile.TarInfo(name="main.py")
        info.size = len(encoded)
        info.mode = 0o444
        info.uid = 10001
        info.gid = 10001
        info.uname = "sandbox"
        info.gname = "sandbox"
        archive.addfile(info, io.BytesIO(encoded))

    archive_buffer.seek(0)
    return archive_buffer.read()


def execute_python(
    code: str,
    timeout_seconds: int = DEFAULT_TIMEOUT_SECONDS,
) -> dict[str, Any]:
    """
    Execute Python code in a disposable, resource-limited Docker container.

    This is an initial execution primitive, not yet the complete pytest
    evaluation engine.
    """
    if not 1 <= timeout_seconds <= 30:
        raise ValueError("Timeout must be between 1 and 30 seconds.")

    archive = _create_code_archive(code)
    client = docker.from_env()
    container = None
    started_at = time.monotonic()

    try:
        try:
            client.images.get(SANDBOX_IMAGE)
        except ImageNotFound as exc:
            raise RuntimeError(
                f"Sandbox image '{SANDBOX_IMAGE}' was not found. "
                "Build it using the sandbox Dockerfile first."
            ) from exc

        container = client.containers.create(
            image=SANDBOX_IMAGE,
            command=["python", "-I", "/workspace/main.py"],
            user="10001:10001",
            working_dir="/workspace",
            network_mode="none",
            mem_limit="256m",
            cpu_period=100000,
            cpu_quota=50000,
            pids_limit=64,
            cap_drop=["ALL"],
            security_opt=["no-new-privileges:true"],
            tmpfs={
                "/tmp": "rw,nosuid,nodev,size=16m",
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

        uploaded = container.put_archive("/workspace", archive)
        if not uploaded:
            raise RuntimeError("Failed to transfer candidate code.")

        container.start()
        deadline = started_at + timeout_seconds

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
                "stdout": "",
                "stderr": "",
                "duration_ms": round(
                    (time.monotonic() - started_at) * 1000
                ),
            }

        exit_info = container.wait(timeout=3)
        logs = container.logs(stdout=True, stderr=False)
        errors = container.logs(stdout=False, stderr=True)

        stdout = logs.decode("utf-8", errors="replace")
        stderr = errors.decode("utf-8", errors="replace")

        return {
            "status": "completed",
            "passed": exit_info.get("StatusCode", 1) == 0,
            "exit_code": exit_info.get("StatusCode", 1),
            "stdout": stdout[-MAX_OUTPUT_BYTES:],
            "stderr": stderr[-MAX_OUTPUT_BYTES:],
            "duration_ms": round(
                (time.monotonic() - started_at) * 1000
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

        client.close()
