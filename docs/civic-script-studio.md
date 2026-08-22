# Civic Script Studio — Product Boundary

## Product Intent

The Civic Script Studio is a browser-only guided writing tool for a short, nonpartisan constitutional civic narration. It uses fixed, human-authored templates and source metadata; it does not make legal determinations, assess real-world allegations, retrieve case data, or present generated text as a legal conclusion.

## Input and Output Contract

| User input | Generated output |
|---|---|
| Constitutional principle | A linked primary authority and a short source-grounded framing line |
| Core question | A neutral opening that preserves the user’s question as a question rather than a fact |
| Audience and intended purpose | A plain-language middle section calibrated for clarity, reflection, or public education |
| Desired tone | Original word choice selected from a fixed calm, sober, or resolute vocabulary |
| Ending preference | A choice between a question, source reminder, or peaceful civic reflection |

## Truth Standard in the Tool

The Studio labels the authority-backed constitutional reference **LAW**, the generated connective language **INFERENCE**, and any real-world point the tool cannot establish **UNKNOWN**. It does not make factual allegations, name public officials, predict legal outcomes, or advise a person to ignore a law, confront an official, or take legal action.

## Privacy and Security Boundary

The tool runs locally in the visitor’s browser. It does not send the input to a server, create a case workspace, retain a draft, or access protected Citizens Record data. The visitor can copy or download the generated text, but downloaded material is explicitly marked as an educational working draft, not legal advice.

## Storyboard and Voiceover Template Contract

The expanded Studio may turn the source-labeled working draft into a production planning template, but it does not generate a finished video, a voice clone, synthetic news footage, or a legal conclusion. The storyboard is a neutral educational plan: every scene identifies a narrative purpose, visual direction, on-screen-text restraint, voiceover cue, time range, and a source/uncertainty note. It prohibits invented quotations, factual allegations about a real person or institution, confrontational staging, and visual instructions that treat inference as documentary evidence.

Voiceover cues include target time windows, a spoken line, delivery guidance, and breathing/transition notes. The tool’s cue sheet requests a generic adult English narrator with controlled, nonpartisan delivery; it does not prescribe imitation of a real person or copyrighted character. Any timing is a planning target rather than a guarantee of synthesized-audio duration.

| Output layer | Required label | Boundary |
|---|---|---|
| Constitutional framing | **LAW** | Link the primary source and identify the constitutional anchor. |
| Original visual or spoken connective material | **INFERENCE** | Treat as a creative interpretation, not as quoted authority or verified fact. |
| Claims the template cannot resolve | **UNKNOWN** | Preserve the fact gap and direct the viewer to the primary record. |

## Primary Authorities

1. [National Archives — Declaration of Independence: A Transcription](https://www.archives.gov/founding-docs/declaration-transcript)
2. [National Archives — The Bill of Rights: A Transcription](https://www.archives.gov/founding-docs/bill-of-rights-transcript)
3. [National Archives — The Constitution of the United States: A Transcription](https://www.archives.gov/founding-docs/constitution-transcript)

## Initial Interface Check

The local preview rendered the public writing tool with the principle selector, question field, audience selector, runtime selector, tone controls, ending options, and a visible browser-only/privacy boundary. A neutral civic question was entered successfully, and the remaining character count updated in the interface. A generated draft then rendered the selected Declaration-based **LAW** line, original **INFERENCE** narration, linked National Archives authority, and a visible **UNKNOWN** limitation. The copy action completed successfully and showed a confirmation message. The expanded control set presents 30-, 60-, and 90-second planning options before generation. A 60-second selection produced a source-labeled working draft and exposed the matching storyboard-and-voiceover template control. Opening that control rendered six timed visual beats, six voiceover cues, truth labels, delivery and transition directions, source-preserving visual guardrails, and a working download action for the complete production-template Markdown file.
