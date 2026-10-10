#!/usr/bin/env python3
"""Portable Intelligence Engine bootstrap.

Local-first, read-only by default. No host-wide scanning and no network access.
The media adapter is provider-neutral; Bento4 executables are looked up only
inside this portable directory.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import pathlib
import subprocess
import sys
import time
import uuid

# A frozen PyInstaller build must keep receipts beside the USB executable,
# not inside PyInstaller's temporary extraction directory.
ROOT = (
    pathlib.Path(sys.executable).resolve().parent
    if getattr(sys, "frozen", False)
    else pathlib.Path(__file__).resolve().parent
)
TOOLS = ROOT / "tools" / "bento4"
STATE = ROOT / "state"
RECEIPTS = STATE / "receipts"
OUTPUT = ROOT / "output"
VERSION = "0.1.2"


def sha256(path: pathlib.Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def bento4(tool: str) -> pathlib.Path:
    """Find a bundled Bento4 executable without searching the host."""
    if not tool.replace("_", "").isalnum():
        raise ValueError("Invalid tool name")
    for candidate in (TOOLS / f"{tool}.exe", TOOLS / tool, TOOLS / f"{tool}.bin"):
        if candidate.is_file():
            return candidate
    raise FileNotFoundError(f"Bento4 tool not bundled: {tool}")


def inspect_media(path: pathlib.Path) -> dict:
    """Inspect a user-selected local media file using bundled mp4info."""
    path = path.expanduser().resolve()
    if not path.is_file():
        raise FileNotFoundError(path)
    try:
        tool = bento4("mp4info")
    except FileNotFoundError:
        return {
            "status": "unavailable",
            "reason": "Bento4 tools not bundled",
            "file": str(path),
            "sha256": sha256(path),
        }
    proc = subprocess.run(
        [str(tool), str(path)],
        capture_output=True,
        text=True,
        check=False,
        timeout=60,
        cwd=str(TOOLS),
    )
    return {
        "status": "ok" if proc.returncode == 0 else "error",
        "returncode": proc.returncode,
        "file": str(path),
        "sha256": sha256(path),
        "stdout": proc.stdout,
        "stderr": proc.stderr,
    }


def receipt(event: str, payload: dict) -> pathlib.Path:
    """Write a uniquely named, tamper-evident JSON receipt."""
    RECEIPTS.mkdir(parents=True, exist_ok=True)
    record = {
        "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "event": event,
        "payload": payload,
    }
    record["receipt_sha256"] = hashlib.sha256(
        json.dumps(record, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    out = RECEIPTS / f"{time.time_ns()}-{uuid.uuid4().hex}-{event}.json"
    with out.open("x", encoding="utf-8") as stream:
        json.dump(record, stream, indent=2, ensure_ascii=False)
        stream.write("\n")
    return out


def verify_receipt(path: pathlib.Path) -> bool:
    """Verify a receipt's content hash; this detects edits, not forged provenance."""
    record = json.loads(path.read_text(encoding="utf-8"))
    expected = record.pop("receipt_sha256", None)
    if not isinstance(expected, str):
        return False
    actual = hashlib.sha256(
        json.dumps(record, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    return hmac.compare_digest(actual, expected)


def main() -> int:
    STATE.mkdir(parents=True, exist_ok=True)
    OUTPUT.mkdir(parents=True, exist_ok=True)
    print(f"Big Data Energy — Autopilot v{VERSION}")
    print(f"Root: {ROOT}")
    print("Mode: LOCAL / READ-ONLY")
    print("No host-wide scanning. No silent network access.")
    print(
        "Bento4:",
        "available" if any(
            (TOOLS / name).is_file()
            for name in ("mp4info.exe", "mp4info", "mp4info.bin")
        ) else "not bundled yet",
    )
    path = receipt(
        "startup",
        {"root": str(ROOT), "mode": "local-read-only", "version": VERSION},
    )
    valid = verify_receipt(path)
    print(f"Receipt: {path}")
    print(f"Receipt integrity: {'verified' if valid else 'FAILED'}")
    return 0 if valid else 2


if __name__ == "__main__":
    raise SystemExit(main())
