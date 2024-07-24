import Ajv, {JSONSchemaType} from "ajv"
import { ProtocolSchemaInterface } from "../app/interfaces/protocol-schema.interface"
import { calibrationSchema } from "./definitions/calibration.schema";
import { timeoutSchema } from "./definitions/timeout.schema";
const ajv = new Ajv()
  
export const protocolSchema: JSONSchemaType<ProtocolSchemaInterface> = {
  type: "object",
  properties: {
    description: { type: "string", nullable: true },
    protocolId: { type: "string"},
    resultFilename: { type: "string", nullable: true },
    publicKey: { type: "string", nullable: true },
    title: { type: "string", nullable: true },
    subtitle: { type: "string", nullable: true },
    instructionText: { type: "string", nullable: true },
    helpText: { type: "string", nullable: true },
    submitText: { type: "string", default: "Submit", nullable: true },
    tablet: { type: "string", nullable: true },
    headset: { type: "string", enum: ["VicFirth", "VicFirthS2", "HDA200", "WAHTS", "Audiometer", "EPHD1"], default: "VicFirth" },
    chaStream: { type: "boolean", default: false },
    randomization: { type: "string", enum: ["WithoutReplacement"], nullable: true },
    minTabsintVersion: { type: "string", nullable: true },
    commonMediaRepository: { type: "string", nullable: true },
    calibration: {
      type: "array",
      items: calibrationSchema,
      nullable: true
    },
    timeout: {type: timeoutSchema, nullable: true},
    hideProgressBar: { type: "boolean", default: false },
    enableBackButton: { type: "boolean", default: false },
    navMenu: {
      type: "array",
      items: {
        // Define the properties of navMenu item based on the actual schema reference
        type: "object",
        properties: {
          // Define properties here
        }
      },
      nullable: true
    },
    js: {
      type: ["array", "string"],
      items: { type: "string" },
      nullable: true
    },
    pages: {
      type: "array",
      items: {
        // Define properties of pages based on the actual schema reference
        type: "object",
        properties: {
          // Define properties here
        }
      }
    },
    subProtocols: {
      type: "array",
      items: {
        type: "object",
        properties: {
          // Define properties here
        }
      },
      nullable: true
    }
  },
  required: ["pages"],
  additionalProperties: true
};

const validate = ajv.compile(protocolSchema);