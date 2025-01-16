
import { JSONSchemaType } from "ajv"
import { ManualAudiometryInterface } from "../../app/views/response-area/response-areas/manual-audiometry/manual-audiometry.interface";
import { LevelUnits } from "../../app/utilities/constants";

export const manualAudiometrySchema: JSONSchemaType<ManualAudiometryInterface> = {
    type: "object",
    properties: {
        enableSkip: { type: "boolean", nullable: true, default: false },
        responseRequired: { type: "boolean", nullable: true, default: false },
        type: { type: "string", enum: ["manualAudiometryResponseArea"] },
        exportToCSV: { type: "boolean", nullable: true, default: false },
        tabsintId: { type: "string", nullable: true },
        maxOutputLevel: { type: "number", nullable: true },
        minOutputLevel: { type: "number", nullable: true },
        targetLevel: { type: "number", nullable: true },
        levelUnits: { type: "string", nullable: true },
        frequencies: {
            type: "array",
            items: { type: "number" },
            nullable: true
        },
        adjustments: {
            type: "array",
            items: { type: "number" },
            nullable: true
        },
        retspls: {
            type: "object",
            additionalProperties: { "type": "number"},
            nullable: true,
            required: []
        },
        showResults: {type: "boolean", nullable: true, default: true}

    },
    required: ["type"]
};
