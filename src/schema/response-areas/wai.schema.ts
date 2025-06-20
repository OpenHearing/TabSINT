import { JSONSchemaType } from "ajv";
import { WAIInterface } from "../../app/views/response-area/response-areas/wideband-acoustic-immittance/wai-exam/wai-exam.interface";

export const waiSchema: JSONSchemaType<WAIInterface> = {
  type: "object",
  properties: {
    enableSkip: { type: "boolean", nullable: true, default: false },
    responseRequired: { type: "boolean", nullable: true, default: false },
    type: { type: "string", enum: ["WAIResponseArea"] },
    exportToCSV: { type: "boolean", nullable: true, default: false },
    tabsintId: { type: "string", nullable: true, default: "1" },
    fStart: { type: "number", nullable: true, default: 1000 },
    fEnd: { type: "number", nullable: true, default: 8000 },
    sweepDuration: { type: "number", nullable: true, default: 6, description: "Duration of sweep, not including start and end ramps. In seconds." },
    sweepType: { type: "string", enum: ["log", "linear"], nullable: true, default: "log" },
    level: { type: "number", nullable: true, default: 65 },
    numSweeps: { type: "number", nullable: true, default: 10 },
    windowDuration: { type: "number", nullable: true, default: 0.125, description: "Span of analysis windows for least-squares fit. In seconds." },
    numFrequencies: { type: "number", nullable: true, default: 256 },
    filename: { type: "string", nullable: true, default: "WAI_0001.WAV" },
    outputRawMeasurements: { type: "boolean", nullable: true, default: false },
    showResults: { type: "boolean", nullable: true, default: true },
    normativeAbsorbanceDataPath: { type: "string", nullable: true, default: "" },
  },
  required: ["type"]
};
