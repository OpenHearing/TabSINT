
import { JSONSchemaType } from "ajv"
import { ManualAudiometryInterface } from "../../app/views/response-area/response-areas/manual-audiometry/manual-audiometry.interface";
import { LevelUnits } from "../../app/utilities/constants";

export const manualAudiometrySchema: JSONSchemaType<ManualAudiometryInterface> = {
    type: "object",
    properties: {
        enableSkip: { type: "boolean", nullable: true, default: false },
        responseRequired: { type: "boolean", nullable: true, default: true },
        type: { type: "string", enum: ["manualAudiometryResponseArea"] },
        exportToCSV: { type: "boolean", nullable: true, default: false },
        tabsintId: { type: "string", nullable: true },
        maxOutputLevel: { type: "number", nullable: true, default: 110 },
        minOutputLevel: { type: "number", nullable: true, default: -10 },
        targetLevel: { type: "number", nullable: true, default: 40 },
        levelUnits: { type: "string", nullable: true, default: LevelUnits.dB_SPL },
        frequencies: {
            type: "array",
            items: { type: "number" },
            nullable: true,
            default: [500, 1000, 2000, 4000, 8000]
        },
        adjustments: {
            type: "array",
            items: { type: "number" },
            nullable: true,
            default: [10, -5]
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
