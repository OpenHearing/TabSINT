import { JSONSchemaType } from "ajv";
import { ChaWavfileInterface } from "../../app/interfaces/page-definition.interface";

export const chaWavFileSchema: JSONSchemaType<ChaWavfileInterface> = {
    type: "object",
    properties: {
      Leq: {
        type: "array",
        items: { type: "number" },
        minItems: 2,
        maxItems: 4,
        nullable: true,
        default: [72, 72],
      },
      path: { type: "string" },
      SoundFileName: { type: "string", nullable: true },
      useMetaRMS: { type: "boolean", nullable: true, default: false },
      UseMetaRMS: { type: "boolean", nullable: true },
    },
    required: ["path"]
};
