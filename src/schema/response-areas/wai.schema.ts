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
    l: { type: "number", nullable: true, default: 65 },
    numSweeps: { type: "number", nullable: true, default: 10 },
    windowDuration: { type: "number", nullable: true, default: 0.125, description: "Span of analysis windows for least-squares fit. In seconds." },
    numFrequencies: { type: "number", nullable: true, default: 256 },
    filename: { type: "string", nullable: true, default: "" },
    outputRawMeasurements: { type: "boolean", nullable: true, default: false },
    outputChannel: { type: "string", nullable: true, default: "HPL0" },
    inputChannels: { type: "array", "items": {"type":"string"}, nullable: true, default: ["EPSHIELD_LEFT_PDM_MIC1","EPSHIELD_LEFT_PDM_MIC2","EPSHIELD_RIGHT_PDM_MIC1","EPSHIELD_RIGHT_PDM_MIC2"] },
    aurenInsideDiameter: { type: "number", nullable: true, default: 3.4 },
    aurenLength: { type: "number", nullable: true, default: 31.7 },
    earCanalDiameter: { type: "number", nullable: true, default: 7.5 },
    earCanalLength: { type: "number", nullable: true, default: 20 },
    showResults: { type: "boolean", nullable: true, default: true }
  },
  required: ["type"]
};
