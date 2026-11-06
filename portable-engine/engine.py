#!/usr/bin/env python3
"""Portable Intelligence Engine bootstrap.

Local-first, read-only by default. No host-wide scanning and no network access.
The media adapter is intentionally provider-neutral; Bento4 executables are
looked up only inside this portable directory.
"""
from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import pathlib
import subprocess
import sys
import time

ROOT = pathlib.Path(sys.executable).resolve().parent if getattr(sys, "frozen", False) else pathlib.Path(__file__).resolve().parent
TOOLS = ROOT / "tools" / "bento4"
STATE = ROOT / "state"
RECEIPTS = STATE / "receipts"
OUTPUT = ROOT / "output"


def sha256(path: pathlib.Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def bento4(tool: str) -> pathlib.Path:
    candidates = [
        TOOLS / f"{tool}.exe",
        TOOLS / tool,
        TOOLS / f"{tool}.bin",
    ]
    for path in candidates:
        if path.is_file():
            return path
    raise FileNotFoundError(f"Bento4 tool not bundled: {tool}")


def inspect_media(path: pathlib.Path) -> dict:
    path = path.resolve()
    if not path.is_file():
        raise FileNotFoundError(path)
    try:
        tool = bento4("mp4info")
    except FileNotFoundError:
        return {"status": "unavailable", "reason": "Bento4 tools not bundled", "file": str(path)}
    proc = subprocess.run([str(tool), str(path)], capture_output=True, text=True, check=False)
    return {
        "status": "ok" if proc.returncode == 0 else "error",
        "returncode": proc.returncode,
        "file": str(path),
        "sha256": sha256(path),
        "stdout": proc.stdout,
        "stderr": proc.stderr,
    }


def receipt(event: str, payload: dict) -> pathlib.Path:
    RECEIPTS.mkdir(parents=True, exist_ok=True)
    record = {
        "timestamp_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "event": event,
        "payload": payload,
    }
    digest = hashlib.sha256(json.dumps(record, sort_keys=True).encode("utf-8")).hexdigest()
    record["receipt_sha256"] = digest
    out = RECEIPTS / f"{int(time.time() * 1000)}-{event}.json"
    out.write_text(json.dumps(record, indent=2), encoding="utf-8")
    return out


def verify_receipt(path: pathlib.Path) -> bool:
    """Recompute a receipt digest; this detects edits but is not a signature."""
    record = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(record, dict):
        return False
    supplied = record.pop("receipt_sha256", None)
    if not isinstance(supplied, str) or len(supplied) != 64:
        return False
    expected = hashlib.sha256(
        json.dumps(record, sort_keys=True).encode("utf-8")
    ).hexdigest()
    return hmac.compare_digest(supplied, expected)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Portable Intelligence Engine")
    parser.add_argument("--verify-receipt", type=pathlib.Path, metavar="FILE")
    args = parser.parse_args(argv)

    if args.verify_receipt is not None:
        try:
            valid = verify_receipt(args.verify_receipt)
        except (OSError, json.JSONDecodeError, UnicodeDecodeError) as exc:
            print(f"Receipt verification failed: {exc}", file=sys.stderr)
            return 1
        print("Receipt integrity: VERIFIED" if valid else "Receipt integrity: FAILED")
        return 0 if valid else 1

    STATE.mkdir(exist_ok=True)
    OUTPUT.mkdir(exist_ok=True)
    print("Portable Intelligence Engine — Autopilot v0.1")
    print(f"Root: {ROOT}")
    print("Mode: LOCAL / READ-ONLY")
    print("No host-wide scanning. No silent network access.")
    print()
    print("Bento4:", "available" if any((TOOLS / n).exists() for n in ("mp4info.exe", "mp4info", "mp4info.bin")) else "not bundled yet")
    path = receipt("startup", {"root": str(ROOT), "mode": "local-read-only"})
    print(f"Receipt: {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
