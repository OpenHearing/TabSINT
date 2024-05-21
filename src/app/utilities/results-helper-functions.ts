import { TestResults } from "../models/results/results.interface";

/**
 * Generate a standardized filename across results
 * @summary Create filename by concatenating resultFilename (if available in protocol, 
 * otherwise use device UUID), date, and suffix if used.
 * @param  result - result.testResults object. If no result object provided, then it will use the current datetime
 * @param  suffix - optional suffix to append
 * @return string: filename
 */
export function constructFilename(resultFilename?: string, testDateTime?: string, suffix?: string) {
    var filename, dateTime;

    dateTime = testDateTime ? testDateTime : new Date().toJSON();

    if (resultFilename) {
        filename = resultFilename + "." + dateTime;
    } else {
        filename = "devices.shortUUID" + "." + dateTime;
    }

    if (suffix) {
        filename = filename + suffix;
    }

    return filename;
};

// /**
//  * Convience method to getDateString
//  * @summary Return result.testResults.testDateTime if it exists, otherwise return current date.
//  * @param  testDateTime string: testResults.testDateTime
//  * @return dateString
//  */
// export function getDateString(testDateTime?: string) {
//     var dateString;
//     if (testDateTime) {
//         dateString = testDateTime;
//     } else {
//         dateString = new Date().toJSON();
//     }
//     return dateString;
// }
