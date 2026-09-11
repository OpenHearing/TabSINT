function testPreprocess() {
  globalThis.tabsint.logger.debug("Custom preprocess function running");
  globalThis.tabsint.resultsModel.getResults().currentExam.flags["integerFlag"] = 5;
  Object.keys(globalThis.tabsint.resultsModel.getResults().currentExam.flags).forEach(key => {
    const value = globalThis.tabsint.resultsModel.getResults().currentExam.flags[key];
    globalThis.tabsint.logger.debug(`flag variable: ${key} is ${value}`);
  });
}
