
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
        maxOutputLevel: { type: "number", nullable: true, default: 110, description: "In dB SPL" },
        minOutputLevel: { type: "number", nullable: true, default: -10, description: "In dB SPL" },
        targetLevelInLevelUnits: { type: "number", nullable: true, default: 40 },
        levelUnits: { type: "string", nullable: true, default: LevelUnits.dB_HL },
        frequencies: {
            type: "array",
            items: { type: "number" },
            nullable: true,
            default: [500, 1000, 2000, 4000, 8000]
        },        
        adjustmentStepSize: {
            type: "number",
            enum: [2,3,4,5],
            nullable: true,
            default: 5,
            description: "Specifies the increment or decrement value when adjusting target levels using the plus/minus buttons. Higher values result in larger adjustments per click."
        },
        incrementRatioMultiplier: {
            type: "number",
            enum: [1,2],
            nullable: true,
            default: 1,
            description: "Controls the ratio between positive and negative adjustments. When set to 1, positive and negative buttons make equal adjustments. When set to 2, positive adjustments are twice the magnitude of negative adjustments."
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
