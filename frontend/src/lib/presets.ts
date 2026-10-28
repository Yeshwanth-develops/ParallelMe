import { Preset } from "@/types";

export const PRESETS: Preset[] = [
  {
    id: "fibonacci",
    title: "Fibonacci Sequence",
    category: "Dynamic Programming & Math",
    difficulty: "Easy",
    description:
      "Compute the N-th Fibonacci number. Compare naive recursion, memoization cache, iterative constant space, duplicate code detection, and syntax validation pruning.",
    timeout_seconds: 5,
    max_concurrency: 3,
    tests: `import pytest
from main import fib

def test_base_cases():
    assert fib(0) == 0
    assert fib(1) == 1

def test_small_numbers():
    assert fib(2) == 1
    assert fib(3) == 2
    assert fib(4) == 3
    assert fib(5) == 5
    assert fib(6) == 8

def test_medium_numbers():
    assert fib(10) == 55
    assert fib(15) == 610
    assert fib(20) == 6765
`,
    candidates: [
      {
        candidate_id: "fib-iterative",
        strategy_name: "Iterative (O(1) Space)",
        code: `def fib(n: int) -> int:
    """Iterative approach: O(n) time and O(1) space."""
    if n <= 0:
        return 0
    if n == 1:
        return 1
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b
`,
      },
      {
        candidate_id: "fib-memo",
        strategy_name: "Memoized Cache (O(n) Space)",
        code: `def fib(n: int, memo: dict = None) -> int:
    """Top-down DP with hash map memoization: O(n) time."""
    if memo is None:
        memo = {0: 0, 1: 1}
    if n in memo:
        return memo[n]
    memo[n] = fib(n - 1, memo) + fib(n - 2, memo)
    return memo[n]
`,
      },
      {
        candidate_id: "fib-recursive",
        strategy_name: "Naive Recursive (O(2^n))",
        code: `def fib(n: int) -> int:
    """Naive recursion without caching: exponential O(2^n) time."""
    if n <= 0:
        return 0
    if n == 1:
        return 1
    return fib(n - 1) + fib(n - 2)
`,
      },
      {
        candidate_id: "fib-iterative-dup",
        strategy_name: "Duplicate of Iterative",
        code: `def fib(n: int) -> int:
    """Iterative approach: O(n) time and O(1) space."""
    if n <= 0:
        return 0
    if n == 1:
        return 1
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b
`,
      },
      {
        candidate_id: "fib-syntax-error",
        strategy_name: "Malformed Syntax (Pruned)",
        code: `def fib(n: int) -> int:
    # Deliberate missing closing parenthesis to test AST pruning
    if n <= 0:
        return 0
    return fib(n - 1 + fib(n - 2)
`,
      },
    ],
  },
  {
    id: "two-sum",
    title: "Two Sum Target Search",
    category: "Arrays & Hash Tables",
    difficulty: "Easy",
    description:
      "Find indices of the two numbers in a list such that they add up to a specific target. Compares O(n^2) nested loop against O(n) hash map lookup and a flawed candidate.",
    timeout_seconds: 5,
    max_concurrency: 3,
    tests: `import pytest
from main import two_sum

def test_basic_pair():
    assert two_sum([2, 7, 11, 15], 9) == [0, 1]

def test_unordered_elements():
    assert two_sum([3, 2, 4], 6) == [1, 2]

def test_identical_values():
    assert two_sum([3, 3], 6) == [0, 1]

def test_negative_numbers():
    assert two_sum([-1, -2, -3, -4, -5], -8) == [2, 4]

def test_no_solution():
    assert two_sum([1, 2, 3], 100) == []
`,
    candidates: [
      {
        candidate_id: "two-sum-hashmap",
        strategy_name: "Hash Map Single Pass (O(n))",
        code: `def two_sum(nums: list[int], target: int) -> list[int]:
    """Single pass hash table: O(n) time, O(n) space."""
    lookup = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in lookup:
            return [lookup[complement], i]
        lookup[num] = i
    return []
`,
      },
      {
        candidate_id: "two-sum-bruteforce",
        strategy_name: "Brute Force (O(n^2))",
        code: `def two_sum(nums: list[int], target: int) -> list[int]:
    """Nested loop comparison: O(n^2) time, O(1) space."""
    n = len(nums)
    for i in range(n):
        for j in range(i + 1, n):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []
`,
      },
      {
        candidate_id: "two-sum-buggy",
        strategy_name: "Flawed Logic (Fails on Negatives)",
        code: `def two_sum(nums: list[int], target: int) -> list[int]:
    """Buggy implementation: incorrectly assumes numbers are non-negative."""
    lookup = {}
    for i, num in enumerate(nums):
        if num < 0:
            continue
        complement = target - num
        if complement in lookup:
            return [lookup[complement], i]
        lookup[num] = i
    return []
`,
      },
    ],
  },
  {
    id: "sorting",
    title: "Array Sorting Benchmark",
    category: "Sorting & Divide-and-Conquer",
    difficulty: "Medium",
    description:
      "Sort an array of integers in non-decreasing order. Compare Bubble Sort (O(n^2)), Quick Sort (O(n log n)), and Python's optimized Timsort.",
    timeout_seconds: 5,
    max_concurrency: 3,
    tests: `import pytest
from main import sort_array

def test_empty_and_single():
    assert sort_array([]) == []
    assert sort_array([42]) == [42]

def test_already_sorted():
    assert sort_array([1, 2, 3, 4, 5]) == [1, 2, 3, 4, 5]

def test_reversed_array():
    assert sort_array([5, 4, 3, 2, 1]) == [1, 2, 3, 4, 5]

def test_duplicates():
    assert sort_array([3, 1, 4, 1, 5, 9, 2, 6, 5]) == [1, 1, 2, 3, 4, 5, 5, 6, 9]

def test_negative_numbers():
    assert sort_array([-5, 10, -2, 0, 7]) == [-5, -2, 0, 7, 10]
`,
    candidates: [
      {
        candidate_id: "sort-timsort",
        strategy_name: "Python Built-in (Timsort O(n log n))",
        code: `def sort_array(arr: list[int]) -> list[int]:
    """C-level Timsort: O(n log n) average, O(n) space."""
    return sorted(arr)
`,
      },
      {
        candidate_id: "sort-quicksort",
        strategy_name: "Quick Sort (Divide & Conquer)",
        code: `def sort_array(arr: list[int]) -> list[int]:
    """Recursive Quick Sort with middle pivot."""
    if len(arr) <= 1:
        return arr[:]
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return sort_array(left) + middle + sort_array(right)
`,
      },
      {
        candidate_id: "sort-bubblesort",
        strategy_name: "Bubble Sort (O(n^2))",
        code: `def sort_array(arr: list[int]) -> list[int]:
    """Classic Bubble Sort: O(n^2) time, in-place copy."""
    res = list(arr)
    n = len(res)
    for i in range(n):
        swapped = False
        for j in range(0, n - i - 1):
            if res[j] > res[j + 1]:
                res[j], res[j + 1] = res[j + 1], res[j]
                swapped = True
        if not swapped:
            break
    return res
`,
      },
    ],
  },
  {
    id: "palindrome",
    title: "Palindrome Verification",
    category: "Strings & Two Pointers",
    difficulty: "Easy",
    description:
      "Check whether an input string is a valid alphanumeric palindrome ignoring case. Tests pythonic slicing vs two pointers vs recursive approach.",
    timeout_seconds: 5,
    max_concurrency: 3,
    tests: `import pytest
from main import is_palindrome

def test_simple_palindromes():
    assert is_palindrome("radar") is True
    assert is_palindrome("noon") is True
    assert is_palindrome("a") is True
    assert is_palindrome("") is True

def test_non_palindromes():
    assert is_palindrome("hello") is False
    assert is_palindrome("parallel") is False

def test_alphanumeric_with_punctuation():
    assert is_palindrome("A man, a plan, a canal: Panama") is True
    assert is_palindrome("race a car") is False
    assert is_palindrome("Was it a car or a cat I saw?") is True
`,
    candidates: [
      {
        candidate_id: "pal-two-pointers",
        strategy_name: "Two Pointers (O(1) Space)",
        code: `def is_palindrome(s: str) -> bool:
    """In-place two-pointer traversal ignoring non-alphanumeric chars."""
    left, right = 0, len(s) - 1
    while left < right:
        while left < right and not s[left].isalnum():
            left += 1
        while left < right and not s[right].isalnum():
            right -= 1
        if s[left].lower() != s[right].lower():
            return False
        left += 1
        right -= 1
    return True
`,
      },
      {
        candidate_id: "pal-filter-slice",
        strategy_name: "Filter & Slice Inversion",
        code: `def is_palindrome(s: str) -> bool:
    """Filter alphanumeric characters and reverse with Python slice."""
    cleaned = [c.lower() for c in s if c.isalnum()]
    return cleaned == cleaned[::-1]
`,
      },
      {
        candidate_id: "pal-naive-regex",
        strategy_name: "Regex Preprocessing",
        code: `import re

def is_palindrome(s: str) -> bool:
    """Use regex to strip characters and compare lowercase string."""
    cleaned = re.sub(r'[^a-zA-Z0-9]', '', s).lower()
    return cleaned == cleaned[::-1]
`,
      },
    ],
  },
];

