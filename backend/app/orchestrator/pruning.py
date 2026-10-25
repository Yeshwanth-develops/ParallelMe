
import ast
import hashlib


def code_fingerprint(code: str) -> str:
    """Return a stable fingerprint for exact candidate code."""
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def validate_candidate(code: str) -> dict | None:
    """Return a pruning result when the candidate cannot be evaluated."""
    try:
        ast.parse(code)
    except SyntaxError as exc:
        return {
            "status": "pruned",
            "reason": "invalid_syntax",
            "passed": False,
            "passed_tests": 0,
            "failed_tests": 0,
            "duration_ms": 0,
            "syntax_error": {
                "message": exc.msg,
                "line": exc.lineno,
                "offset": exc.offset,
            },
        }

    return None


def check_duplicate(
    code: str,
    seen: dict[str, str],
) -> tuple[str | None, str]:
    """
    Return (duplicate_of, fingerprint).
    `seen` maps fingerprints to the first candidate ID.
    """
    fingerprint = code_fingerprint(code)
    return seen.get(fingerprint), fingerprint
