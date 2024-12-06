import { JSONSchemaType } from "ajv";
import { SweptOaeInterface } from "../../app/views/response-area/response-areas/swept-oae/swept-oae-exam/sept-oae-exam.interface";

export const sweptOaeSchema: JSONSchemaType<SweptOaeInterface> = {
  type: "object",
  properties: {
    enableSkip: { type: "boolean", nullable: true, default: false },
    responseRequired: { type: "boolean", nullable: true, default: true },
    type: { type: "string", enum: ["sweptOAEResponseArea"] },
    exportToCSV: { type: "boolean", nullable: true, default: false },
    tabsintId: { type: "string", nullable: true, default: "1" },
    f2Start: { type: "number", nullable: true, default: 500 },
    f2End: { type: "number", nullable: true, default: 16000 },
    frequencyRatio: { type: "number", nullable: true, default: 1.22, description: "Ratio of F2 to F1." },
    sweepDuration: { type: "number", nullable: true, default: 3, description: "Duration of sweep, not including start and end ramps. In seconds." },
    windowDuration: { type: "number", nullable: true, default: 3, description: "Span of analysis windows for least-squares fit. In seconds." },
    sweepType: { type: "string", enum: ["log", "linear"], nullable: true, default: "log" },
    minSweeps: { type: "number", nullable: true, default: 2 },
    maxSweeps: { type: "number", nullable: true, default: 5 },
    noiseFloorThreshold: { type: "number", nullable: true, default: 10 },
    showResults: { type: "boolean", nullable: true, default: true }
  },
  required: ["type"],
  additionalProperties: false
};
