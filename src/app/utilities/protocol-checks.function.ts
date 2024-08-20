import { ProtocolErrorInterface } from "../interfaces/protocol-error.interface";
import { ActiveProtocolInterface } from "../models/protocol/protocol.interface";
import { DialogType } from "./constants";

export function checkCalibrationFiles(activeProtocol: ActiveProtocolInterface): string | void {
    var msg;
    if (activeProtocol!._missingWavCalList!.length > 0 || activeProtocol!._missingCommonWavCalList!.length > 0) {
        if (activeProtocol!._missingWavCalList!.length + activeProtocol!._missingCommonWavCalList!.length < 10) {
            if (activeProtocol!._missingWavCalList!.length > 0 && activeProtocol!._missingCommonWavCalList!.length > 0) {
                msg =
                "Missing calibration(s) for wav files(s): " +
                activeProtocol!._missingWavCalList! +
                ", and common media wav file(s): " +
                activeProtocol!._missingCommonWavCalList! +
                ".";
            } else if (activeProtocol!._missingWavCalList!.length > 0 && activeProtocol!._missingCommonWavCalList!.length <= 0) {
                msg = "Missing calibration(s) for wav files(s): " + activeProtocol!._missingWavCalList! + ".";
            } else if (activeProtocol!._missingWavCalList!.length <= 0 && activeProtocol!._missingCommonWavCalList!.length > 0) {
                msg = "Missing common media wav file(s): " + activeProtocol!._missingCommonWavCalList! + ".";
            }
        } else {
            if (activeProtocol!._missingWavCalList!.length > 0 && activeProtocol!._missingCommonWavCalList!.length > 0) {
                msg =
                "Missing calibrations for " +
                activeProtocol!._missingWavCalList!.length +
                " wav files(s), and " +
                activeProtocol!._missingCommonWavCalList!.length +
                " common media wav files(s)";
            } else if (activeProtocol!._missingWavCalList!.length > 0 && activeProtocol!._missingCommonWavCalList!.length <= 0) {
                msg = "Missing calibrations for " + activeProtocol!._missingWavCalList!.length + " wav files(s). ";
            } else {
                msg = "Missing calibrations for " + activeProtocol!._missingCommonWavCalList!.length + " common media wav files(s)";
            }
        }
    }
    return msg;
}

export function checkPreProcessFunctions(activeProtocol: ActiveProtocolInterface): Array<ProtocolErrorInterface> {
    var errors = [];
    var msg;
    if (
        (activeProtocol!._missingPreProcessFunctionList!.length > 0 || activeProtocol!._missingControllerList!.length > 0) &&
        true // !activeProtocol!.js
      ) {
        msg =
          'The protocol uses custom functions that should be found in a customJs.js file, but the protocol does not have a "js" field pointing to this file.  Please make sure the file exists and is referenced properly.';
        errors.push({
          type: "Protocol",
          error: msg
        });
      }

      if (activeProtocol!._missingPreProcessFunctionList!.length > 0) {
        msg =
          "The protocol references the following undefined pre-process functions: " +
          activeProtocol!._missingPreProcessFunctionList +
          ".  Please make sure each function is defined properly in the customJs.js file.";
        activeProtocol!.errors!.push({
          type: "Protocol",
          error: msg
        });
      }

      return errors;
}

export function checkControllers(activeProtocol: ActiveProtocolInterface): Array<ProtocolErrorInterface> {
    var errors = [];
    var msg;

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
          activeProtocol!._missingHtmlList +
          ".  Please make sure each html page exists and is referenced properly.";
        errors.push({
          type: "Protocol",
          error: msg
        });
      }

      return errors;
}