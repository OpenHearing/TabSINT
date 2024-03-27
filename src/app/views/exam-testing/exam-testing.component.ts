import { Component, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DomSanitizer } from '@angular/platform-browser';

import { ResultsInterface } from '../../models/results/results.interface';
import { ResultsModel } from '../../models/results/results.service';
import { ExamService } from '../../controllers/exam.service';
import { PageInterface } from '../../models/page/page.interface';
import { PageModel } from '../../models/page/page.service';
import { WINDOW } from '../../utilities/window';

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
    public pageModel: PageModel,
    public sanitizer: DomSanitizer,
    @Inject(WINDOW) private window: Window
  ) { 
    this.results = this.resultsModel.getResults();
    this.page = this.pageModel.getPage();
    (window as any).pageModel = this.pageModel;
  }

  testHTML = this.sanitizer.bypassSecurityTrustHtml(`
    <button id="my-button" (click)=testFunction() >Button 1</button>
    <button (click)=console.log('test'); >Button 2</button>
    <button onclick=console.log('test'); >Button 3</button>
    <button onclick=console.log(window.pageModel); >Button 4</button>
  `);

  ngAfterViewInit() {
    // console.log(document.getElementById('my-button') as HTMLElement);
    if (document.getElementById('my-button') as HTMLElement) {
      (document.getElementById('my-button') as HTMLElement).addEventListener('click', this.testFunction.bind(this));
    }
  }

  testing() {
    console.log(this.pageModel);
    console.log((this.window as any).pageModel);
  }

  testFunction() {
    console.log('this is a test');
    console.log(this.page.questionMainText);
    this.page.questionMainText = 'different question main text';
    console.log(this.page.questionMainText);
  }

}
