import { JSONSchemaType } from "ajv";
import { TimeoutInterface } from "../../app/interfaces/protocol-schema.interface";

export const timeoutSchema: JSONSchemaType<TimeoutInterface> = {
    type: "object",
    properties: {
      nMaxSeconds: { type: "number", nullable: true },
      nMaxPages: { type: "number", nullable: true },
      showAlert: { type: "boolean", nullable: true }
    },
    nullable: true
  }
