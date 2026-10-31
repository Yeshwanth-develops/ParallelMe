
from app.orchestrator.ranker import rank_candidates


def make_candidate(candidate_id, passed, failed, duration=None):
    result = {
        "status": "completed" if failed == 0 else "tests_failed",
        "passed": failed == 0,
        "passed_tests": passed,
        "failed_tests": failed,
        "duration_ms": 1200,
    }

    if duration is not None:
        result["benchmark_median_ms"] = duration

    return {
        "candidate_id": candidate_id,
        "strategy_name": candidate_id,
        "result": result,
    }


def test_equal_correctness_without_benchmarks_is_a_tie():
    candidates = [
        make_candidate("a", 3, 0),
        make_candidate("b", 3, 0),
        make_candidate("c", 3, 0),
    ]

    ranked = rank_candidates(candidates)

    assert [item["rank"] for item in ranked] == [1, 1, 1]
    assert all(not item["performance_measured"] for item in ranked)


def test_correct_candidate_ranks_above_failing_candidate():
    candidates = [
        make_candidate("bad", 1, 2),
        make_candidate("good", 3, 0),
    ]

    ranked = rank_candidates(candidates)

    assert ranked[0]["candidate_id"] == "good"
    assert ranked[0]["rank"] == 1
    assert ranked[1]["rank"] == 2


def test_benchmark_median_breaks_correctness_tie():
    candidates = [
        make_candidate("slower", 3, 0, duration=4.2),
        make_candidate("faster", 3, 0, duration=1.7),
    ]

    ranked = rank_candidates(candidates)

    assert ranked[0]["candidate_id"] == "faster"
    assert ranked[0]["rank"] == 1
    assert ranked[1]["rank"] == 2
