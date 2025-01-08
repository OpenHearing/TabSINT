import { JSONSchemaType } from "ajv";
import { LikertInterface } from "../../app/views/response-area/response-areas/likert/likert/likert.interface";

export const likertSchema: JSONSchemaType<LikertInterface> = {
  type: "object",
  description: "A Likert scale answer, with optional specifiers for some or all of the points.",
  properties: {
    enableSkip: { type: "boolean", nullable: true, default: false },
    responseRequired: { type: "boolean", nullable: true, default: true },
    type: { type: "string", enum: ["likertResponseArea"]},
    useEmoticons: {
      type: "boolean",
      description: "If true, use emoticons instead of radio buttons. Requires levels == 5",
      nullable: true,
      default: false
    },
    levels: {
      type: "number",
      multipleOf: 1,
      description:
        "How many levels? E.g., if levels==3, then there are three choices: 0, 1, and 2.",
      default: 10,
      nullable: true
    },
    labels: {
      type: "array",
      description: "Description of the likeRT scale. Length should be equal to the levels array, which will display labels with each option. Otherwise, labels can be on length 2, where the first item is aligned to the left of the scale and the second item is aligned to the right.",
      items: {
        type: "string",
        description: "Words describing each levels."
      },
      nullable: true
    },
    position: {
      type: "string",
      enum: ["above", "below"],
      description: "Position label above or below the slider",
      nullable: true,
      default: "above"
    },
    questions: {
      type: "array",
      description: "Questions being asked. Length should be equal to the levels array. If only one, can use page level instruction test instead.",
      items: {
        type: "string",
      },
      nullable: true
    },
    useSlider: {
      type: "boolean",
      description: "If true, use a slider to 1 decimal acuracy to record the answer.",
      nullable: true,
      default: true
    },
    naBox: {
      type: "boolean",
      description: "If true, use a 'Not Applicable' textbox.",
      nullable: true,
      default: false
    },
  },
  required: [],
};
