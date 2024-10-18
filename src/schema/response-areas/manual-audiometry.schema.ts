
import { JSONSchemaType } from "ajv"
import { ManualAudiometryInterface } from "../../app/views/response-area/response-areas/manual-audiometry/manual-audiometry.interface";
import { ManualAudiometryResultViewerInterface } from "../../app/views/response-area/response-areas/manual-audiometry-result-viewer/manual-audiometry-result-viewer.interface";

export const manualAudiometrySchema: JSONSchemaType<ManualAudiometryInterface> = {
    type: "object",
    properties: {
        enableSkip: { type: "boolean", nullable: true, default: false },
        responseRequired: { type: "boolean", nullable: true, default: true },
        type: { type: "string", enum: ["manualAudiometryResponseArea"] },
        exportToCSV: { type: "boolean", nullable: true, default: false },
        tabsintId: { type: "string", nullable: true },
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

export const manualAudiometryResultViewerSchema: JSONSchemaType<ManualAudiometryResultViewerInterface> = {
    type: "object",
    properties: {
        enableSkip: { type: "boolean", nullable: true, default: false },
        responseRequired: { type: "boolean", nullable: true, default: true },
        type: { type: "string", enum: ["manualAudiometryResponseAreaResultViewer"] },
        pageIdsToDisplay: { type: "array", items: {type: "string", default: '' }},
    },
    required: ["type"]
};