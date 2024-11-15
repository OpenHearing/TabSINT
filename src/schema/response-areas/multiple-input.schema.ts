import { JSONSchemaType } from "ajv";
import { MultipleInputInterface } from "../../app/views/response-area/response-areas/multiple-input/multiple-input.interface";

export const multipleInputSchema: JSONSchemaType<MultipleInputInterface> = {
  type: "object",
  description: "Allows multiple inputs of different types on the same page.",
  properties: {
    enableSkip: { type: "boolean", nullable: true, default: false },
    responseRequired: { type: "boolean", nullable: true, default: true },
    type: { type: "string", enum: ["multipleInputResponseArea"] },
    verticalSpacing: {
      type: "integer",
      nullable: true,
      description: "Vertical spacing between inputs, given in [px]",
    },
    textAlign: {
      type: "string",
      nullable: true,
      enum: ["left", "right", "center"],
      default: "center",
      description: "Horizontal alignment of text labels",
    },
    review: {
      type: "boolean",
      nullable: true,
      description: "Whether to allow the inputs to be reviewed without the input boxes.",
      default: false,
    },
    inputList: {
      type: "array",
      items: {
        type: "object",
        properties: {
          inputType: {
            type: "string",
            enum: ["text", "number", "dropdown", "date", "multi-dropdown", "yes-no"],
            nullable: true,
            default: "text",
          },
          text: { type: "string" },
          options: {
            type: "array",
            items: { type: "string" },
            nullable: true,
            description: "Array of options used when the `inputType` is a dropdown",
          },
          required: {
            type: "boolean",
            nullable: true,
            default: false,
            description: "Determines if the page is submittable without a response for this input",
          },
          exportToCSV: {
            type: "boolean",
            nullable: true,
            default: false,
            description: "Whether result should be exported to CSV upon submitting exam results.",
          },
          dateProperties: {
            type: "object",
            nullable: true,
            description: "Optional properties for when the `inputType` is a date",
            properties: {
              maxDate: {
                type: "string",
                nullable: true,
                description: "Maximum date allowed in ISO formatted string YYYY-MM-DD or 'today'",
              },
              minDate: {
                type: "string",
                nullable: true,
                description: "Minimum date allowed in ISO formatted string YYYY-MM-DD or 'today'",
              },
            },
            required: [],
          },
        },
        required: ["text"],
      },
    },
  },
  required: ["inputList"],
};
