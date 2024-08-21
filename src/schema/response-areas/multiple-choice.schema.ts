import { JSONSchemaType } from "ajv"
import { MultipleChoiceInterface } from "../../app/views/response-area/response-areas/multiple-choice/multiple-choice.interface"
import { choiceSchema } from "../definitions/choice.schema"

export const multipleChoiceSchema: JSONSchemaType<MultipleChoiceInterface> = {
    type: "object",
    properties: {
        enableSkip: { type: "boolean", nullable: true, default: false },
        responseRequired: { type: "boolean", nullable: true, default: true },
        type: { type: "string", enum: ["multipleChoiceResponseArea"] },
        choices: { type: "array", nullable: true, items: choiceSchema },
        other: { type: "string", nullable: true },
        verticalSpacing: { type: "number", nullable: true },
        delayEnable: { type: "number", nullable: true },
        feedback: { type: "string", enum: ["gradeResponse", "showCorrect"], nullable: true },
        exportToCSV: { type: "boolean", nullable: true, default: false }
    },
    required: ["type"]
};
