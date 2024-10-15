import { JSONSchemaType } from "ajv";
import { CalibrationInterface } from "../../app/interfaces/protocol-schema.interface";
import { CalibrationResultViewerInterface } from "../../app/models/calibration-exam/calibration-exam.interface";

export const calibrationSchema: JSONSchemaType<CalibrationInterface> = {
    type: "object",
    properties: {
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
      responseRequired: { type: "boolean", nullable: true, default: true },
      type: { type: "string", enum: ["calibrationResponseAreaResultViewer"] },
      displayRightEar: { type: "boolean", default: false },
      displayLeftEar: { type: "boolean", default: false }
    },
    required: ["type"]
  };