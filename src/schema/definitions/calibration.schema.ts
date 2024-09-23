import { JSONSchemaType } from "ajv";
import { CalibrationInterface } from "../../app/interfaces/protocol-schema.interface";

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