import { JSONSchemaType } from "ajv";
import { PageInterface } from "../app/models/page/page.interface";
import { navMenuSchema } from "./definitions/navMenu.schema";
import { repeatPageSchema } from "./definitions/repeat-page.schema";
import { wavfileSchema } from "./definitions/wavfile.schema";
import { imageSchema } from "./definitions/image.schema";
import { videoSchema } from "./definitions/video.schema";
import { followOnSchema } from "./definitions/follow-on.schema";
import { setFlagSchema } from "./definitions/set-flag.schema";

export const pageSchema: JSONSchemaType<PageInterface> = {
    type: "object",
    properties: {
      id: { type: "string" },
      headset: {
        type: "string",
        enum: ["VicFirth", "Vic Firth S2", "HDA200", "WAHTS", "Audiometer", "EPHD1"],
        nullable: true,
      },
      skipIf: { type: "string", nullable: true },
      hideProgressBar: { type: "boolean", nullable: true, default: false },
      autoSubmitDelay: { type: "number", nullable: true, minimum: 50 },
      enableBackButton: { type: "boolean", nullable: true },
      navMenu: {
        type: "array",
        items: navMenuSchema, // Replace with actual NavMenu schema
        nullable: true,
      },
      title: { type: "string", nullable: true },
      subtitle: { type: "string", nullable: true },
      spacing: { type: "string", nullable: true },
      questionMainText: { type: "string", nullable: true },
      questionSubText: { type: "string", nullable: true },
      instructionText: { type: "string", nullable: true },
      helpText: { type: "string", nullable: true },
      resultMainText: { type: "string", nullable: true },
      resultSubText: { type: "string", nullable: true },
      repeatPage: { type: repeatPageSchema, nullable: true },
      preProcessFunction: { type: "string", nullable: true },
      wavfileStartDelayTime: { type: "number", nullable: true, minimum: 0, default: 1000 },
      wavfiles: {
        type: "array",
        items: wavfileSchema,
        nullable: true,
      },
      chaWavFiles: {
        type: "array",
        items: wavfileSchema,
        minItems: 1,
        maxItems: 2,
        nullable: true,
      },
      chaStream: { type: "boolean", nullable: true, default: false },
      image: { imageSchema, nullable: true },
      video: { videoSchema, nullable: true },
      responseArea: {
        type: "object",
        nullable: true,
        // Define oneOf for different response areas
      },
      submitText: { type: "string", nullable: true, default: "Submit" },
      followOns: { type: "array", items: followOnSchema, nullable: true },
      setFlags: { type: "array", items: setFlagSchema, nullable: true }
    },
    required: ["type", "id", "enableBackButton", "title", "questionMainText", "questionSubText",
        "instructionText", "helpText", "responseArea", "submitText", "followOns"
    ],
    additionalProperties: true,
  };
  