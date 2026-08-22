# Workspace Security Boundaries

Every user-visible case resource is accessed through a protected procedure. The server resolves cases by both `caseId` and the authenticated `userId`; dependent records additionally use the authenticated `userId` and `caseId` in their data-access predicates. A missing record is intentionally reported as unavailable in the current workspace rather than exposing another user’s data.

Paid drafting is separately guarded on the server. The server verifies the saved subscription entitlement before it reads selected evidence rows or creates a motion draft. Client controls never grant entitlement. Webhook lifecycle updates are signature-verified before they update the entitlement record.
