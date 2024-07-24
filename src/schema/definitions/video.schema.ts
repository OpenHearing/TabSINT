import { JSONSchemaType } from "ajv";
import { VideoInterface } from "../../app/interfaces/page-definition.interface";

export const videoSchema: JSONSchemaType<VideoInterface> = {
    type: "object",
    properties: {
      path: { type: "string" },
      width: { type: "string", nullable: true, default: "100%" },
      autoplay: { type: "boolean", nullable: true, default: false },
      noSkip: { type: "boolean", nullable: true, default: false },
    },
    required: ["path"]
};
