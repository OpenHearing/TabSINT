import { JSONSchemaType } from "ajv"
import { TextBoxInterface } from "../../app/views/response-area/response-areas/textbox/textbox.interface"
import { TextBoxResultViewerInterface } from "../../app/views/response-area/response-areas/textbox-result-viewer/textbox-result-viewer.interface"

export const textBoxSchema: JSONSchemaType<TextBoxInterface> = {
    type: "object",
    properties: {
        enableSkip: { type: "boolean", nullable: true, default: false },
        responseRequired: { type: "boolean", nullable: true, default: true },
        type: { type: "string", enum: ["textboxResponseArea"] },
        rows: { type: "number", default: 1 },
        exportToCSV: { type: "boolean", nullable: true, default: false }
    },
    required: ["type"]
};

export const textBoxResultViewerSchema: JSONSchemaType<TextBoxResultViewerInterface> = {
    type: "object",
    properties: {
        enableSkip: { type: "boolean", nullable: true, default: false },
        responseRequired: { type: "boolean", nullable: true, default: true },
        type: { type: "string", enum: ["textboxResponseAreaResultViewer"] },
        pageIdsToDisplay: { type: "array", items: {type: "string", default: '' }},
    },
    required: ["type"]
};
