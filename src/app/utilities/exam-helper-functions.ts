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
    const hoursFormatted = hours < 10 ? "0" + hours : hours;
    const minutes = diffInMinutes % 60;
    const minutesFormatted = minutes < 10 ? "0" + minutes : minutes;
    const seconds = diffInSeconds % 60;
    const secondsFormatted = seconds < 10 ? "0" + seconds : seconds;
    
    return hoursFormatted + ":" + minutesFormatted + ":" + secondsFormatted;
}