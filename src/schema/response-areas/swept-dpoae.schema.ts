import { JSONSchemaType } from "ajv";
import { SweptDpoaeInterface } from "../../app/views/response-area/response-areas/swept-dpoae/swept-dpoae-exam/swept-dpoae-exam.interface";

export const sweptDpoaeSchema: JSONSchemaType<SweptDpoaeInterface> = {
  type: "object",
  properties: {
    enableSkip: { type: "boolean", nullable: true, default: false },
    responseRequired: { type: "boolean", nullable: true, default: false },
    type: { type: "string", enum: ["sweptDPOAEResponseArea"] },
    exportToCSV: { type: "boolean", nullable: true, default: false },
    tabsintId: { type: "string", nullable: true, default: "1" },
    outputCalibrationType: { type: "string", nullable: true, default: "SPL" },
    outputChannel1: { type: "string", nullable: true, default: "HPL0" },
    outputChannel2: { type: "string", nullable: true, default: "HPR0" },
    inputChannel: { type: "string", nullable: true, default: "JACK_AS_MIC" },
    f2Start: { type: "number", nullable: true, default: 1000 },
    f2End: { type: "number", nullable: true, default: 8000 },
    ratio: { type: "number", nullable: true, default: 1.22, description: "Ratio of F2 to F1." },
    sweepDuration: { type: "number", nullable: true, default: 6, description: "Duration of sweep, not including start and end ramps. In seconds." },
    sweepType: { type: "string", enum: ["log", "linear"], nullable: true, default: "log" },
    l1: { type: "number", nullable: true, default: 65 },
    l2: { type: "number", nullable: true, default: 55 },
    minSweeps: { type: "number", nullable: true, default: 16 },
    maxSweeps: { type: "number", nullable: true, default: 32 },
    noiseFloorThreshold: { type: "number", nullable: true, default: -10, description: "Early stopping criterion based on the DPlow noise floor." },
    SNRThreshold: { type: "number", nullable: true, default: 10, description: "Early stopping criterion based on the difference between DPlow and the DPlow noise floor." },
    windowDuration: { type: "number", nullable: true, default: 0.125, description: "Span of analysis windows for least-squares fit. In seconds." },
    numFrequencies: { type: "number", nullable: true, default: 512, description: "Number of frequencies in the returned data. Spaced across the range of F2, F1, and Fdp values in the sweep. Frequencies are spaced using the same function as the SweepType." },
    filename: { type: "string", nullable: true, default: "", description: "Filename to use to store full waveform" },
    outputRawMeasurements: { type: "boolean", nullable: true, default: false },
    showResults: { type: "boolean", nullable: true, default: true },
    normativeDataPath: { type: "string", nullable: true, default: "" },
  },
  required: ["type"]
};
