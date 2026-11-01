import { CodingPreset } from "./types";

export const CODING_PRESETS: CodingPreset[] = [
  {
    id: "two-sum",
    name: "Two Sum",
    difficulty: "Easy",
    category: "Arrays & Hash Table",
    functionName: "two_sum",
    taskDescription:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice. Return the answer with 0-based indices.",
    starterCode: `def two_sum(nums: list[int], target: int) -> list[int]:
    """Find two numbers that add up to target and return their indices."""
    seen = {}
    for index, value in enumerate(nums):
        complement = target - value
        if complement in seen:
            return [seen[complement], index]
        seen[value] = index
    raise ValueError("No solution found")
`,
    tests: `from main import two_sum
import pytest

def test_two_sum_basic():
    assert two_sum([2, 7, 11, 15], 9) == [0, 1]

def test_two_sum_middle():
    assert two_sum([3, 2, 4], 6) == [1, 2]

def test_two_sum_duplicates():
    assert two_sum([3, 3], 6) == [0, 1]

def test_two_sum_negative():
    assert two_sum([-1, -2, -3, -4, -5], -8) == [2, 4]
`,
    benchmarkDataset: "two_sum",
    benchmarkCases: [
      {
        name: "small",
        input_size: 100,
        args: [Array.from({ length: 100 }, (_, i) => i), 197],
        expected: [98, 99],
        kwargs: {},
      },
      {
        name: "medium",
        input_size: 500,
        args: [Array.from({ length: 500 }, (_, i) => i), 997],
        expected: [498, 499],
        kwargs: {},
      },
      {
        name: "large",
        input_size: 1000,
        args: [Array.from({ length: 1000 }, (_, i) => i), 1997],
        expected: [998, 999],
        kwargs: {},
      },
    ],
    benchmarkRepetitions: 20,
    benchmarkWarmups: 3,
    benchmarkRounds: 5,
  },
  {
    id: "valid-parentheses",
    name: "Valid Parentheses",
    difficulty: "Easy",
    category: "Stack & Strings",
    functionName: "is_valid",
    taskDescription:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid. An input string is valid if open brackets must be closed by the same type of brackets, and in the correct order.",
    starterCode: `def is_valid(s: str) -> bool:
    """Determine if brackets are properly balanced and ordered."""
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack
`,
    tests: `from main import is_valid

def test_valid_simple():
    assert is_valid("()") is True

def test_valid_multiple():
    assert is_valid("()[]{}") is True

def test_invalid_mismatch():
    assert is_valid("(]") is False

def test_valid_nested():
    assert is_valid("{[()]}") is True

def test_invalid_single():
    assert is_valid("(") is False
`,
    benchmarkCases: [
      {
        name: "nested-small",
        input_size: 24,
        args: ["{[()()]}{[()()]}{[()()]}"],
        expected: true,
        kwargs: {},
      },
      {
        name: "balanced-medium",
        input_size: 400,
        args: ["(".repeat(200) + ")".repeat(200)],
        expected: true,
        kwargs: {},
      },
      {
        name: "deeply-nested-large",
        input_size: 996,
        args: ["{[(".repeat(166) + ")]}".repeat(166)],
        expected: true,
        kwargs: {},
      },
    ],
    benchmarkRepetitions: 20,
    benchmarkWarmups: 3,
    benchmarkRounds: 5,
  },
  {
    id: "merge-intervals",
    name: "Merge Intervals",
    difficulty: "Medium",
    category: "Sorting & Arrays",
    functionName: "merge_intervals",
    taskDescription:
      "Given an array of intervals where intervals[i] = [start_i, end_i], merge all overlapping intervals, and return an array of the non-overlapping intervals that cover all the intervals in the input.",
    starterCode: `def merge_intervals(intervals: list[list[int]]) -> list[list[int]]:
    """Merge all overlapping intervals."""
    if not intervals:
        return []
    intervals.sort(key=lambda x: x[0])
    merged = [intervals[0]]
    for current in intervals[1:]:
        last = merged[-1]
        if current[0] <= last[1]:
            last[1] = max(last[1], current[1])
        else:
            merged.append(current)
    return merged
`,
    tests: `from main import merge_intervals

def test_merge_overlapping():
    assert merge_intervals([[1, 3], [2, 6], [8, 10], [15, 18]]) == [[1, 6], [8, 10], [15, 18]]

def test_merge_touching():
    assert merge_intervals([[1, 4], [4, 5]]) == [[1, 5]]

def test_merge_single():
    assert merge_intervals([[1, 4]]) == [[1, 4]]

def test_merge_contained():
    assert merge_intervals([[1, 10], [2, 3], [4, 5]]) == [[1, 10]]
`,
    benchmarkCases: [
      {
        name: "small",
        input_size: 6,
        args: [[[1, 4], [0, 4], [3, 5], [10, 15], [12, 18], [20, 25]]],
        expected: [[0, 5], [10, 18], [20, 25]],
        kwargs: {},
      },
      {
        name: "overlapping-chain",
        input_size: 150,
        args: [
          Array.from({ length: 150 }, (_, i) => [i * 2, i * 2 + 3]),
        ],
        expected: [[0, 301]],
        kwargs: {},
      },
    ],
    benchmarkRepetitions: 15,
    benchmarkWarmups: 2,
    benchmarkRounds: 5,
  },
  {
    id: "longest-substring",
    name: "Longest Substring Without Repeating",
    difficulty: "Medium",
    category: "Sliding Window",
    functionName: "length_of_longest_substring",
    taskDescription:
      "Given a string s, find the length of the longest substring without duplicate characters. Implement using an optimized sliding window algorithm.",
    starterCode: `def length_of_longest_substring(s: str) -> int:
    """Compute the length of the longest substring with unique chars."""
    char_map = {}
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        if char in char_map and char_map[char] >= left:
            left = char_map[char] + 1
        char_map[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len
`,
    tests: `from main import length_of_longest_substring

def test_abcabcbb():
    assert length_of_longest_substring("abcabcbb") == 3

def test_bbbbb():
    assert length_of_longest_substring("bbbbb") == 1

def test_pwwkew():
    assert length_of_longest_substring("pwwkew") == 3

def test_empty():
    assert length_of_longest_substring("") == 0
`,
    benchmarkCases: [
      {
        name: "small-alphabet",
        input_size: 52,
        args: ["abcdefghijklmnopqrstuvwxyz" + "abcdefghijklmnopqrstuvwxyz"],
        expected: 26,
        kwargs: {},
      },
      {
        name: "repeated-prefix",
        input_size: 526,
        args: ["a".repeat(500) + "bcdefghijklmnopqrstuvwxyz"],
        expected: 27,
        kwargs: {},
      },
    ],
    benchmarkRepetitions: 20,
    benchmarkWarmups: 3,
    benchmarkRounds: 5,
  },
];

