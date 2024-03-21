import { Component } from '@angular/core';
import { ResultsInterface } from '../../models/results/results.interface';
import { ResultsModel } from '../../models/results/results.service';
import { ExamService } from '../../controllers/exam.service';

@Component({
  selector: 'exam-ready-view',
  templateUrl: './exam-ready.component.html',
  styleUrl: './exam-ready.component.css'
})
export class ExamReadyComponent {
  results: ResultsInterface;

  constructor(public resultsModel: ResultsModel, public examService: ExamService) { 
    this.results = this.resultsModel.getResults();
  }

}
