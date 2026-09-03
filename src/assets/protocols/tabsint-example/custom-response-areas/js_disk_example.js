const typeTd = document.getElementById('type');
const htmlPathTd = document.getElementById('htmlFilePath');
const jsPathTd = document.getElementById('jsFilePath');
const pinButton = document.getElementById('pinButton');

function handleButtonClick() {
    window.tabsint.logger.debug('Change PIN button pressed');
    window.tabsint.diskModel.updateDiskModel('pin', '7115');
    window.tabsint.logger.debug('PIN changed to 7115');
}

const page = window.tabsint.pageModel.getPage();
window.tabsint.logger.debug("page: " + JSON.stringify(page));
typeTd.textContent = page?.responseArea?.type;
htmlPathTd.textContent = page?.responseArea?.htmlFilePath;
jsPathTd.textContent = page?.responseArea?.jsFilePath;
pinButton.addEventListener('click', handleButtonClick);
