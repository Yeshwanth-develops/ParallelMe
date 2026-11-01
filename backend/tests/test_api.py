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
    assert response.status_code in (200, 503)
    if response.status_code == 200:
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
    assert response.status_code in (200, 503)
    if response.status_code == 200:
        data = response.json()
        assert data["status"] == "completed"
        assert data["passed"] is True
        assert data["passed_tests"] == 1
        assert data["failed_tests"] == 0


def test_tasks_plan_and_evaluate_validation():
    response = client.post(
        "/api/tasks/plan-and-evaluate",
        json={
            "task_description": "short",
            "tests": "assert True",
        },
    )
    assert response.status_code == 422


def test_tasks_plan_and_evaluate_dataset_conflicts():
    # Both dataset and cases supplied
    response = client.post(
        "/api/tasks/plan-and-evaluate",
        json={
            "task_description": "Valid task description for testing.",
            "tests": "def test(): assert True",
            "benchmark_dataset": "two_sum",
            "benchmark_cases": [{"args": [1], "expected": 1}],
            "function_name": "two_sum",
        },
    )
    assert response.status_code == 422
    assert "Provide either benchmark_dataset or benchmark_cases" in response.json()["detail"]


def test_tasks_plan_and_evaluate_two_sum_function_name_required():
    response = client.post(
        "/api/tasks/plan-and-evaluate",
        json={
            "task_description": "Valid task description for testing.",
            "tests": "def test(): assert True",
            "benchmark_dataset": "two_sum",
            "function_name": "other_func",
        },
    )
    assert response.status_code == 422
    assert "The two_sum dataset requires function_name='two_sum'" in response.json()["detail"]

