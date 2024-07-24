import { JSONSchemaType } from "ajv";
import { ImageInterface } from "../../app/interfaces/page-definition.interface";

export const imageSchema: JSONSchemaType<ImageInterface> = {
    type: "object",
    properties: {
      path: { type: "string" },
      width: { type: "string", nullable: true, default: "100%" },
    },
    required: ["path"]
};
