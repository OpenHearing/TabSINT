import { JSONSchemaType } from "ajv"
import { TextBoxInterface } from "../../app/views/response-area/response-areas/textbox/textbox.interface"

export const textBoxSchema: JSONSchemaType<TextBoxInterface> = {
    type: "object",
    properties: {
        enableSkip: { type: "boolean", nullable: true, default: false },
        responseRequired: { type: "boolean", nullable: true, default: true },
        type: { type: "string", default: "textboxResponseArea" },
        rows: { type: "number", nullable: true, default: 1 },
        exportToCSV: { type: "boolean", nullable: true, default: false }
    },
    required: ["type"]
};
