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
    f2Start: { type: "number", nullable: true, default: 1000 },
    f2End: { type: "number", nullable: true, default: 8000 },
    frequencyRatio: { type: "number", nullable: true, default: 1.22, description: "Ratio of F2 to F1." },
    sweepDuration: { type: "number", nullable: true, default: 6, description: "Duration of sweep, not including start and end ramps. In seconds." },
    windowDuration: { type: "number", nullable: true, default: 0.125, description: "Span of analysis windows for least-squares fit. In seconds." },
    sweepType: { type: "string", enum: ["log", "linear"], nullable: true, default: "log" },
    minSweeps: { type: "number", nullable: true, default: 16 },
    maxSweeps: { type: "number", nullable: true, default: 32 },
    noiseFloorThreshold: { type: "number", nullable: true, default: -10 },
    outputRawMeasurements: { type: "boolean", nullable: true, default: false },
    showResults: { type: "boolean", nullable: true, default: true }
  },
  required: ["type"],
  additionalProperties: false
};
