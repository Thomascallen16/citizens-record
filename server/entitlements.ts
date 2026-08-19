import type { SubscriptionEntitlement } from "../drizzle/schema";

export function hasActiveMotionDraftingEntitlement(entitlement: SubscriptionEntitlement | undefined) {
  return Boolean(
    entitlement?.status === "active" &&
    (!entitlement.currentPeriodEnd || entitlement.currentPeriodEnd.getTime() > Date.now())
  );
}
