import { JSONSchemaType } from "ajv";
import { CalibrationExamInterface } from "../../app/views/response-area/calibration-exam/calibration-exam-component/calibration-exam.interface";


export const calibrationExamSchema: JSONSchemaType<CalibrationExamInterface> = {
    type: "object",
    properties: {
        enableSkip: { type: "boolean", nullable: true, default: false },
        showResults: { type: "boolean", nullable: true, default: false },
        responseRequired: { type: "boolean", nullable: true, default: true },
        type: { type: "string", enum: ["calibrationResponseArea"] },
        tabsintId: { type: "string", nullable: true },
        exportToCSV: { type: "boolean", nullable: true, default: false },
        frequencies: {
            type: "array",
            items: { type: "number" },
            nullable: true
        },
        targetLevels: {
            type: "array",
            items: { type: "number" },
            nullable: true
        },
    },
    required: ["type"],
    additionalProperties: false
};
