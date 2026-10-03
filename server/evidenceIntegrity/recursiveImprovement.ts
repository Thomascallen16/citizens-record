import { createHash } from "node:crypto";

export const recursiveImprovementStates = [
  "BASELINE",
  "TESTING",
  "VERIFIED_IMPROVEMENT",
  "FAILED_IMPROVEMENT",
  "REJECTED",
  "SUPERSEDED",
] as const;

export type RecursiveImprovementState = (typeof recursiveImprovementStates)[number];

export type ImprovementEvidence = {
  id: string;
  description: string;
  source: string;
  independent: boolean;
};

export type ImprovementProposal = {
  id: string;
  hypothesis: string;
  changeSummary: string;
  proposer: string;
  fingerprint: string;
};

export type ImprovementEvaluation = {
  score: number;
  testsPassed: boolean;
  verifier: string;
  evidence: ImprovementEvidence[];
  notes: string[];
};

export type ImprovementIteration = {
  iteration: number;
  baselineScore: number;
  candidateScore: number;
  state: RecursiveImprovementState;
  proposal: ImprovementProposal;
  evaluation: ImprovementEvaluation;
  reason: string;
};

export type RecursiveImprovementRun = {
  runId: string;
  objective: string;
  state: RecursiveImprovementState;
  baselineScore: number;
  currentScore: number;
  iterations: ImprovementIteration[];
};

export type ImprovementContext = {
  objective: string;
  currentScore: number;
  iteration: number;
  priorIterations: readonly ImprovementIteration[];
};

export type RecursiveImprovementOptions = {
  runId: string;
  objective: string;
  baselineScore: number;
  maxIterations: number;
  propose: (context: ImprovementContext) => ImprovementProposal;
  evaluate: (
    proposal: ImprovementProposal,
    context: ImprovementContext,
  ) => ImprovementEvaluation;
};

/**
 * A proposal is promoted only when it beats the current baseline and an
 * independent verifier supplies passing tests and source-backed evidence.
 * This deliberately prevents the proposer from being the sole authority
 * over its own claimed improvement.
 */
export function verifyImprovement(
  proposal: ImprovementProposal,
  evaluation: ImprovementEvaluation,
  baselineScore: number,
  seenFingerprints: ReadonlySet<string>,
): { state: RecursiveImprovementState; reason: string } {
  // Never trust a proposer-supplied fingerprint for identity. Derive the
  // canonical fingerprint from the proposal content at the verification
  // boundary so direct callers cannot bypass duplicate detection.
  const canonicalFingerprint = fingerprintProposal(
    proposal.hypothesis,
    proposal.changeSummary,
  );

  if (seenFingerprints.has(canonicalFingerprint)) {
    return {
      state: "REJECTED",
      reason: "Duplicate proposal fingerprint; recursive loop prevented.",
    };
  }

  if (proposal.proposer.trim() === evaluation.verifier.trim()) {
    return {
      state: "REJECTED",
      reason: "Proposer and verifier must be independent actors.",
    };
  }

  if (!Number.isFinite(evaluation.score) || evaluation.score < 0) {
    return {
      state: "REJECTED",
      reason: "Candidate score is invalid.",
    };
  }

  if (!evaluation.testsPassed) {
    return {
      state: "FAILED_IMPROVEMENT",
      reason: "Verification tests did not pass.",
    };
  }

  if (evaluation.evidence.length === 0) {
    return {
      state: "REJECTED",
      reason: "No evidence was supplied for the claimed improvement.",
    };
  }

  if (evaluation.evidence.some(item => !item.independent)) {
    return {
      state: "REJECTED",
      reason: "At least one required evidence item is not independently verified.",
    };
  }

  if (evaluation.score <= baselineScore) {
    return {
      state: "FAILED_IMPROVEMENT",
      reason: "Candidate did not strictly improve the current baseline.",
    };
  }

  return {
    state: "VERIFIED_IMPROVEMENT",
    reason: "Independent verification shows a strict, evidence-backed improvement.",
  };
}

export function fingerprintProposal(
  hypothesis: string,
  changeSummary: string,
): string {
  return createHash("sha256")
    .update(JSON.stringify({ hypothesis: hypothesis.trim(), changeSummary: changeSummary.trim() }))
    .digest("hex");
}

export function runRecursiveImprovement(
  options: RecursiveImprovementOptions,
): RecursiveImprovementRun {
  if (!Number.isInteger(options.maxIterations) || options.maxIterations < 1) {
    throw new Error("maxIterations must be a positive integer.");
  }

  if (!Number.isFinite(options.baselineScore)) {
    throw new Error("baselineScore must be finite.");
  }

  const iterations: ImprovementIteration[] = [];
  const seenFingerprints = new Set<string>();
  let currentScore = options.baselineScore;
  let state: RecursiveImprovementState = "BASELINE";

  for (let iteration = 1; iteration <= options.maxIterations; iteration += 1) {
    const context: ImprovementContext = {
      objective: options.objective,
      currentScore,
      iteration,
      priorIterations: iterations,
    };

    const proposedProposal = options.propose(context);
    // Canonicalize identity at the engine boundary. The proposer may supply
    // a fingerprint for compatibility, but it is never authoritative.
    const proposal: ImprovementProposal = {
      ...proposedProposal,
      fingerprint: fingerprintProposal(
        proposedProposal.hypothesis,
        proposedProposal.changeSummary,
      ),
    };

    const evaluation = options.evaluate(proposal, context);
    const result = verifyImprovement(proposal, evaluation, currentScore, seenFingerprints);

    seenFingerprints.add(proposal.fingerprint);
    state = result.state;

    iterations.push({
      iteration,
      baselineScore: currentScore,
      candidateScore: evaluation.score,
      state,
      proposal,
      evaluation,
      reason: result.reason,
    });

    if (state !== "VERIFIED_IMPROVEMENT") break;

    currentScore = evaluation.score;
  }

  return {
    runId: options.runId,
    objective: options.objective,
    state,
    baselineScore: options.baselineScore,
    currentScore,
    iterations,
  };
}
