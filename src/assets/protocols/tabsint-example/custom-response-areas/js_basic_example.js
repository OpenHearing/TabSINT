const myButton = document.getElementById("testButton");

function handleButtonClick() {
  globalThis.tabsint.logger.debug("Button clicked!");
  globalThis.tabsint.resultsModel.updateCurrentPage({ response: "Button clicked!" });
}

myButton.addEventListener("click", handleButtonClick);
