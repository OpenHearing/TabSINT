import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ExamResponse } from '../calibration-exam-component/calibration-exam.component';
import { ResultsModel } from '../../../../../models/results/results-model.service';

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
  @Output() entryClicked = new EventEmitter<{ frequency: string; ear: string }>();
  results: CalibrationResults | undefined;

  constructor(private readonly resultsModel: ResultsModel) { }

  ngOnInit(): void {
    const calibrationResult = this.resultsModel.getResults().currentExam.responses
      .filter((response: ExamResponse) => response.responseArea === 'calibrationExam');
    if (calibrationResult.length > 0) {
      this.results = JSON.parse(calibrationResult[calibrationResult.length-1].response) as CalibrationResults;
    }
    calibrationResult.pop();
  }

  getKeys(obj: CalibrationResults): string[] {
    return Object.keys(obj);
  }

  navigateToCalibration(ear: string, frequency: string): void {
    console.log(`Frequency is = ${frequency} and ear is = ${ear}`);
    this.entryClicked.emit({ ear, frequency });
  }

}