import { JSONSchemaType } from "ajv";
import { MrtExamInterface, MrtTrialInterface } from "../../app/views/response-area/response-areas/mrt/mrt-exam/mrt-exam.interface";

export const mrtTrialSchema: JSONSchemaType<MrtTrialInterface> = {
  type: "object",
  properties: {
    filename: { type: "string" },
    leveldBSpl: { type: "number" },
    useMeta: { type: "boolean" },
    choices: { type: "array", items: { type: "string"} },
    answer: { type: "number" },
    SNR: { type: "number"}
  },
  required: ["filename", "leveldBSpl", "useMeta", "choices", "answer", "SNR"]
}

export const mrtSchema: JSONSchemaType<MrtExamInterface> = {
  type: "object",
  properties: {
    enableSkip: { type: "boolean", nullable: true, default: false },
    responseRequired: { type: "boolean", nullable: true, default: false },
    type: { type: "string", enum: ["mrtResponseArea"] },
    exportToCSV: { type: "boolean", nullable: true, default: false },
    tabsintId: { type: "string", nullable: true, default: "1" },
    examDefinitionFilename: { type: "string" },
    numWavChannels: { type: "number", nullable: true, default: 1 },
    outputChannel: { 
      type: "array",
      items: { type: "string" },
      nullable: true,
      default: ['HPL0']
    },
    randomizeTrials: { type: "boolean", nullable: true, default: false },
    trialList: {
      type: "array",
      items: mrtTrialSchema,
      nullable: true
    },
    showResults: { type: "boolean", nullable: true, default: true }
  },
  required: ["type"]
};
