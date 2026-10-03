import { describe, expect, it } from "vitest";
import {
  fingerprintProposal,
  runRecursiveImprovement,
  verifyImprovement,
  type ImprovementProposal,
} from "./recursiveImprovement";

function proposal(id: string, hypothesis: string, changeSummary = "change"): ImprovementProposal {
  return {
    id,
    hypothesis,
    changeSummary,
    proposer: "builder",
    fingerprint: fingerprintProposal(hypothesis, changeSummary),
  };
}

describe("recursive improvement engine", () => {
  it("requires evidence before accepting a higher score", () => {
    const result = verifyImprovement(
      proposal("p1", "faster verification"),
      {
        score: 90,
        testsPassed: true,
        verifier: "verifier",
        evidence: [],
        notes: [],
      },
      80,
      new Set(),
    );

    expect(result.state).toBe("REJECTED");
  });

  it("requires independent verification", () => {
    const p = proposal("p1", "safer verification");
    const result = verifyImprovement(
      p,
      {
        score: 90,
        testsPassed: true,
        verifier: "builder",
        evidence: [{ id: "T1", description: "test", source: "CI", independent: true }],
        notes: [],
      },
      80,
      new Set(),
    );

    expect(result.state).toBe("REJECTED");
  });

  it("accepts a strict evidence-backed improvement", () => {
    const result = verifyImprovement(
      proposal("p1", "better verification"),
      {
        score: 90,
        testsPassed: true,
        verifier: "independent-verifier",
        evidence: [{ id: "T1", description: "CI test suite", source: "GitHub Actions", independent: true }],
        notes: [],
      },
      80,
      new Set(),
    );

    expect(result.state).toBe("VERIFIED_IMPROVEMENT");
  });

  it("rejects duplicate proposals and prevents recursive loops", () => {
    const p = proposal("p1", "same idea");
    const result = verifyImprovement(
      p,
      {
        score: 95,
        testsPassed: true,
        verifier: "verifier",
        evidence: [{ id: "T1", description: "test", source: "CI", independent: true }],
        notes: [],
      },
      90,
      new Set([p.fingerprint]),
    );

    expect(result.state).toBe("REJECTED");
    expect(result.reason).toContain("Duplicate");
  });

  it("rejects duplicate content even when the supplied fingerprints differ", () => {
    const first = {
      ...proposal("p1", "same idea", "same change"),
      fingerprint: "attacker-fingerprint-a",
    };
    const second = {
      ...proposal("p2", "same idea", "same change"),
      fingerprint: "attacker-fingerprint-b",
    };

    const result = verifyImprovement(
      second,
      {
        score: 95,
        testsPassed: true,
        verifier: "verifier",
        evidence: [{ id: "T1", description: "test", source: "CI", independent: true }],
        notes: [],
      },
      90,
      new Set([fingerprintProposal(first.hypothesis, first.changeSummary)]),
    );

    expect(result.state).toBe("REJECTED");
    expect(result.reason).toContain("Duplicate");
  });

  it("canonicalizes proposer fingerprints before recursive loop detection", () => {
    let calls = 0;

    const run = runRecursiveImprovement({
      runId: "run-adversarial",
      objective: "prevent duplicate recursive proposals",
      baselineScore: 50,
      maxIterations: 3,
      propose: () => {
        calls += 1;
        return {
          id: `p${calls}`,
          hypothesis: "same idea",
          changeSummary: "same change",
          proposer: "builder",
          fingerprint: `forged-${calls}`,
        };
      },
      evaluate: (_proposal, context) => ({
        score: context.currentScore + 10,
        testsPassed: true,
        verifier: "independent-verifier",
        evidence: [{
          id: "E1",
          description: "Independent regression suite",
          source: "CI",
          independent: true,
        }],
        notes: [],
      }),
    });

    expect(run.state).toBe("REJECTED");
    expect(run.currentScore).toBe(60);
    expect(run.iterations).toHaveLength(2);
    expect(run.iterations[0].state).toBe("VERIFIED_IMPROVEMENT");
    expect(run.iterations[1].state).toBe("REJECTED");
    expect(run.iterations[1].reason).toContain("Duplicate");
    expect(run.iterations[1].proposal.fingerprint).toBe(
      fingerprintProposal("same idea", "same change"),
    );
  });

  it("recursively accepts multiple verified improvements until the limit", () => {
    const run = runRecursiveImprovement({
      runId: "run-1",
      objective: "improve evidence verification",
      baselineScore: 50,
      maxIterations: 3,
      propose: context =>
        proposal(`p${context.iteration}`, `improvement ${context.iteration}`, `change ${context.iteration}`),
      evaluate: (p, context) => ({
        score: context.currentScore + 10,
        testsPassed: true,
        verifier: "independent-verifier",
        evidence: [{
          id: `E${context.iteration}`,
          description: "Independent regression suite",
          source: "CI",
          independent: true,
        }],
        notes: [p.hypothesis],
      }),
    });

    expect(run.state).toBe("VERIFIED_IMPROVEMENT");
    expect(run.currentScore).toBe(80);
    expect(run.iterations).toHaveLength(3);
    expect(run.iterations.every(item => item.state === "VERIFIED_IMPROVEMENT")).toBe(true);
  });

  it("does not promote regressions", () => {
    const run = runRecursiveImprovement({
      runId: "run-2",
      objective: "protect correctness",
      baselineScore: 80,
      maxIterations: 3,
      propose: context => proposal("regression", "worse change"),
      evaluate: () => ({
        score: 79,
        testsPassed: true,
        verifier: "independent-verifier",
        evidence: [{ id: "E1", description: "test", source: "CI", independent: true }],
        notes: [],
      }),
    });

    expect(run.state).toBe("FAILED_IMPROVEMENT");
    expect(run.currentScore).toBe(80);
    expect(run.iterations).toHaveLength(1);
  });
});
