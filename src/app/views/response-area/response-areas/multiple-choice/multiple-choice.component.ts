import { Component } from '@angular/core';
import * as _ from 'lodash';

import { ExamService } from '../../../../controllers/exam.service';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { ResultsModel } from '../../../../models/results/results.service';
import { ProtocolModelInterface } from '../../../../models/protocol/protocol-model.interface';
import { StateInterface } from '../../../../models/state/state.interface';
import { StateModel } from '../../../../models/state/state.service';
import { ProtocolModel } from '../../../../models/protocol/protocol.service';

@Component({
  selector: 'multiple-choice-view',
  templateUrl: './multiple-choice.component.html',
  styleUrl: './multiple-choice.component.css'
})
export class MultipleChoiceComponent {
  results: ResultsInterface;
  state: StateInterface;
  protocol: ProtocolModelInterface;

  constructor (
    public resultsModel: ResultsModel, 
    public examService: ExamService,
    public stateModel: StateModel,
    public protocolModel: ProtocolModel
  ) {
    this.results = this.resultsModel.getResults();
    this.protocol = this.protocolModel.getProtocolModel();
    this.state = this.stateModel.getState();

    this.update();
  }

  choices:any = {};
  choice:any = {};
  enableOther = false;
  buttonDisabled = true;
  gradeResponse = false;
  showCorrect = true;
  yesNo = [
    {
      id: "yes",
      text: "Yes"
    },
    {
      id: "no",
      text: "No"
    }
  ];

    // to add feedback to the multichoice respAreas, HG 12/7/15
    // if (_.isUndefined(testVar?.responseArea?.feedback)) {
    //   this.examService.testVar?.dm.showFeedback = function() {
    //     if (testVar?.dm.responseArea.feedback === "gradeResponse") {
    //       $scope.gradeResponse = true;
    //     } else if (this.examService.testVar?.responseArea.feedback === "showCorrect") {
    //       $scope.showCorrect = true;
    //     }
    //   };
    // }
    // to add feedback to the multichoice respAreas, HG 12/7/15

    update() {
      this.choices = _.cloneDeep(this.examService.testVar?.responseArea.choices || this.yesNo);
      if (this.examService.testVar?.responseArea.other) {
        this.enableOther = true;
        this.choices.push({
          id: "Other",
          text: this.examService.testVar?.responseArea.other
        });
      }
      console.log("choices",this.choices);
    }

    

    // $scope.$watch("result.response", function() {
    //   if (testVar?.dm.responseArea.other && testVar?.result.response === "Other") {
    //     $scope.enableOtherText = true;
    //     $location.hash("otherInput");
    //     $anchorScroll();
    //   } else {
    //     $scope.enableOtherText = false;
    //     testVar?.result.otherResponse = undefined;
    //   }
    // });

    // function to identify the location of the response word on the responseArea, HG 12/7/15
    multichosen(word:any) {
      return this.examService.testVar?.result.response === word.id;
    };






  // Logic from basicResponseAreas.js

  spacing = {};

    // if (this.examService.testVar?.responseArea.verticalSpacing) {
    //   _.extend($scope.spacing, {
    //     "padding-bottom": testVar?.dm.responseArea.verticalSpacing + "px"
    //   });
    // }

    // if (this.examService.testVar?.responseArea.horizontalSpacing) {
    //   _.extend($scope.spacing, {
    //     "padding-right": testVar?.dm.responseArea.horizontalSpacing / 2 + "px",
    //     "padding-left": testVar?.dm.responseArea.horizontalSpacing / 2 + "px"
    //   });
    // }

    // chosen() {
    //   return $scope.choice.id === testVar?.result.response;
    // };
    isCorrect(val:any) {
      return this.choice.correct === true;
    };
    // $scope.btnClass = function() {
    //   var btnClass = "btn btn-block ";
    //   if ($scope.chosen()) {
    //     btnClass += "btn-default active ";
    //   } else {
    //     btnClass += "btn-default ";
    //   }
    //   return btnClass;
    // };

    choose(id:any) {
      // AUTO-SUBMIT:
      this.results.current.response = id;
      this.state.isSubmittable = this.examService.getSubmittableLogic(this.examService.testVar?.responseArea);
      console.log("this.state.isSubmittable",this.state.isSubmittable);
      if (this.state.isSubmittable && this.results.current.response !== "Other") {
        this.examService.submit = this.examService.submitDefault;
        this.examService.submit();
      }
    };
}
