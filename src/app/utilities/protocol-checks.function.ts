import { ProtocolErrorInterface } from "../interfaces/protocol-error.interface";
import { ProtocolInterface } from "../models/protocol/protocol.interface";

export function checkCalibrationFiles(activeProtocol: ProtocolInterface): string | void {
    let msg;
    const missingWavCalListLength = activeProtocol._missingWavCalList!.length;
    const missingCommonWavCalListLength= activeProtocol._missingCommonWavCalList!.length;

    if (areThereMissingCommonOrWavCal(missingWavCalListLength, missingCommonWavCalListLength)) {
      if (areThereMissingCommonAndWavCal(missingWavCalListLength, missingCommonWavCalListLength)) {
          msg =
          "Missing calibration(s) for wav files(s): " +
          missingWavCalListLength +
          ", and common media wav file(s): " +
          missingCommonWavCalListLength +
          ".";
      } else if (areThereMissingWavCal(missingWavCalListLength)) {
          msg = "Missing calibration(s) for wav files(s): " + missingWavCalListLength + ".";
      } else if (areThereMissingCommonWavCal(missingCommonWavCalListLength)) {
          msg = "Missing common media wav file(s): " + missingCommonWavCalListLength + ".";
      }
    }

    return msg;
}

function areThereMissingCommonOrWavCal(missingWavCalList: number, missingCommonWavCalList: number): boolean {
  return areThereMissingWavCal(missingWavCalList) || areThereMissingCommonWavCal(missingCommonWavCalList);
}

function areThereMissingCommonAndWavCal(missingWavCalList: number, missingCommonWavCalList: number): boolean {
  return areThereMissingWavCal(missingWavCalList) && areThereMissingCommonWavCal(missingCommonWavCalList);
}

function areThereMissingWavCal(missingWavCalList: number): boolean {
  return missingWavCalList > 0;
}

function areThereMissingCommonWavCal(missingCommonWavCalList: number): boolean {
  return missingCommonWavCalList > 0;
}

export function checkPreProcessFunctions(activeProtocol: ProtocolInterface): Array<ProtocolErrorInterface> {
    let errors = [];
    let msg;
    if (
        (activeProtocol._missingPreProcessFunctionList!.length > 0 || activeProtocol._missingControllerList!.length > 0) &&
        true // !activeProtocol!.js
      ) {
        msg =
          'The protocol uses custom functions that should be found in a customJs.js file, but the protocol does not have a "js" field pointing to this file.  Please make sure the file exists and is referenced properly.';
        errors.push({
          type: "Protocol",
          error: msg
        });
      }

      if (activeProtocol._missingPreProcessFunctionList!.length > 0) {
        msg =
          "The protocol references the following undefined pre-process functions: " +
          activeProtocol._missingPreProcessFunctionList +
          ".  Please make sure each function is defined properly in the customJs.js file.";
        activeProtocol.errors!.push({
          type: "Protocol",
          error: msg
        });
      }

      return errors;
}

export function checkControllers(activeProtocol: ProtocolInterface): Array<ProtocolErrorInterface> {
    let errors = [];
    let msg;

    if (activeProtocol._missingControllerList!.length > 0) {
        msg =
          "The protocol contains custom html pages that reference the following undefined controllers: " +
          activeProtocol._missingControllerList +
          ".  Please make sure each controller is defined properly in the customJs.js file.";
        errors.push({
          type: "Protocol",
          error: msg
        });
      }

      if (activeProtocol._missingHtmlList!.length > 0) {
        msg =
          "The protocol references the following html pages that could not be loaded:  " +
          activeProtocol._missingHtmlList +
          ".  Please make sure each html page exists and is referenced properly.";
        errors.push({
          type: "Protocol",
          error: msg
        });
      }

      return errors;
}