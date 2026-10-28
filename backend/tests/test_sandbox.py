import docker
import pytest
from app.sandbox.docker_manager import execute_python


def _is_docker_available() -> bool:
    try:
        client = docker.from_env()
        client.ping()
        return True
    except Exception:
        return False


pytestmark = pytest.mark.skipif(
    not _is_docker_available(),
    reason="Docker daemon is not accessible on this host",
)


def test_sandbox_simple_execution():
    result = execute_python("print('Hello from ParallelMe Sandbox!')", timeout_seconds=5)
    assert result["status"] == "completed"
    assert result["passed"] is True
    assert "Hello from ParallelMe Sandbox!" in result["stdout"]


def test_sandbox_runtime_error():
    result = execute_python("raise ValueError('Test error')", timeout_seconds=5)
    assert result["status"] == "completed"
    assert result["passed"] is False
    assert "ValueError: Test error" in result["stderr"]


def test_sandbox_timeout():
    result = execute_python("import time\ntime.sleep(10)", timeout_seconds=2)
    assert result["status"] == "timeout"
    assert result["passed"] is False


def test_sandbox_network_isolation():
    code = """
import urllib.request
try:
    urllib.request.urlopen("https://example.com", timeout=1)
    print("ONLINE")
except Exception as e:
    print(f"OFFLINE: {e}")
"""
    result = execute_python(code, timeout_seconds=5)
    assert result["status"] == "completed"
    assert "OFFLINE" in result["stdout"]
