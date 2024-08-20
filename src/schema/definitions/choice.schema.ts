import { JSONSchemaType } from "ajv";
import { ChoiceInterface } from "../../app/views/response-area/response-areas/multiple-choice/multiple-choice.interface";

export const choiceSchema: JSONSchemaType<ChoiceInterface> = {
    type: "object",
    properties: {
        label: {type: "string"},
        value: {type: "string"},
    },
    required: ["label", "value"]
}
