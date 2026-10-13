function overridePreprocessExample() {
  // Placeholder for real conditional logic (e.g. inspecting prior results/flags via
  // globalThis.tabsint.resultsModel.getResults()). Hardcoded to true for now to demonstrate
  // that a preprocess function can override this page's protocol variables.
  const trivialConditional = true;

  if (trivialConditional) {
    globalThis.tabsint.page.instructionText = "This instruction text was overridden by a preprocess function.";

    if (globalThis.tabsint.page.responseArea && globalThis.tabsint.page.responseArea.type === "textboxResponseArea") {
      globalThis.tabsint.page.responseArea.rows = 8;
    }
  }
}
