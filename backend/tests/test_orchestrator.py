import pytest
from app.orchestrator.pruning import validate_candidate, check_duplicate, code_fingerprint
from app.orchestrator.ranker import rank_candidates
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_syntax_validation():
    valid_code = "def add(a, b): return a + b"
    assert validate_candidate(valid_code) is None

    invalid_code = "def add(a, b: return a + b"
    result = validate_candidate(invalid_code)
    assert result is not None
    assert result["status"] == "pruned"
    assert result["reason"] == "invalid_syntax"


def test_duplicate_detection():
    seen = {}
    code1 = "print('hello')"
    dup, fp = check_duplicate(code1, seen)
    assert dup is None
    seen[fp] = "cand-1"

    dup2, fp2 = check_duplicate(code1, seen)
    assert dup2 == "cand-1"


def test_candidate_ranking():
    candidates = [
        {
            "candidate_id": "c1",
            "strategy_name": "s1",
            "result": {
                "status": "completed",
                "passed": True,
                "passed_tests": 5,
                "failed_tests": 0,
                "duration_ms": 120,
            },
        },
        {
            "candidate_id": "c2",
            "strategy_name": "s2",
            "result": {
                "status": "completed",
                "passed": True,
                "passed_tests": 5,
                "failed_tests": 0,
                "duration_ms": 80,
            },
        },
        {
            "candidate_id": "c3",
            "strategy_name": "s3",
            "result": {
                "status": "completed",
                "passed": False,
                "passed_tests": 3,
                "failed_tests": 2,
                "duration_ms": 50,
            },
        },
    ]

    ranked = rank_candidates(candidates)
    assert [c["candidate_id"] for c in ranked] == ["c2", "c1", "c3"]
    assert ranked[0]["rank"] == 1
    assert ranked[1]["rank"] == 2
    assert ranked[2]["rank"] == 3


def test_tasks_api_validation_and_pruning():
    # If all candidates are pruned due to syntax or duplicate, Docker isn't even touched
    payload = {
        "candidates": [
            {
                "candidate_id": "cand-syntax-err",
                "strategy_name": "broken",
                "code": "def func(: broken",
            },
            {
                "candidate_id": "cand-dup-1",
                "strategy_name": "dup-first",
                "code": "def valid(): return 1",
            },
            {
                "candidate_id": "cand-dup-2",
                "strategy_name": "dup-second",
                "code": "def valid(): return 1",
            },
        ],
        "tests": "assert True",
        "timeout_seconds": 5,
        "max_concurrency": 2,
    }

    response = client.post("/api/tasks/evaluate", json=payload)
    # Cand 1 is pruned for syntax, cand 3 is pruned as duplicate of cand 2.
    # Cand 2 would try docker unless docker is unavailable (503) or succeeds (200).
    assert response.status_code in (200, 503)
