import { JSONSchemaType } from "ajv";
import { NavMenuInterface } from "../../app/interfaces/page-definition.interface";

export const navMenuSchema: JSONSchemaType<NavMenuInterface> = {
    type: "object"
};
