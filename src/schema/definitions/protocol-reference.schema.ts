import { JSONSchemaType } from "ajv";
import { ProtocolReferenceInterface } from "../../app/interfaces/page-definition.interface";

export const protocolReferenceSchema: JSONSchemaType<ProtocolReferenceInterface> = {
    type: "object",
    properties: {
        reference: { type: "string" },
        id: { type: "string", nullable: true },
        skipIf: { type: "string", nullable: true }
    },
    required: ["reference"]
};
