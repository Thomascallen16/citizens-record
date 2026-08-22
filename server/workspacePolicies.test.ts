import { describe, expect, it } from "vitest";
import { analyticsEventNames, caseMemberRoles, evidenceItemStates } from "../drizzle/schema";
import { isValidSensitiveDataAcknowledgement, moderationRules, privacyNotice, PRIVACY_NOTICE_VERSION } from "../shared/workspacePolicies";

describe("private workspace policy", () => {
  it("requires both sensitive-data and authorization acknowledgements", () => {
    expect(isValidSensitiveDataAcknowledgement({ sensitiveDataAcknowledged: true, authorizedToShareAcknowledged: true })).toBe(true);
    expect(isValidSensitiveDataAcknowledgement({ sensitiveDataAcknowledged: true })).toBe(false);
    expect(isValidSensitiveDataAcknowledgement({ authorizedToShareAcknowledged: true })).toBe(false);
  });

  it("keeps the current product boundary owner-only and private by default", () => {
    expect(privacyNotice.sharing).toContain("Owner-only");
    expect(caseMemberRoles).toContain("OWNER");
    expect(evidenceItemStates).toContain("REFERENCE_ONLY");
    expect(moderationRules.some(rule => rule.includes("not authorized"))).toBe(true);
  });

  it("limits the production funnel to non-sensitive event names", () => {
    expect(analyticsEventNames).toEqual(["START_RECORD", "RECORD_CREATED", "SOURCE_ATTACHED", "RECORD_ACTIVATED", "RETURN"]);
    expect(PRIVACY_NOTICE_VERSION).toMatch(/^2026-08-/);
  });
});
