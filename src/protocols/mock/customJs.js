(function() {
  tabsint.controller("CustomJs1", function($scope) {
    // Notes on custom js:
    // $scope.submit() will make the submit button active, but keep the result.response == undefined
    // $scope.tabResults() will tabulate all the results up to this question, returning the following funtions:
    //    $scope.nResponses =  number responses
    //    $scope.nCorrect =  number of correct answers
    //    $scope.nIncorrect =  number of incorrect answers
    //    $scope.responses[i] = response object at question [i]
    console.log("-- in CustomJs1");

    $scope.test = "customTest";
  });

  tabsint.controller("CustomJs2", function($scope) {
    // Notes on custom js:
    // $scope.submit() will make the submit button active, but keep the result.response == undefined
    // $scope.tabResults() will tabulate all the results up to this question, returning the following funtions:
    //    $scope.nResponses =  number responses
    //    $scope.nCorrect =  number of correct answers
    //    $scope.nIncorrect =  number of incorrect answers
    //    $scope.responses[i] = response object at question [i]

    $scope.test = "customTest";
  });

  tabsint.register("preProcessFunction1", function(page) {
    console.log("-- page: " + JSON.stringify("--Inside preprocessor"));
    var response = page.result.response;
    var newQuestionMainText = "modified text: " + response;
    return { questionMainText: newQuestionMainText };
  });
})();
