/**
 * Generate a standardized filename across results
 * @summary Create filename by concatenating resultFilename (if available in protocol, 
 * otherwise use device UUID), date, and suffix if used.
 * @param  result - result.currentExam object. If no result object provided, then it will use the currentPage datetime
 * @param  suffix - optional suffix to append
 * @return string: filename
 */
export function constructFilename(resultFilename?: string, testDateTime?: string, suffix?: string) {
    var filename, dateTime;

    dateTime = getDateString(testDateTime);

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

/**
 * Convience method to getDateString
 * @summary Return result.currentExam.testDateTime if it exists, otherwise return currentPage date.
 * @param  testDateTime string: currentExam.testDateTime
 * @return dateString
 */
export function getDateString(testDateTime?: string) {
    let dateString = testDateTime ? testDateTime: new Date().toJSON();
    dateString = dateString.replace(":","-").replace(":","-").split(".")[0];
    return dateString;
}
