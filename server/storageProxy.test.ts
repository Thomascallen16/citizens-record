import { describe, expect, it, vi } from "vitest";
import { isStorageKeyAuthorized } from "./_core/storageProxy";

describe("storage proxy authorization", () => {
  it("allows a key only when the authorization lookup confirms ownership", async () => {
    const lookup = vi.fn(async (userId: number, key: string) =>
      userId === 7 && key === "evidence/7/ready.pdf",
    );

    await expect(
      isStorageKeyAuthorized(7, "evidence/7/ready.pdf", lookup),
    ).resolves.toBe(true);
    expect(lookup).toHaveBeenCalledWith(7, "evidence/7/ready.pdf");
  });

  it("rejects a storage key belonging to another user", async () => {
    const lookup = vi.fn(async (userId: number, key: string) =>
      userId === 7 && key === "evidence/7/ready.pdf",
    );

    await expect(
      isStorageKeyAuthorized(8, "evidence/7/ready.pdf", lookup),
    ).resolves.toBe(false);
  });

  it("rejects keys that are not authorized", async () => {
    const lookup = vi.fn(async () => false);

    await expect(
      isStorageKeyAuthorized(7, "evidence/7/deleted.pdf", lookup),
    ).resolves.toBe(false);
  });
});
