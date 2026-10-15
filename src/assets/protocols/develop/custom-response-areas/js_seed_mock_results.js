(function () {
  var responses = globalThis.tabsint.resultsModel.getResults().currentExam.responses;

  function seed(pageId, responseArea, examProperties, response) {
    var existing = responses.findIndex(function (r) {
      return r.pageId === pageId;
    });
    if (existing !== -1) {
      responses.splice(existing, 1);
    }
    responses.push({
      pageId: pageId,
      responseArea: responseArea,
      response: response,
      page: { id: pageId, questionMainText: pageId + " (mock)", responseArea: { type: responseArea, examProperties: examProperties } },
    });
  }

  seed(
    "Hughson-Westlake-Screener",
    "hughsonWestlakeResponseArea",
    { Screener: true, Lstart: 25, F: 1000, LevelUnits: "dB HL", OutputChannel: "HPL0" },
    { ResultType: "Pass", NumCorrectResp: 3 }
  );
  seed(
    "Hughson-Westlake-Threshold",
    "hughsonWestlakeResponseArea",
    { F: 1000, LevelUnits: "dB HL", OutputChannel: "HPR0" },
    { RetSPL: 0, L: [40, 30, 20], FalsePositive: [], ResponseTime: [1, 1, 1], NumCorrectResp: 2, Threshold: 20, Units: 0, ResultType: "Threshold" }
  );
  seed(
    "BHAFT",
    "bhaftResponseArea",
    { Fstart: 8000, Level: 80, OutputChannel: "HPL0" },
    { ThresholdFrequency: 12000, ThresholdLevel: 80, F: [8000, 10000, 12000], L: [80, 80, 80], ResultType: "Threshold" }
  );
  seed(
    "BekesyLike",
    "bekesyLikeResponseArea",
    { F: 1000, Lstart: 40, LevelUnits: "dB HL", OutputChannel: "HPL0" },
    { RetSPL: 0, L: [40, 35, 30], MaximumExcursion: 5, Slope: 0, Threshold: 30, Units: 0, ResultType: "Threshold" }
  );
  seed(
    "gapResponseArea",
    "gapResponseArea",
    {},
    {
      GapThreshold: 5.5,
      GapLengthArray: [20, 16, 13, 13, 10, 7],
      HitOrMissArray: [true, true, false, true, true, true],
      ReversalUsedForThresholdArray: [false, false, true, false, false, true],
    }
  );
  seed(
    "MRT",
    "mrtResponseArea",
    {},
    [
      { SNR: 6, isCorrect: true },
      { SNR: 6, isCorrect: false },
      { SNR: 0, isCorrect: true },
    ]
  );

  document.getElementById("seedStatus").textContent = "Seeded " + responses.length + " responses. Press submit to view them.";
  globalThis.tabsint.stateModel.updateState({ isSubmittable: true });
})();
