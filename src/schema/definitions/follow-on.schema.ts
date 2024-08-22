import { JSONSchemaType } from "ajv";
import { FollowOnInterface } from "../../app/interfaces/page-definition.interface";
import { protocolReferenceSchema } from "./protocol-reference.schema";

export const followOnSchema: JSONSchemaType<FollowOnInterface> = {
  type: "object",
  properties: {
    conditional: { type: "string" },
    target: {
      oneOf: [
        { type: "object", $ref: "page_base", required: ["id"] },
        protocolReferenceSchema,
        { type: "object", $ref: "schema_base", required: ["pages"] }
      ],
    },
  },
  required: ["conditional", "target"],
};
