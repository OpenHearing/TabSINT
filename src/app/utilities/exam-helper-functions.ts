import { JSONSchemaType } from 'ajv';
import { pageSchema } from '../../schema/page.schema';

export function checkIfCanGoBack() {
  // unimplemented
  return true;
}
export function calculateElapsedTime(startTimeString: string) {
  const endTime = new Date();
  const startTime = new Date(JSON.parse('"' + startTimeString + '"'));
  const diffInTime = endTime.getTime() - startTime.getTime();

  const diffInSeconds = Math.floor(diffInTime / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);

  const hours = diffInHours % 24;
  const hoursFormatted = hours < 10 ? '0' + hours : hours;
  const minutes = diffInMinutes % 60;
  const minutesFormatted = minutes < 10 ? '0' + minutes : minutes;
  const seconds = diffInSeconds % 60;
  const secondsFormatted = seconds < 10 ? '0' + seconds : seconds;

  return hoursFormatted + ':' + minutesFormatted + ':' + secondsFormatted;
}

/** Finds the schema branch that describes a response area type.
 * @summary Looks up a response area type in the page schema's responseArea oneOf list
 * @returns the matching branch schema, or undefined when the type is not registered
 */
export function findResponseAreaSchema(responseType: string) {
  return pageSchema.properties.responseArea.oneOf.find((responseAreaType: JSONSchemaType<any>) => {
    return responseAreaType.properties.type.enum.includes(responseType);
  });
}

/** Default for a response area's responseRequired.
 * @summary Reads the schema default, since ajv does not apply defaults inside a oneOf
 * @returns the schema default, or false when the type is not registered
 */
export function getDefaultResponseRequired(responseType: string): boolean {
  const responseAreaSchema = findResponseAreaSchema(responseType);
  // An unregistered type renders nothing; defaulting to true would leave the page permanently
  // unsubmittable, so fall back to false and let the caller report the unknown type.
  return responseAreaSchema?.properties.responseRequired?.default ?? false;
}

/** Default for a response area's enableSkip.
 * @summary Reads the schema default, since ajv does not apply defaults inside a oneOf
 * @returns the schema default, or false when the type is not registered
 */
export function getDefaultEnableSkip(responseType: string): boolean {
  const responseAreaSchema = findResponseAreaSchema(responseType);
  return responseAreaSchema?.properties.enableSkip?.default ?? false;
}

/** Checks for special references
 * @summary Returns true/false depending a id contains a special reference
 */
export function checkForSpecialReference(id: string | undefined) {
  let hasSpecialReference = false;
  if (id?.includes('@')) {
    hasSpecialReference = true;
  }
  return hasSpecialReference;
}

export function handleOutputCalibration(outputChannel: string, outputCalibrationType: string): string {
  let newOutputChannel: string = outputChannel;
  if (outputCalibrationType == 'FPL') {
    newOutputChannel = 'FPL/' + outputChannel;
  } else if (outputCalibrationType == 'SPL') {
    newOutputChannel = outputChannel;
  }
  return newOutputChannel;
}

export function getCurrentDatetime() {
  const now = new Date();
  const ds =
    now.getUTCFullYear() +
    '_' +
    ('0' + (now.getUTCMonth() + 1)).slice(-2) +
    '_' +
    ('0' + now.getUTCDate()).slice(-2) +
    '_' +
    ('0' + now.getUTCHours()).slice(-2) +
    '_' +
    ('0' + now.getUTCMinutes()).slice(-2) +
    '_' +
    ('0' + now.getUTCSeconds()).slice(-2);
  return ds;
}
