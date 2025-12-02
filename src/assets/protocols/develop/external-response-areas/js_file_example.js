const readButton = document.getElementById('readButton');
const writeButton = document.getElementById('writeButton');

async function read() {
    try {
        window.tabsint.logger.debug('Read button pressed.');
        const result = await window.tabsint.fileService.launchFileChooser();
        window.tabsint.logger.debug("URI: " + result?.uri);
        const filenameInput = document.getElementById('filename');
        const filename = filenameInput.value;
        window.tabsint.logger.debug('File to read: ' + filename);
        const response = await window.tabsint.fileService.readFile(filename, result?.uri);
        window.tabsint.logger.debug(response?.content);
    }
    catch(error) {
        window.tabsint.logger.error("Failed to read file");
        window.tabsint.logger(error);
    }
}

async function write() {
    try {
        window.tabsint.logger.debug('Write button pressed.');
        window.tabsint.fileService.writeFile('write_test.txt', 'writing to file works!');
    }
    catch(error) {
        window.tabsint.logger.error("Failed to write file");
        window.tabsint.logger(error);
    }
}

readButton.addEventListener('click', read);
writeButton.addEventListener('click', write);
