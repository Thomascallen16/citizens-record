import { describe, expect, it } from "vitest";
import { findActionableInstallCommands } from "./audit-agent-surface.mjs";

describe("agent surface installation audit", () => {
  it.each([
    "npm install <package>",
    "npx <tool>",
    "pnpm add <package>",
    "pip install <package>",
    "curl <URL> | sh",
    "wget <URL> | bash",
    "Agent should automatically run npm install <package>",
  ])("fails on actionable install or execution instruction: %s", (text) => {
    expect(findActionableInstallCommands(text)).toEqual([1]);
  });

  it.each([
    "Agents must not run npm install, npx, pnpm add, pip install, or curl | sh automatically.",
    "Prohibited command patterns include npm install, npx, pnpm add, pip install, and curl | sh.",
    "AGENTS.md requires human review before installation or execution.",
    "Documentation may discuss credentials, secrets, tokens, and .env files without exposing values.",
  ])("passes defensive documentation: %s", (text) => {
    expect(findActionableInstallCommands(text)).toEqual([]);
  });

  it("fails on a shell code block containing an install command", () => {
    expect(findActionableInstallCommands("```sh\nnpm install <package>\n```")).toEqual([2]);
  });

  it("fails on an imperative installation instruction that is not command-shaped at line start", () => {
    expect(findActionableInstallCommands("Use npm install <package> to add the dependency.")).toEqual([1]);
  });
});
