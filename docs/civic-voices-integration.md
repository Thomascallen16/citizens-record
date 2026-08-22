# Constitutional Civic Voices — Integration Note

## Purpose and Boundary

The new public `/civic-voices` route will make the constitutional narration collection available as a source-linked learning resource. It is deliberately separate from the authenticated litigation workspace: it does not retrieve, create, or expose case data. It is an educational entry point into Citizen’s Record’s broader verification-first approach, not legal advice, a campaigning surface, or a promise of legal outcomes.

## Existing Strengths and Integration Gap

The repository already provides a private, owner-scoped evidence workspace with visible confidence labels, source-led exports, and an explicit research-not-legal-advice boundary. The public-facing gap is an accessible, source-grounded introduction that explains civic principles before a visitor has a case workspace. The narration collection fills that gap without weakening the privacy or entitlement boundaries documented in `security-boundaries.md`.

## Public Route Model

| Element | Integration decision |
|---|---|
| Route | `/civic-voices`, intentionally free of protected tRPC queries |
| Primary promise | Listen to constitutional principles, then inspect the founding source behind each narration |
| Content unit | Number, title, constitutional anchor, original audio, script excerpt, Truth Standard label, and primary-source link |
| Truth Standard | **LAW** for sourced constitutional text; **INFERENCE** for each narration’s original interpretive language; **UNKNOWN** when a recording cannot resolve an individual legal question |
| Primary sources | National Archives transcriptions of the Declaration, Bill of Rights, and Constitution |
| Boundary | “Educational source guide, not legal advice. Constitutional application depends on facts, law, and court interpretation.” |

## Visitor Flow

The route begins with a concise explanation of *Evidence Before Opinion*, then presents the ten recordings as a searchable listening library. Selecting a recording expands its full script and makes the primary authority visible. A final section explains how the workbench separates a verified source from a claim, inference, question, or unknown. The route offers a single, clearly labeled link back to the protected case workspace without implying that audio listening creates a case, account, legal relationship, or stored record.

## Verification Standard

All factual constitutional wording stays linked to the National Archives source records. The recordings remain clearly labeled as original narration and interpretation. No narration is presented as a judicial opinion, legal advice, or a factual allegation about any government, official, party, or current event.

## Visual Verification

The public route was inspected in a local preview after implementation. The hero, listening-library search control, first expanded recording, embedded player, source link, Truth Standard labels, and private-workspace return link all rendered on the page. The public route remained outside the authenticated workspace flow and did not require a case record or protected query to load.
