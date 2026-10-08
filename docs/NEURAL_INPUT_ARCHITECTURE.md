# Neural Input Architecture

The Evidence Integrity Engine accepts output from Brain2QWERTY-type neural decoders as an input source.

Boundary:

neural signal -> external decoder -> decoded observation -> Evidence Integrity Engine

Decoder confidence describes the decoder output. It does not establish that the decoded proposition is true.

Neural decoder output enters the evidence system as CLAIM / UNVERIFIED and must be independently checked against supporting and adverse evidence before any stronger evidentiary status is assigned.

The production adapter deliberately keeps the neural decoder replaceable. Future adapters can provide EEG, MEG, ECoG, fNIRS, speech, vision, sensor, Watchtower, or external-agent observations through the same boundary.

Raw neural recordings should remain outside the evidence record unless a separately authorized, privacy-reviewed storage layer is added.
