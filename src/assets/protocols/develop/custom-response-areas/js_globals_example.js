const globalKeysCell = document.getElementById("globalKeys");
const sameObjectCell = document.getElementById("sameObject");
const storedResponseCell = document.getElementById("storedResponse");
const recordButton = document.getElementById("recordButton");

globalKeysCell.textContent = Object.keys(globalThis.tabsint).sort().join(", ");
sameObjectCell.textContent = String(window.tabsint === globalThis.tabsint);
storedResponseCell.textContent = "none yet";

// Nothing has been answered yet, so hold the page until the button below is pressed.
globalThis.tabsint.stateModel.updateState({ isSubmittable: false });

function recordResponse() {
  const response = "recorded at " + new Date().toISOString();
  globalThis.tabsint.logger.debug("Globals example recording response: " + response);
  globalThis.tabsint.resultsModel.updateCurrentPage({ response: response });
  storedResponseCell.textContent = response;
  globalThis.tabsint.stateModel.updateState({ isSubmittable: true });
}

recordButton.addEventListener("click", recordResponse);
