import { ProtocolErrorInterface } from '../interfaces/protocol-error.interface';
import { ProtocolInterface } from '../models/protocol/protocol.interface';

export function checkCalibrationFiles(activeProtocol: ProtocolInterface): string | undefined {
  let msg = undefined;
  const missingWavCalListLength = activeProtocol._missingWavCalList!.length;
  const missingCommonWavCalListLength = activeProtocol._missingCommonWavCalList!.length;

  if (areThereMissingCommonOrWavCal(missingWavCalListLength, missingCommonWavCalListLength)) {
    if (areThereMissingCommonAndWavCal(missingWavCalListLength, missingCommonWavCalListLength)) {
      msg =
        'Missing calibration(s) for wav files(s): ' +
        missingWavCalListLength +
        ', and common media wav file(s): ' +
        missingCommonWavCalListLength +
        '.';
    } else if (areThereMissingWavCal(missingWavCalListLength)) {
      msg = 'Missing calibration(s) for wav files(s): ' + missingWavCalListLength + '.';
    } else if (areThereMissingCommonWavCal(missingCommonWavCalListLength)) {
      msg = 'Missing common media wav file(s): ' + missingCommonWavCalListLength + '.';
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

export function checkControllers(activeProtocol: ProtocolInterface): ProtocolErrorInterface[] {
  const errors = [];
  let msg;

  if (activeProtocol._missingControllerList!.length > 0) {
    msg =
      'The protocol contains custom html pages that reference the following undefined controllers: ' +
      activeProtocol._missingControllerList +
      '.  Please make sure each controller is defined properly in the customJs.js file.';
    errors.push({
      type: 'Protocol',
      error: msg,
    });
  }

  return errors;
}

/**
 * Check for unresolved file paths in the provided protocol.
 * @param activeProtocol The protocol to check for unresolved file paths.
 * @returns An array of protocol errors based on unresolved file paths.
 */
export function checkUnresolvedFilePaths(activeProtocol: ProtocolInterface): ProtocolErrorInterface[] {
  const errors = [];
  const unresolvedFilePathLength = activeProtocol._unresolvedFilePathList?.length ?? 0;

  if (unresolvedFilePathLength > 0) {
    const msg = 'Unable to resolve the file path(s) for the following file(s): ' + activeProtocol._unresolvedFilePathList;
    errors.push({
      type: 'Protocol',
      error: msg,
    });
  }

  return errors;
}
