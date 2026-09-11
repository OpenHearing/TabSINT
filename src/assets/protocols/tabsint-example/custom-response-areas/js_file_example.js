const readButton = document.getElementById("readButton");
const writeButton = document.getElementById("writeButton");

async function read() {
  try {
    globalThis.tabsint.logger.debug("Read button pressed.");
    const result = await globalThis.tabsint.fileService.launchFileChooser();
    globalThis.tabsint.logger.debug("URI: " + result?.uri);
    const filenameInput = document.getElementById("filename");
    const filename = filenameInput.value;
    globalThis.tabsint.logger.debug("File to read: " + filename);
    const response = await globalThis.tabsint.fileService.readFile(filename, result?.uri);
    globalThis.tabsint.logger.debug(response?.content);
  } catch (error) {
    globalThis.tabsint.logger.error("Failed to read file");
    globalThis.tabsint.logger(error);
  }
}

async function write() {
  try {
    globalThis.tabsint.logger.debug("Write button pressed.");
    globalThis.tabsint.fileService.writeFile("write_test.txt", "writing to file works!");
  } catch (error) {
    globalThis.tabsint.logger.error("Failed to write file");
    globalThis.tabsint.logger(error);
  }
}

readButton.addEventListener("click", read);
writeButton.addEventListener("click", write);
