
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
                "kwargs": {},
            },
            {
                "args": [[-3, 4, 3, 90], 0],
                "kwargs": {},
            },
        ],
        repetitions=5,
        warmups=1,
        timeout_seconds=10,
    )

    assert result["status"] == "completed"
    assert result["passed"] is True
    assert result["benchmark_median_ms"] >= 0
    assert len(result["cases"]) == 2
    assert all(case["repetitions"] == 5 for case in result["cases"])
