import { JSONSchemaType } from "ajv";
import { WavfileInterface } from "../../app/interfaces/page-definition.interface";

export const wavfileSchema: JSONSchemaType<WavfileInterface> = {
    type: "object",
    properties: {
        cal: { type: "object"},
        useCommonRepo: { type: "boolean", nullable: true, default: false },
        path: { type: "string" },
        playbackMethod: {
            type: "string",
            enum: ["arbitrary", "as-recorded"],
            nullable: true,
            default: "arbitrary",
        },
        targetSPL: { 
            anyOf: [{ type: "number" }, { type: "string" }], 
            nullable: true, 
            default: 65 
        },
        weighting: { type: "string", enum: ["A", "C", "Z"], nullable: true, default: "Z" },
        startTime: { type: "number", nullable: true, default: 0 },
        endTime: { type: "number", nullable: true },
    },
    required: ["cal", "path"],
};
