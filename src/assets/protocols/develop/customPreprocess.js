function testPreprocess() {
  globalThis.tabsint.resultsModel.getResults().currentExam.flags["integerFlag2"] = 5;
  globalThis.tabsint.resultsModel.getResults().currentExam.flags["integerFlag"] += 1;
  globalThis.tabsint.logger.debug("Custom preprocess function running");
  Object.keys(globalThis.tabsint.resultsModel.getResults().currentExam.flags).forEach(key => {
    const value = globalThis.tabsint.resultsModel.getResults().currentExam.flags[key];
    globalThis.tabsint.logger.debug(`flag variable: ${key} is ${value}`);
  });
}
