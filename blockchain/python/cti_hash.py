import hashlib
import hmac
import re
from collections.abc import Mapping

import rfc8785


_SHA256_HEX = re.compile(r"[0-9a-fA-F]{64}\Z")


def canonicalize_report(report: Mapping[str, object]) -> bytes:
    """Serialize a JSON report object using RFC 8785 canonicalization."""
    if not isinstance(report, Mapping):
        raise TypeError("report must be a mapping")

    return rfc8785.dumps(dict(report))


def compute_report_hash(report: Mapping[str, object]) -> str:
    """Return the lowercase SHA-256 digest of a canonicalized report."""
    return hashlib.sha256(canonicalize_report(report)).hexdigest()


def verify_report_hash(report: Mapping[str, object], expected_hash: str) -> bool:
    """Compare a report's digest with a 64-character hexadecimal SHA-256 hash."""
    if not isinstance(expected_hash, str) or not _SHA256_HEX.fullmatch(expected_hash):
        raise ValueError("expected_hash must be a 64-character hexadecimal SHA-256 digest")

    actual = hashlib.sha256(canonicalize_report(report)).digest()
    expected = bytes.fromhex(expected_hash)
    return hmac.compare_digest(actual, expected)
