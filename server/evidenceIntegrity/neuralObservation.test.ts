import { describe, expect, it } from "vitest";
import {
  neuralObservationInputSchema,
  neuralObservationStatus,
  normalizeNeuralObservation,
} from "./neuralObservation";

const validObservation = {
  decoder: "local-decoder",
  decoderVersion: "1.0",
  modality: "EEG" as const,
  decodedText: "sample decoded output",
  decoderConfidence: 0.5,
  sessionId: "session-123",
  observedAt: "2026-10-10T12:00:00Z",
  consentVersion: "consent-v1",
  provenanceHash: "a".repeat(64),
};

describe("neural observation contract", () => {
  it("keeps decoder output unverified", () => {
    expect(neuralObservationStatus).toEqual({
      kind: "NEURAL_DECODER_OUTPUT",
      status: "UNVERIFIED",
      evidentiaryLabel: "CLAIM",
    });
  });

  it("validates input and normalizes the provenance hash", () => {
    const result = normalizeNeuralObservation(validObservation);
    expect(result.provenanceHash).toBe("a".repeat(64));
    expect(result.status).toBe("UNVERIFIED");
    expect(result.evidentiaryLabel).toBe("CLAIM");
  });

  it("rejects confidence outside the zero-to-one range", () => {
    expect(
      neuralObservationInputSchema.safeParse({
        ...validObservation,
        decoderConfidence: 1.5,
      }).success,
    ).toBe(false);
  });

  it("rejects a malformed provenance hash", () => {
    expect(
      neuralObservationInputSchema.safeParse({
        ...validObservation,
        provenanceHash: "not-a-sha256-hash",
      }).success,
    ).toBe(false);
  });
});
