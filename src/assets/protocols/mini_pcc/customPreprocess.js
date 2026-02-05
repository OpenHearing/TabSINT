function testPreprocess() {
    window.tabsint.logger.debug("Custom preprocess function running");
    Object.keys(window.tabsint.resultsModel.getResults().currentExam.flags).forEach(key => {
        const value = window.tabsint.resultsModel.getResults().currentExam.flags[key];
        window.tabsint.logger.debug(`flag variable: ${key} is ${value}`);
    });
}