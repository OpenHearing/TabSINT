import { Component, OnInit } from '@angular/core';
import { ExamResponse } from '../calibration-exam-component/calibration-exam.component';
import { ResultsModel } from '../../../../models/results/results-model.service';

interface CalibrationResults {
  leftEar: any;
  rightEar: any;
}

@Component({
  selector: 'app-calibration-results-viewer',
  templateUrl: './calibration-results-viewer.component.html',
  styleUrls: ['./calibration-results-viewer.component.css']
})
export class CalibrationResultsViewerComponent implements OnInit {
  results: CalibrationResults | undefined;

  constructor(private readonly resultsModel: ResultsModel) { }

  ngOnInit(): void {
    console.log(this.resultsModel.getResults().currentExam.responses)
    const calibrationResult = this.resultsModel.getResults().currentExam.responses
      .filter((response: ExamResponse) => response.responseArea === 'calibrationExam');
    if (calibrationResult.length > 0) {
      this.results = JSON.parse(calibrationResult[0].response) as CalibrationResults;
    }
    console.log(this.results)
  }

  getKeys(obj: CalibrationResults): string[] {
    return Object.keys(obj);
  }
}