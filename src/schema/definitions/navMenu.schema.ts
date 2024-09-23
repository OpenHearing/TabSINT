import { JSONSchemaType } from "ajv";
import { NavMenuInterface } from "../../app/interfaces/page-definition.interface";
import { protocolReferenceSchema } from "./protocol-reference.schema";

export const navMenuSchema: JSONSchemaType<NavMenuInterface> = {
    type: 'object',
    description: 'Nav menu object to define a custom navigation menu at the protocol or page level.',
    properties: {
      text: {
        type: 'string',
        description: 'Link text to display in the menu'
      },
      target: {
        oneOf: [
          { type: "object", $ref: "page_base", required: ["id"] },
          protocolReferenceSchema
        ]
      },
      returnHereAfterward: {
        type: 'boolean',
        description: 'If true, return to current page after finishing target page or protocol'
      }
    },
    required: ['text', 'target', 'returnHereAfterward']
};
