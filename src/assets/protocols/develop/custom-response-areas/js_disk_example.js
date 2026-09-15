const typeTd = document.getElementById("type");
const htmlPathTd = document.getElementById("htmlFilePath");
const jsPathTd = document.getElementById("jsFilePath");
const pinButton = document.getElementById("pinButton");

function handleButtonClick() {
  globalThis.tabsint.logger.debug("Change PIN button pressed");
  globalThis.tabsint.diskModel.updatePreferences({ pin: "7115" });
  globalThis.tabsint.logger.debug("PIN changed to 7115");
}

const page = globalThis.tabsint.pageModel.getPage();
globalThis.tabsint.logger.debug("page: " + JSON.stringify(page));
typeTd.textContent = page?.responseArea?.type;
htmlPathTd.textContent = page?.responseArea?.htmlFilePath;
jsPathTd.textContent = page?.responseArea?.jsFilePath;
pinButton.addEventListener("click", handleButtonClick);
