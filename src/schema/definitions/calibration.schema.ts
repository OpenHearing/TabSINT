import { JSONSchemaType } from "ajv";
import { CalibrationInterface } from "../../app/interfaces/protocol-schema.interface";
import { CalibrationResultViewerInterface } from "../../app/views/response-area/response-areas/calibration-exam/calibration-exam-component/calibration-exam.interface";

export const calibrationSchema: JSONSchemaType<CalibrationInterface> = {
  type: "object",
  properties: {
    enableSkip: { type: "boolean", nullable: true, default: false },
    responseRequired: { type: "boolean", nullable: true, default: false },
    type: { type: "string", enum: ["calibrationResponseArea"] },
    wavfiles: { type: "array", items: { type: "string" } },
    referenceFile: { type: "string", nullable: true },
    referenceLevel: { type: "number", nullable: true },
    calibrationFilter: { type: "string", enum: ["full", "flat"], default: "full", nullable: true }
  },
  required: ["wavfiles"]
};

export const calibrationResultViewerSchema: JSONSchemaType<CalibrationResultViewerInterface> = {
  type: "object",
  properties: {
    enableSkip: { type: "boolean", nullable: true, default: false },
    responseRequired: { type: "boolean", nullable: true, default: false },
    type: { type: "string", enum: ["calibrationResponseAreaResultViewer"] },
    displayRightEar: { type: "boolean", default: false },
    displayLeftEar: { type: "boolean", default: false }
  },
  required: ["type"]
};