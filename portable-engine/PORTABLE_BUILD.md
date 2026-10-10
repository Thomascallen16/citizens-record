# Portable build status

**Product identity:** Big Data Energy (BDE) / Autopilot  
**Current engine version:** 0.1.2  
**Target:** Windows x64, portable USB folder, no system-wide installation

## What this build does today

- Starts locally and in read-only mode.
- Writes a uniquely named startup receipt beside the executable.
- Verifies the receipt's SHA-256 integrity on startup.
- Looks for Bento4 tools only inside `tools/bento4`.
- Can inspect a user-selected local media file through bundled `mp4info` when that tool is supplied.
- Has automated tests for receipt integrity, receipt uniqueness, and local-only Bento4 lookup.
- Builds a self-contained Windows executable with PyInstaller through GitHub Actions.

## Important limitations

This is a **portable engine foundation**, not yet the finished conversational AI companion. It does not currently include a local language model, chat interface, long-term conversational memory, specialist agents, or a complete media workflow. Bento4 binaries are not bundled in the current artifact, so actual MP4 inspection remains unavailable until compatible tools are packaged and verified.

The executable and ZIP produced by GitHub Actions are build artifacts, not proof of a successful clean-computer or physical-USB test. GitHub artifact downloads expire according to the workflow's retention period.

## Build and test

On a development machine with Python 3.12:

```powershell
python -m unittest discover -s portable-engine/tests -v
python -m py_compile portable-engine/engine.py
python portable-engine/engine.py
```

GitHub Actions builds `Autopilot.exe`, smoke-tests it, writes a SHA-256 executable hash into `manifest.json`, and publishes `Autopilot-Windows-x64.zip` as an artifact.

## Safety and portability rules

- Resolve all runtime paths relative to the executable, so a changed USB drive letter is supported.
- Do not scan the host machine.
- Do not silently download or install tools.
- Do not bypass DRM, encryption, licensing, or access controls.
- Treat receipt hashes as tamper-evidence, not proof of who created the receipt.
- Keep generated receipts and output on the portable drive.
