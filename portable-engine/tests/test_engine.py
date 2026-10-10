import pathlib
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import engine


class PortableEngineTests(unittest.TestCase):
    def test_receipts_are_unique_and_verify(self):
        with tempfile.TemporaryDirectory() as temp:
            with mock.patch.object(engine, "RECEIPTS", pathlib.Path(temp)):
                first = engine.receipt("test", {"value": 1})
                second = engine.receipt("test", {"value": 1})
                self.assertNotEqual(first.name, second.name)
                self.assertTrue(engine.verify_receipt(first))
                self.assertTrue(engine.verify_receipt(second))

    def test_receipt_tampering_is_detected(self):
        with tempfile.TemporaryDirectory() as temp:
            with mock.patch.object(engine, "RECEIPTS", pathlib.Path(temp)):
                path = engine.receipt("test", {"value": 1})
                record = __import__("json").loads(path.read_text(encoding="utf-8"))
                record["payload"]["value"] = 2
                path.write_text(__import__("json").dumps(record), encoding="utf-8")
                self.assertFalse(engine.verify_receipt(path))

    def test_bento4_lookup_is_confined_to_portable_tools_directory(self):
        with tempfile.TemporaryDirectory() as temp:
            tools = pathlib.Path(temp) / "tools" / "bento4"
            tools.mkdir(parents=True)
            with mock.patch.object(engine, "TOOLS", tools):
                with self.assertRaises(FileNotFoundError):
                    engine.bento4("mp4info")
                executable = tools / "mp4info.exe"
                executable.write_bytes(b"test")
                self.assertEqual(engine.bento4("mp4info"), executable)

    def test_missing_bento4_is_reported_without_network_install(self):
        with tempfile.TemporaryDirectory() as temp:
            root = pathlib.Path(temp)
            media = root / "sample.mp4"
            media.write_bytes(b"sample")
            with mock.patch.object(engine, "TOOLS", root / "empty-tools"):
                result = engine.inspect_media(media)
            self.assertEqual(result["status"], "unavailable")
            self.assertEqual(result["sha256"], engine.sha256(media))


if __name__ == "__main__":
    unittest.main()
