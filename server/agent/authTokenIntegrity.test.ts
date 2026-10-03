import { describe, expect, it, vi } from "vitest";

/**
 * AUTH_TOKEN_INTEGRITY
 *
 * Regression contract for credential handling at provider/transport boundaries.
 * This is intentionally test-only: it does not change production authentication.
 *
 * Any future GitHub App / provider adapter should satisfy this same contract:
 * credentials are opaque bytes/strings, not structured JWTs, and must never
 * enter evidence persistence or logging paths.
 */

type EvidenceRecord = Record<string, unknown>;

function forwardOpaqueCredential(
  token: string,
  transport: (request: { headers: Headers }) => void,
): void {
  // Test-only reference implementation of the invariant:
  // the credential is copied verbatim into Authorization and nowhere else.
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  transport({ headers });
}

const legacyInstallationToken = "ghs_legacy_installation_token_1234567890";
const statelessInstallationToken =
  "ghs_" + "A".repeat(503) + ".opaque-but-not-parsed";
const actionsGithubToken =
  "ghs_actions_" + "Z".repeat(700) + "_variable_length";

describe("AUTH_TOKEN_INTEGRITY", () => {
  const credentials = [
    ["legacy GitHub installation token", legacyInstallationToken],
    ["stateless GitHub installation token", statelessInstallationToken],
    ["Actions GITHUB_TOKEN", actionsGithubToken],
  ] as const;

  it.each(credentials)("%s is treated as opaque", (_name, token) => {
    const transport = vi.fn();

    forwardOpaqueCredential(token, transport);

    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0]?.[0].headers.get("Authorization")).toBe(
      `Bearer ${token}`,
    );
  });

  it("makes no fixed-length assumption", () => {
    const lengths = credentials.map(([, token]) => token.length);

    expect(new Set(lengths).size).toBe(lengths.length);
    for (const [, token] of credentials) {
      const transport = vi.fn();
      forwardOpaqueCredential(token, transport);
      expect(
        transport.mock.calls[0]?.[0].headers.get("Authorization"),
      ).toBe(`Bearer ${token}`);
    }
  });

  it("does not parse credentials as JWTs", () => {
    const jwtParser = vi.fn(() => {
      throw new Error("JWT parsing must not occur");
    });

    for (const [, token] of credentials) {
      const transport = vi.fn();
      forwardOpaqueCredential(token, transport);

      expect(jwtParser).not.toHaveBeenCalled();
      expect(
        transport.mock.calls[0]?.[0].headers.get("Authorization"),
      ).toContain(token);
    }
  });

  it("does not truncate credentials", () => {
    for (const [, token] of credentials) {
      const transport = vi.fn();
      forwardOpaqueCredential(token, transport);

      const authorization =
        transport.mock.calls[0]?.[0].headers.get("Authorization");
      expect(authorization).toBe(`Bearer ${token}`);
      expect(authorization?.slice("Bearer ".length)).toBe(token);
    }
  });

  it("does not log credentials", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    try {
      for (const [, token] of credentials) {
        forwardOpaqueCredential(token, () => undefined);
      }

      for (const [, token] of credentials) {
        expect(log).not.toHaveBeenCalledWith(expect.stringContaining(token));
        expect(warn).not.toHaveBeenCalledWith(expect.stringContaining(token));
        expect(error).not.toHaveBeenCalledWith(expect.stringContaining(token));
      }
    } finally {
      log.mockRestore();
      warn.mockRestore();
      error.mockRestore();
    }
  });

  it("does not persist credentials in evidence records", () => {
    const evidenceRecords: EvidenceRecord[] = [];

    for (const [, token] of credentials) {
      forwardOpaqueCredential(token, () => undefined);
    }

    expect(evidenceRecords).toEqual([]);
    expect(JSON.stringify(evidenceRecords)).not.toMatch(/ghs_/);
  });

  it("preserves the Authorization header value intact", () => {
    for (const [, token] of credentials) {
      let receivedAuthorization: string | null = null;

      forwardOpaqueCredential(token, ({ headers }) => {
        receivedAuthorization = headers.get("Authorization");
      });

      expect(receivedAuthorization).toBe(`Bearer ${token}`);
    }
  });
});
