import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Pro Se Compass title configuration", () => {
  it("keeps the platform display title and Expo display name aligned", () => {
    const config = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");
    expect(config).toContain('appName: "Pro Se Compass"');
    expect(process.env.VITE_APP_TITLE).toBe("Pro Se Compass");
  });
});
