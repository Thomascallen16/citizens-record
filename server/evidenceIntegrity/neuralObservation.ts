import { z } from "zod";

export const neuralObservationStatus = {
  kind: "NEURAL_DECODER_OUTPUT",
  status: "UNVERIFIED",
  evidentiaryLabel: "CLAIM",
} as const;

/**
 * A decoded output is an observation/claim, never proof of a person's thoughts.
 * The schema validates provenance metadata but does not validate the truth of
 * the decoded text or the decoder's confidence score.
 */
export const neuralObservationInputSchema = z.object({
  decoder: z.string().trim().min(1).max(160),
  decoderVersion: z.string().trim().min(1).max(80),
  modality: z.enum(["EEG", "MEG", "ECoG", "fNIRS", "OTHER"]),
  decodedText: z.string().trim().min(1).max(10000),
  decoderConfidence: z.number().finite().min(0).max(1),
  sessionId: z.string().trim().min(1).max(200),
  observedAt: z.string().datetime({ offset: true }),
  consentVersion: z.string().trim().min(1).max(120),
  provenanceHash: z.string().regex(/^[a-fA-F0-9]{64}$/, "Expected a SHA-256 hex digest"),
}).strict();

export type NeuralObservation = z.infer<typeof neuralObservationInputSchema>;

export function normalizeNeuralObservation(input: NeuralObservation) {
  const validated = neuralObservationInputSchema.parse(input);
  return {
    ...validated,
    provenanceHash: validated.provenanceHash.toLowerCase(),
    ...neuralObservationStatus,
  } as const;
}
