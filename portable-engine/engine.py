#!/usr/bin/env python3
"""Portable Intelligence Engine bootstrap.

Local-first, read-only by default. No host-wide scanning and no network access.
The media adapter is intentionally provider-neutral; Bento4 executables are
looked up only inside this portable directory.
"""
from __future__ import annotations
import hashlib, json, os, pathlib, subprocess, sys, time

ROOT = pathlib.Path(__file__).resolve().parent
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
    for p in candidates:
        if p.is_file():
            return p
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
    digest = hashlib.sha256(json.dumps(record, sort_keys=True).encode()).hexdigest()
    record["receipt_sha256"] = digest
    out = RECEIPTS / f"{int(time.time() * 1000)}-{event}.json"
    out.write_text(json.dumps(record, indent=2), encoding="utf-8")
    return out

def main() -> int:
    STATE.mkdir(exist_ok=True)
    OUTPUT.mkdir(exist_ok=True)
    print("Portable Intelligence Engine — Autopilot v0.1")
    print(f"Root: {ROOT}")
    print("Mode: LOCAL / READ-ONLY")
    print("No host-wide scanning. No silent network access.")
    print()
    print("Bento4:", "available" if any((TOOLS / n).exists() for n in ("mp4info.exe","mp4info","mp4info.bin")) else "not bundled yet")
    r = receipt("startup", {"root": str(ROOT), "mode": "local-read-only"})
    print(f"Receipt: {r}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
