import { JSONSchemaType } from "ajv";
import { MrtExamInterface, MrtPresentationInterface } from "../../app/views/response-area/response-areas/mrt/mrt-exam/mrt-exam.interface";

export const mrtPresentationSchema: JSONSchemaType<MrtPresentationInterface> = {
  type: "object",
  properties: {
    filename: { type: "string" },
    leveldBSpl: { type: "number" },
    useMeta: { type: "boolean" },
    responseChoices: { type: "array", items: { type: "string"} },
    correctResponseIndex: { type: "number" }
  },
  required: ["filename", "leveldBSpl", "useMeta", "responseChoices", "correctResponseIndex"]
}

export const mrtSchema: JSONSchemaType<MrtExamInterface> = {
  type: "object",
  properties: {
    enableSkip: { type: "boolean", nullable: true, default: false },
    responseRequired: { type: "boolean", nullable: true, default: false },
    type: { type: "string", enum: ["mrtResponseArea"] },
    exportToCSV: { type: "boolean", nullable: true, default: false },
    tabsintId: { type: "string", nullable: true, default: "1" },
    examDefinitionFilename: { type: "string"},
    numWavChannels: { type: "number" },
    outputChannel: { 
      oneOf: [
        { type: "string" },
        { type: "array", items: { type: "string" } }
      ]
    },
    presentationList: {
      type: "array",
      items: mrtPresentationSchema
    },
    showResults: { type: "boolean", nullable: true, default: true }
  },
  required: ["type", "examDefinitionFilename", "presentationList"],
  additionalProperties: false
};
