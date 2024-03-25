import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { ResultsInterface } from '../../models/results/results.interface';
import { ResultsModel } from '../../models/results/results.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';
import { ExamService } from '../../controllers/exam.service';
import { PageInterface } from '../../models/page/page.interface';
import { PageModel } from '../../models/page/page.service';

@Component({
  selector: 'exam-finalized-view',
  templateUrl: './exam-finalized.component.html',
  styleUrl: './exam-finalized.component.css',
})
export class ExamFinalizedComponent {
  results: ResultsInterface;
  disk: DiskInterface;
  page: PageInterface;

  constructor(
    public resultsModel: ResultsModel, 
    public translate: TranslateService,
    public examService: ExamService,
    public diskModel: DiskModel,
    public pageModel: PageModel
  ) { 
    this.results = this.resultsModel.getResults();
    this.disk = this.diskModel.getDisk();
    this.page = this.pageModel.getPage();
  }

}
