
from app.sandbox.benchmark_runner import benchmark_python


def test_two_sum_benchmark():
    code = """
def two_sum(nums, target):
    seen = {}
    for index, value in enumerate(nums):
        complement = target - value
        if complement in seen:
            return [seen[complement], index]
        seen[value] = index
    raise ValueError("No pair found")
"""

    result = benchmark_python(
        code=code,
        function_name="two_sum",
        cases=[
            {
                "args": [[2, 7, 11, 15], 9],
                "expected": [0, 1],
                "kwargs": {},
            },
            {
                "args": [[-3, 4, 3, 90], 0],
                "expected": [0, 2],
                "kwargs": {},
            },
        ],
        repetitions=5,
        warmups=1,
        timeout_seconds=10,
    )

    assert result["status"] == "completed"
    assert result["passed"] is True
    assert result["correct"] is True
    assert result["benchmark_median_ms"] >= 0
    assert result["rounds"] == 5
    assert len(result["cases"]) == 2
    assert all(len(case["rounds"]) == 5 for case in result["cases"])
    assert all(case["correct"] is True for case in result["cases"])
    assert all(case["total_samples"] == 25 for case in result["cases"])
    assert result["cases"][0]["name"] == "case-0"
    assert result["ranking_metric"] == "median_of_case_medians"


def test_benchmark_ranking_metric_with_input_sizes():
    from app.sandbox.benchmark_datasets import generate_two_sum_cases
    code = """
def two_sum(nums, target):
    seen = {}
    for index, value in enumerate(nums):
        complement = target - value
        if complement in seen:
            return [seen[complement], index]
        seen[value] = index
    raise ValueError("No pair found")
"""
    cases = generate_two_sum_cases({"small": 10, "large": 50})
    result = benchmark_python(
        code=code,
        function_name="two_sum",
        cases=cases,
        repetitions=5,
        warmups=1,
        rounds=2,
    )
    assert result["status"] == "completed"
    assert result["ranking_metric"] == "largest_input_median"
    # Largest case is "large" (input_size 50)
    large_case = next(c for c in result["cases"] if c["name"] == "large")
    assert result["benchmark_median_ms"] == large_case["median_ms"]



def test_invalid_benchmark_rounds():
    import pytest
    with pytest.raises(ValueError, match="Benchmark rounds must be between 1 and 10"):
        benchmark_python(
            code="def f(): pass",
            function_name="f",
            cases=[{"args": [], "expected": None}],
            rounds=11,
        )
