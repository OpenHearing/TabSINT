import { JSONSchemaType } from "ajv";
import { RepeatPageInterface } from "../../app/interfaces/page-definition.interface";

export const repeatPageSchema: JSONSchemaType<RepeatPageInterface> = {
    type: "object",
    properties: {
        nRepeats: { type: "number", default: 2 },
        repeatIf: { type: "string", nullable: true },
    },
    required: ["nRepeats"]
};
