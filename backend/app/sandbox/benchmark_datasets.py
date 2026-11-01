
from __future__ import annotations

from typing import Any


DEFAULT_TWO_SUM_SIZES = {
    "small": 100,
    "medium": 500,
    "large": 1000,
}


def generate_two_sum_cases(
    sizes: dict[str, int] | None = None,
) -> list[dict[str, Any]]:
    """
    Generate deterministic Two Sum benchmark cases.

    The unique solution is always the final two elements.
    This creates a worst-case search for nested-loop solutions.
    """

    selected_sizes = sizes or DEFAULT_TWO_SUM_SIZES

    if not selected_sizes:
        raise ValueError("At least one dataset size is required.")

    cases = []

    for name, size in selected_sizes.items():
        if not isinstance(size, int) or isinstance(size, bool) or size < 2:
            raise ValueError(
                f"Invalid dataset size for {name}: {size}"
            )

        # All values are unique and increasing.
        nums = list(range(size))

        # The only valid pair is at the final two indices.
        target = (size - 2) + (size - 1)

        cases.append({
            "name": name,
            "input_size": size,
            "args": [nums, target],
            "expected": [size - 2, size - 1],
        })

    return cases
