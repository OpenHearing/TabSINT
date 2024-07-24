import { JSONSchemaType } from "ajv";
import { FollowOnInterface } from "../../app/interfaces/page-definition.interface";
import { pageSchema } from "../page.schema";
import { protocolReferenceSchema } from "./protocol-reference.schema";
import { protocolSchema } from "../protocol.schema";

export const followOnSchema: JSONSchemaType<FollowOnInterface> = {
    type: "object",
    properties: {
      conditional: { type: "string" },
      target: {
        anyOf: [
          pageSchema,
          protocolReferenceSchema,
          protocolSchema,
        ],
      },
    },
    required: ["conditional", "target"],
};
