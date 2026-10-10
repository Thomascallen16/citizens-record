#!/usr/bin/env python3
"""Pocket Buddy: portable chat shell with local Ollama support.

This UI never sends prompts to a cloud service. It talks only to an Ollama
server at 127.0.0.1, keeps chat history in the portable folder, and clearly
reports when the local model runtime is missing.
"""
from __future__ import annotations

import json
import os
import pathlib
import sys
import threading
import urllib.error
import urllib.request
import tkinter as tk
from tkinter import ttk, messagebox

def runtime_root(script_file=None, frozen=None, executable=None) -> pathlib.Path:
    """Return the durable app directory, not PyInstaller's temporary extraction folder."""
    is_frozen = getattr(sys, "frozen", False) if frozen is None else frozen
    if is_frozen:
        executable_path = executable or sys.executable
        return pathlib.Path(executable_path).resolve().parent
    return pathlib.Path(script_file or __file__).resolve().parent


ROOT = runtime_root()
STATE = ROOT / "state"
HISTORY = STATE / "chat_history.json"
OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
DEFAULT_MODEL = os.environ.get("POCKET_BUDDY_MODEL", "qwen2.5:3b")
SYSTEM_PROMPT = (
    "You are Pocket Buddy, a helpful, candid, warm, practical personal assistant. "
    "Be conversational, honest about uncertainty, and never claim to have performed "
    "actions you have not performed. Prefer useful next steps over vague promises."
)


def load_history() -> list[dict]:
    try:
        data = json.loads(HISTORY.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return [m for m in data if isinstance(m, dict) and m.get("role") in ("user", "assistant")]
    except (OSError, ValueError):
        pass
    return []


def save_history(messages: list[dict]) -> None:
    STATE.mkdir(parents=True, exist_ok=True)
    temp = HISTORY.with_suffix(".tmp")
    temp.write_text(json.dumps(messages, ensure_ascii=False, indent=2), encoding="utf-8")
    temp.replace(HISTORY)


def ask_local_model(messages: list[dict], model: str) -> str:
    payload = json.dumps({
        "model": model,
        "stream": False,
        "messages": [{"role": "system", "content": SYSTEM_PROMPT}, *messages[-24:]],
        "options": {"temperature": 0.7},
    }).encode("utf-8")
    request = urllib.request.Request(
        OLLAMA_URL, data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            result = json.loads(response.read().decode("utf-8"))
    except urllib.error.URLError as exc:
        raise RuntimeError(
            "Can't reach the local AI runtime at 127.0.0.1:11434. "
            "Install/run Ollama and download a model, or configure a bundled "
            "llama.cpp runtime in a later release. Nothing was sent to a cloud service."
        ) from exc
    text = result.get("message", {}).get("content")
    if not isinstance(text, str) or not text.strip():
        raise RuntimeError("The local AI runtime returned no answer.")
    return text.strip()


class PocketBuddy:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("Pocket Buddy — Local Assistant")
        self.root.geometry("820x650")
        self.root.minsize(600, 450)
        self.messages = load_history()
        self.busy = False
        self.model = DEFAULT_MODEL

        outer = ttk.Frame(root, padding=12)
        outer.pack(fill="both", expand=True)
        ttk.Label(outer, text="POCKET BUDDY", font=("Segoe UI", 16, "bold")).pack(anchor="w")
        ttk.Label(
            outer,
            text="Local-first chat • conversation stored on this drive • no cloud API",
        ).pack(anchor="w", pady=(0, 8))

        model_row = ttk.Frame(outer)
        model_row.pack(fill="x", pady=(0, 8))
        ttk.Label(model_row, text="Local model:").pack(side="left")
        self.model_var = tk.StringVar(value=self.model)
        ttk.Entry(model_row, textvariable=self.model_var, width=24).pack(side="left", padx=8)
        ttk.Label(model_row, text="(must already be available in Ollama)").pack(side="left")

        self.transcript = tk.Text(outer, wrap="word", state="disabled", font=("Segoe UI", 10))
        self.transcript.pack(fill="both", expand=True)
        self.transcript.tag_configure("user", font=("Segoe UI", 10, "bold"))
        self.transcript.tag_configure("assistant", font=("Segoe UI", 10))
        self.transcript.tag_configure("system", font=("Segoe UI", 9, "italic"))

        self.entry = tk.Text(outer, height=4, wrap="word", font=("Segoe UI", 10))
        self.entry.pack(fill="x", pady=(8, 6))
        self.entry.bind("<Control-Return>", self._send_shortcut)
        bottom = ttk.Frame(outer)
        bottom.pack(fill="x")
        self.status = tk.StringVar(value="Ready. The local model runtime must be running.")
        ttk.Label(bottom, textvariable=self.status).pack(side="left", fill="x", expand=True)
        self.send_button = ttk.Button(bottom, text="Send  (Ctrl+Enter)", command=self.send)
        self.send_button.pack(side="right")
        self._render_history()
        self.entry.focus_set()

    def _render_history(self):
        self.transcript.configure(state="normal")
        self.transcript.delete("1.0", "end")
        for item in self.messages:
            label = "You" if item["role"] == "user" else "Pocket Buddy"
            tag = item["role"]
            self.transcript.insert("end", f"{label}:\n", tag)
            self.transcript.insert("end", item.get("content", "") + "\n\n", tag)
        self.transcript.configure(state="disabled")
        self.transcript.see("end")

    def _send_shortcut(self, _event):
        self.send()
        return "break"

    def send(self):
        if self.busy:
            return
        prompt = self.entry.get("1.0", "end").strip()
        if not prompt:
            return
        self.model = self.model_var.get().strip() or DEFAULT_MODEL
        self.messages.append({"role": "user", "content": prompt})
        self.entry.delete("1.0", "end")
        save_history(self.messages)
        self._render_history()
        self.busy = True
        self.send_button.configure(state="disabled")
        self.status.set(f"Thinking locally with {self.model}…")
        threading.Thread(target=self._respond, daemon=True).start()

    def _respond(self):
        try:
            answer = ask_local_model(self.messages, self.model)
            self.root.after(0, self._finish, answer, None)
        except Exception as exc:
            self.root.after(0, self._finish, None, str(exc))

    def _finish(self, answer, error):
        self.busy = False
        self.send_button.configure(state="normal")
        if error:
            self.status.set("Local model unavailable.")
            messagebox.showerror("Pocket Buddy — local runtime", error)
            return
        self.messages.append({"role": "assistant", "content": answer})
        save_history(self.messages)
        self._render_history()
        self.status.set(f"Ready • model: {self.model} • saved on this drive")


def main():
    root = tk.Tk()
    PocketBuddy(root)
    root.mainloop()


if __name__ == "__main__":
    main()
