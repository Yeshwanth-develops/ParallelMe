import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "ParallelMe"
    assert data["message"] == "ParallelMe API is running"


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


def test_sandbox_execute_api():
    response = client.post(
        "/api/sandbox/execute",
        json={"code": "print('API sandbox test')", "timeout_seconds": 5},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["passed"] is True
    assert "API sandbox test" in data["stdout"]


def test_evaluation_evaluate_api():
    response = client.post(
        "/api/evaluation/evaluate",
        json={
            "code": "def multiply(x, y): return x * y",
            "tests": "from main import multiply\ndef test_multiply(): assert multiply(3, 4) == 12",
            "timeout_seconds": 5,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["passed"] is True
    assert data["passed_tests"] == 1
    assert data["failed_tests"] == 0
