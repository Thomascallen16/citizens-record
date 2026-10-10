import importlib.util
import pathlib
import sys
import tempfile
import unittest
from unittest import mock

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
import pocket_buddy


class PocketBuddyTests(unittest.TestCase):
    def test_frozen_app_stores_state_next_to_executable(self):
        root = pocket_buddy.runtime_root(
            script_file="/tmp/pyinstaller/_MEI123/pocket_buddy.py",
            frozen=True,
            executable="E:/PocketBuddy/PocketBuddy.exe",
        )
        self.assertEqual(root, pathlib.Path("E:/PocketBuddy").resolve())

    def test_source_mode_uses_script_directory(self):
        root = pocket_buddy.runtime_root(script_file="/work/portable-engine/pocket_buddy.py", frozen=False)
        self.assertEqual(root, pathlib.Path("/work/portable-engine").resolve())

    def test_history_round_trip_stays_in_portable_state(self):
        with tempfile.TemporaryDirectory() as temp:
            history = pathlib.Path(temp) / "state" / "chat_history.json"
            with mock.patch.object(pocket_buddy, "HISTORY", history), mock.patch.object(
                pocket_buddy, "STATE", history.parent
            ):
                expected = [
                    {"role": "user", "content": "Hello"},
                    {"role": "assistant", "content": "Hi"},
                ]
                pocket_buddy.save_history(expected)
                self.assertEqual(pocket_buddy.load_history(), expected)
                self.assertTrue(history.is_file())

    def test_history_ignores_invalid_roles(self):
        with tempfile.TemporaryDirectory() as temp:
            history = pathlib.Path(temp) / "chat_history.json"
            history.write_text(
                '[{"role":"system","content":"bad"},{"role":"user","content":"ok"}]',
                encoding="utf-8",
            )
            with mock.patch.object(pocket_buddy, "HISTORY", history):
                self.assertEqual(
                    pocket_buddy.load_history(),
                    [{"role": "user", "content": "ok"}],
                )

    def test_local_endpoint_is_loopback_only(self):
        self.assertTrue(pocket_buddy.OLLAMA_URL.startswith("http://127.0.0.1:"))
        self.assertNotIn("https://", pocket_buddy.OLLAMA_URL)

    def test_empty_model_reply_is_rejected(self):
        with mock.patch.object(
            pocket_buddy.urllib.request, "urlopen"
        ) as open_mock:
            response = mock.MagicMock()
            response.__enter__.return_value.read.return_value = (
                b'{"message":{"content":""}}'
            )
            open_mock.return_value = response
            with self.assertRaisesRegex(RuntimeError, "no answer"):
                pocket_buddy.ask_local_model([], "test-model")


if __name__ == "__main__":
    unittest.main()
