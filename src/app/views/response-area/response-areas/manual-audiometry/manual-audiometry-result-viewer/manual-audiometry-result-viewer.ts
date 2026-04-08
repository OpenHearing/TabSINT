import { Component, Input, inject } from '@angular/core';

import { AudiometryResultsInterface } from '../../../../../interfaces/audiometry-results.interface';
import { ExamService } from '../../../../../controllers/exam.service';
import { ResultType } from '../../../../../utilities/constants';

@Component({
  selector: 'app-manual-audiometry-result-viewer',
  templateUrl: './manual-audiometry-result-viewer.html',
  styleUrl: './manual-audiometry-result-viewer.css',
})
export class ManualAudiometryResultViewerComponent {
  private readonly examService = inject(ExamService);

  @Input() audiogramData!: AudiometryResultsInterface;

  submitResults() {
    this.examService.submitDefault();
  }

  get ResultType() {
    return ResultType;
  }
}
