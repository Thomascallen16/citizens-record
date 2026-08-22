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

## Primary Authorities

1. [National Archives — Declaration of Independence: A Transcription](https://www.archives.gov/founding-docs/declaration-transcript)
2. [National Archives — The Bill of Rights: A Transcription](https://www.archives.gov/founding-docs/bill-of-rights-transcript)
3. [National Archives — The Constitution of the United States: A Transcription](https://www.archives.gov/founding-docs/constitution-transcript)

## Initial Interface Check

The local preview rendered the public writing tool with the principle selector, question field, audience selector, tone controls, ending options, and a visible browser-only/privacy boundary. A neutral civic question was entered successfully, and the remaining character count updated in the interface. A generated draft then rendered the selected Declaration-based **LAW** line, original **INFERENCE** narration, linked National Archives authority, and a visible **UNKNOWN** limitation. The copy action completed successfully and showed a confirmation message.
