import Ajv, {JSONSchemaType} from "ajv"
const ajv = new Ajv()
import { ProtocolSchemaInterface } from "../app/interfaces/protocol-schema.interface"
import { calibrationSchema } from "./definitions/calibration.schema";
import { navMenuSchema } from "./definitions/navMenu.schema";
import { pageSchema } from "./page.schema";
import { protocolReferenceSchema } from "./definitions/protocol-reference.schema";

const protocolSchemaBase: JSONSchemaType<ProtocolSchemaInterface> = {
  $id: "schema_base",
  type: "object",
  properties: {
    description: { type: "string", nullable: true },
    protocolId: { type: "string", nullable: true },
    resultFilename: { type: "string", nullable: true },
    publicKey: { type: "string", nullable: true },
    title: { type: "string", nullable: true },
    subtitle: { type: "string", nullable: true },
    instructionText: { type: "string", nullable: true },
    helpText: { type: "string", nullable: true },
    submitText: { type: "string", default: "Submit", nullable: true },
    tablet: { type: "string", nullable: true },
    headset: { type: "string", enum: ["VicFirth", "VicFirthS2", "HDA200", "WAHTS", "Audiometer", "EPHD1"], nullable: true, default: "VicFirth" },
    chaStream: { type: "boolean", default: false, nullable: true },
    randomization: { type: "string", enum: ["WithoutReplacement"], nullable: true },
    minTabsintVersion: { type: "string", nullable: true },
    commonMediaRepository: { type: "string", nullable: true },
    calibration: { type: "array", items: calibrationSchema, nullable: true },
    timeout: {
      type: "object",
      properties: {
        nMaxSeconds: { type: "number", nullable: true },
        nMaxPages: { type: "number", nullable: true },
        showAlert: { type: "boolean", nullable: true }
      },
      nullable: true
    },
    hideProgressBar: { type: "boolean", default: false, nullable: true },
    enableBackButton: { type: "boolean", default: false, nullable: true },
    navMenu: { type: "array", items: navMenuSchema, nullable: true },
    js: { type: "array", items: { type: "string" }, nullable: true },
    pages: {
      oneOf: [
        { type: "array", items: pageSchema },
        { type: "array", items: protocolReferenceSchema },
        { type: "array", items: { type: "object", $ref: "schema_base", required: ["pages"] } }
      ]
    },
    subProtocols: {
      type: "array",
      items: { type: "object", $ref: "schema_base", required: ["pages"] }, // Reference to self
      nullable: true
    }
  },
  required: ["pages"],
  additionalProperties: true
};

export const protocolSchema: JSONSchemaType<ProtocolSchemaInterface> = protocolSchemaBase;
