import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Pro Se Compass production publishing configuration", () => {
  it("uses a production app-bundle profile with remote auto-incremented build versions", () => {
    const eas = JSON.parse(readFileSync(resolve(process.cwd(), "eas.json"), "utf8"));
    expect(eas.cli.appVersionSource).toBe("remote");
    expect(eas.build.production.autoIncrement).toBe(true);
    expect(eas.build.production.android.buildType).toBe("app-bundle");
    expect(eas.submit.production.android.track).toBe("internal");
    expect(eas.submit.production.android.releaseStatus).toBe("draft");
  });

  it("sets initial native build versions without storing release credentials", () => {
    const appConfig = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");
    const ignoreRules = readFileSync(resolve(process.cwd(), ".gitignore"), "utf8");
    expect(appConfig).toContain('buildNumber: "1"');
    expect(appConfig).toContain("versionCode: 1");
    expect(ignoreRules).toContain("google-service-account*.json");
    expect(ignoreRules).toContain("AuthKey_*.p8");
  });
});
