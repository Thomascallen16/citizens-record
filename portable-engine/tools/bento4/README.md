# Bento4 runtime slot

Place the platform-specific Bento4 executables here when packaging the portable build.

Expected tools include:
- mp4info
- mp4dump
- mp4extract
- mp4mux
- mp4fragment
- mp4split

The engine never downloads or silently installs tools. A release packager supplies
the appropriate Bento4 build and records its version/hash in the release manifest.
