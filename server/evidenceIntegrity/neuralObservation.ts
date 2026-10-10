export const neuralObservationStatus = { kind: "NEURAL_DECODER_OUTPUT", status: "UNVERIFIED", evidentiaryLabel: "CLAIM" } as const;

export type NeuralObservation = {
  decoder: string;
  decoderVersion: string;
  modality: "EEG" | "MEG" | "ECoG" | "fNIRS" | "OTHER";
  decodedText: string;
  decoderConfidence: number;
  sessionId: string;
  observedAt: string;
  consentVersion: string;
  provenanceHash: string;
};
