import unittest

from cti_hash import canonicalize_report, compute_report_hash, verify_report_hash


class CtiHashTests(unittest.TestCase):
    def test_key_order_does_not_change_canonical_report_or_hash(self):
        first = {"name": "sample", "details": {"b": 2, "a": 1}}
        second = {"details": {"a": 1, "b": 2}, "name": "sample"}

        self.assertEqual(canonicalize_report(first), canonicalize_report(second))
        self.assertEqual(compute_report_hash(first), compute_report_hash(second))

    def test_uses_rfc8785_number_serialization(self):
        report = {
            "numbers": [
                333333333.33333329,
                1e30,
                4.50,
                2e-3,
                0.000000000000000000000000001,
            ]
        }

        self.assertEqual(
            canonicalize_report(report),
            b'{"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27]}',
        )

    def test_verifies_matching_digest_and_detects_changed_report(self):
        report = {"report": "sample", "count": 1}
        digest = compute_report_hash(report)

        self.assertTrue(verify_report_hash(report, digest))
        self.assertFalse(verify_report_hash({**report, "count": 2}, digest))

    def test_rejects_malformed_digest(self):
        with self.assertRaises(ValueError):
            verify_report_hash({"report": "sample"}, "not-a-hash")


if __name__ == "__main__":
    unittest.main()
