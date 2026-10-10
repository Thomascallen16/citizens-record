# Portable build plan

## Current development build
- Launcher: launch.bat
- Runtime: Python 3 standard library
- Default posture: local, read-only
- Evidence: SHA-256 startup receipts
- Media layer: Bento4 adapter slot

## Release target
A release package should include a pinned Bento4 distribution appropriate to the
target OS, a self-contained runtime where practical, and a manifest containing
component versions and hashes.

The launcher must resolve paths relative to itself so the drive letter can change.

## Acceptance checks
1. Copy the directory to removable storage.
2. Double-click launch.bat on a clean Windows machine with the supported runtime.
3. Confirm no host-wide scan occurs.
4. Confirm a startup receipt is created under state/receipts.
5. Add Bento4 binaries and verify mp4info is discovered locally.
6. Run a media inspection against a user-authorized local file.
