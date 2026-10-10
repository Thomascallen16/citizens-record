import { describe, expect, it } from "vitest";
import { neuralObservationStatus } from "./neuralObservation";

describe("neural observation contract", () => {
  it("keeps decoder output unverified", () => {
    expect(neuralObservationStatus).toEqual({
      kind: "NEURAL_DECODER_OUTPUT",
      status: "UNVERIFIED",
      evidentiaryLabel: "CLAIM",
    });
  });
});
