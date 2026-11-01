
from app.sandbox.benchmark_datasets import (
    DEFAULT_TWO_SUM_SIZES,
    generate_two_sum_cases,
)


def test_default_two_sum_datasets():
    cases = generate_two_sum_cases()

    assert len(cases) == 3

    assert [case["name"] for case in cases] == [
        "small",
        "medium",
        "large",
    ]

    assert [case["input_size"] for case in cases] == [
        100,
        500,
        1000,
    ]


def test_two_sum_dataset_is_deterministic():
    first = generate_two_sum_cases()
    second = generate_two_sum_cases()

    assert first == second


def test_two_sum_solution_is_at_end():
    for case in generate_two_sum_cases():
        nums, target = case["args"]
        expected = case["expected"]

        assert expected == [
            case["input_size"] - 2,
            case["input_size"] - 1,
        ]

        assert nums[expected[0]] + nums[expected[1]] == target


def test_two_sum_has_exactly_one_valid_pair():
    cases = generate_two_sum_cases({"test": 100})

    nums, target = cases[0]["args"]

    matching_pairs = []

    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                matching_pairs.append([i, j])

    assert matching_pairs == [[98, 99]]


def test_custom_dataset_sizes():
    cases = generate_two_sum_cases({
        "tiny": 10,
        "custom": 50,
    })

    assert [case["input_size"] for case in cases] == [10, 50]


def test_invalid_dataset_size():
    try:
        generate_two_sum_cases({"invalid": 1})
        assert False, "Expected ValueError"
    except ValueError:
        pass
