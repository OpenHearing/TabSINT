import { JSONSchemaType } from "ajv";
import { ChoiceInterface } from "../../app/views/response-area/response-areas/multiple-choice/multiple-choice.interface";

export const choiceSchema: JSONSchemaType<ChoiceInterface> = {
    type: "object",
    properties: {
      id: {
        type: 'string',
        description: 'A string representing this choice, as it will be recorded in the database. Required.',
        default: ''
      },
      text: {
        type: 'string',
        description: 'User-facing text; can be more verbose than "id". Defaults to contents of "id".',
        nullable: true
      },
      correct: {
        type: 'boolean',
        description: 'True if this is the "correct" response. If no choices are correct, then no scoring is performed.',
        default: false,
        nullable: true
      },
      disable: {
        type: 'boolean',
        description: 'If true button is disabled.',
        default: false,
        nullable: true
      },
      textColor: {
        type: 'string',
        description: 'Specify button text color e.g. #FF0000 for red or "green" for color green.',
        default: 'tabsint button text color',
        nullable: true
      },
      backgroundColor: {
        type: 'string',
        description: 'Specify button background color e.g. #FF0000 for red or "green" for color green.',
        default: 'tabsint button background color',
        nullable: true
      },
      fontSize: {
        type: 'string',
        description: 'Specify button text size in pixels e.g. 20px.',
        default: 'tabsint button button text size',
        nullable: true
      },
    },
    required: ["id"]
}
