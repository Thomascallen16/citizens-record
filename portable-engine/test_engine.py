"""Tests for portable bootstrap receipts and integrity verification."""
import json
import pathlib
import tempfile
import unittest
from unittest import mock

import engine


class ReceiptTests(unittest.TestCase):
    def test_receipt_round_trip_verifies(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            with mock.patch.object(engine, "RECEIPTS", root / "receipts"):
                path = engine.receipt("test", {"mode": "local-read-only"})
            self.assertTrue(engine.verify_receipt(path))

    def test_modified_payload_fails_verification(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            with mock.patch.object(engine, "RECEIPTS", root / "receipts"):
                path = engine.receipt("test", {"mode": "local-read-only"})
            record = json.loads(path.read_text(encoding="utf-8"))
            record["payload"]["mode"] = "modified"
            path.write_text(json.dumps(record), encoding="utf-8")
            self.assertFalse(engine.verify_receipt(path))

    def test_non_object_receipt_fails_verification(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "receipt.json"
            path.write_text("[]", encoding="utf-8")
            self.assertFalse(engine.verify_receipt(path))

    def test_missing_digest_fails_verification(self):
        with tempfile.TemporaryDirectory() as directory:
            path = pathlib.Path(directory) / "receipt.json"
            path.write_text(json.dumps({"event": "test"}), encoding="utf-8")
            self.assertFalse(engine.verify_receipt(path))


if __name__ == "__main__":
    unittest.main()
