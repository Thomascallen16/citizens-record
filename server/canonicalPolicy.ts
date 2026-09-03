import type { epistemicCategories } from "../drizzle/canonical";

export type EpistemicCategory = typeof epistemicCategories[number];

export function assertFindingSavePolicy(category: EpistemicCategory, supportingEvidenceCount: number) {
  if (category === "FACT" && supportingEvidenceCount < 1) {
    throw new Error("A FACT finding requires at least one linked source-backed supporting evidence item.");
  }
}

export function assertPrivateOwner(actorUserId: number, ownerUserId: number) {
  if (actorUserId !== ownerUserId) throw new Error("Private record access denied.");
}
