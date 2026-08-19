import { describe, expect, it } from "vitest";
import { hasActiveMotionDraftingEntitlement } from "./entitlements";
import type { SubscriptionEntitlement } from "../drizzle/schema";

function entitlement(status: SubscriptionEntitlement["status"], currentPeriodEnd: Date | null): SubscriptionEntitlement {
  return { id: 1, userId: 4, stripeCustomerId: "cus_test", stripeSubscriptionId: "sub_test", stripePriceId: "price_test", status, currentPeriodEnd, updatedAt: new Date() };
}

describe("motion drafting entitlement", () => {
  it("allows only an active and unexpired server-side subscription", () => {
    expect(hasActiveMotionDraftingEntitlement(entitlement("active", new Date(Date.now() + 60_000)))).toBe(true);
    expect(hasActiveMotionDraftingEntitlement(entitlement("active", new Date(Date.now() - 60_000)))).toBe(false);
    expect(hasActiveMotionDraftingEntitlement(entitlement("past_due", new Date(Date.now() + 60_000)))).toBe(false);
    expect(hasActiveMotionDraftingEntitlement(undefined)).toBe(false);
  });
});
