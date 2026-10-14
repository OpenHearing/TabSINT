import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { EarData, ExamResponse } from '../calibration-exam-component/calibration-exam.interface';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { IDevice } from '../../../../../interfaces/devices/device.interface';
import { DeviceStatus } from '../../../../../utilities/constants';

interface CalibrationResults {
  leftEar: Record<string, EarData>;
  rightEar: Record<string, EarData>;
}

@Component({
  selector: 'app-calibration-results-viewer',
  templateUrl: './calibration-results-viewer.component.html',
  styleUrls: ['./calibration-results-viewer.component.css'],
})
export class CalibrationResultsViewerComponent implements OnInit {
  private readonly resultsModel = inject(ResultsModel);

  @Input() device: IDevice | undefined;
  @Output() entryClicked = new EventEmitter<{ frequency: string; ear: string; step: string }>();
  DeviceStatus = DeviceStatus;
  results: CalibrationResults | undefined;

  ngOnInit(): void {
    const calibrationResult = this.resultsModel
      .getResults()
      .currentExam.responses.filter((response: ExamResponse) => response.responseArea === 'calibrationExam');
    if (calibrationResult.length > 0) {
      this.results = JSON.parse(calibrationResult[calibrationResult.length - 1].response) as CalibrationResults;
    }
    calibrationResult.pop();
  }

  getKeys(obj: Record<string, EarData>): string[] {
    return Object.keys(obj);
  }

  navigateToStep(ear: string, frequency: string, step: string): void {
    this.entryClicked.emit({ ear, frequency, step });
  }
}
