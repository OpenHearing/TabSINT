import { JSONSchemaType } from "ajv";
import { SetFlagInterface } from "../../app/interfaces/page-definition.interface";

export const setFlagSchema: JSONSchemaType<SetFlagInterface> = {
    type: "object",
    properties: {
      id: { type: "string" },
      conditional: { type: "string" },
    },
    required: ["id", "conditional"],
  }
