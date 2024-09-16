
import { JSONSchemaType } from "ajv"
import { ManualAudiometryInterface } from "../../app/views/response-area/response-areas/manual-audiometry/manual-audiometry.interface";

export const manualAudiometrySchema: JSONSchemaType<ManualAudiometryInterface> = {
    type: "object",
    properties: {
        enableSkip: { type: "boolean", nullable: true, default: false },
        responseRequired: { type: "boolean", nullable: true, default: true },
        type: { type: "string", enum: ["audiometryResponseArea"] },
        exportToCSV: { type: "boolean", nullable: true, default: false },
        maxOutputLevel: { type: "number", nullable: true },
        minOutputLevel: { type: "number", nullable: true },
        currentDbSpl: { type: "number", nullable: true },
        frequencies: {
            type: "array",
            items: { type: "number" },
            nullable: true
        },
        adjustments: {
            type: "array",
            items: { type: "number" },
            nullable: true
        }
    },
    required: ["type"]
};