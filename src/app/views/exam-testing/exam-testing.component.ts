import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ResultsInterface } from '../../models/results/results.interface';
import { ResultsModel } from '../../models/results/results.service';
import { ExamService } from '../../controllers/exam.service';
import { PageInterface } from '../../models/page/page.interface';
import { PageModel } from '../../models/page/page.service';

@Component({
  selector: 'exam-testing-view',
  templateUrl: './exam-testing.component.html',
  styleUrl: './exam-testing.component.css'
})
export class ExamTestingComponent {
  results: ResultsInterface;
  page: PageInterface

  constructor(
    public resultsModel: ResultsModel, 
    public translate: TranslateService,
    public examService: ExamService,
    public pageModel: PageModel
  ) { 
    this.results = this.resultsModel.getResults();
    this.page = this.pageModel.getPage();
  }

}
