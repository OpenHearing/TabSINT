function overridePreprocessExample() {
    // Placeholder for real conditional logic (e.g. inspecting prior results/flags via
    // window.tabsint.resultsModel.getResults()). Hardcoded to true for now to demonstrate
    // that a preprocess function can override this page's protocol variables.
    const trivialConditional = true;

    if (trivialConditional) {
        window.tabsint.page.instructionText = 'This instruction text was overridden by a preprocess function.';

        if (window.tabsint.page.responseArea && window.tabsint.page.responseArea.type === 'textboxResponseArea') {
            window.tabsint.page.responseArea.rows = 8;
        }
    }
}
