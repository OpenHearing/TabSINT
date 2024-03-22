import { Component } from '@angular/core';
import { ResultsInterface } from '../../models/results/results.interface';
import { ResultsModel } from '../../models/results/results.service';
import { ExamService } from '../../controllers/exam.service';
import { PageInterface } from '../../models/page/page.interface';
import { PageModel } from '../../models/page/page.service';

@Component({
  selector: 'exam-ready-view',
  templateUrl: './exam-ready.component.html',
  styleUrl: './exam-ready.component.css'
})
export class ExamReadyComponent {
  results: ResultsInterface;
  page: PageInterface

  constructor(public resultsModel: ResultsModel, public examService: ExamService, public pageModel: PageModel) { 
    this.results = this.resultsModel.getResults();
    this.page = this.pageModel.getPage();
  }

}
