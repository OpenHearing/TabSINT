import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ExamService } from '../../controllers/exam.service';
import { WINDOW } from '../../utilities/window';
import { Subscription } from 'rxjs';
import { PageInterface } from '../../models/page/page.interface';
import { PageModel } from '../../models/page/page.service';

@Component({
  selector: 'exam-testing-view',
  templateUrl: './exam-testing.component.html',
  styleUrl: './exam-testing.component.css'
})
export class ExamTestingComponent implements OnInit, OnDestroy {
  pageSubscription: Subscription | undefined;
  examTestingTitleClass?: object;
  title?: string;
  questionMainText?: string;
  questionSubText?: string;
  instructionText?: string;
  examType?: string;

  constructor(
    private readonly examService: ExamService,
    private readonly pageModel: PageModel,
    @Inject(WINDOW) private readonly window: Window
  ) {  }

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe( (updatedPage: PageInterface) => {
      this.title = updatedPage?.title;
      this.examTestingTitleClass = this.shrinkTitleIfTooLong(updatedPage?.questionMainText);
      this.questionMainText = updatedPage?.questionMainText;
      this.questionSubText = updatedPage?.questionSubText;
      this.instructionText = updatedPage?.instructionText;
      this.examType = updatedPage?.responseArea?.type;
    });
  }

  ngOnDestroy(): void {
    this.pageSubscription?.unsubscribe();
  }

  shrinkTitleIfTooLong(questionMainText: string | undefined) {
    let styleObject = {"medium":false,"long":false};
    if (!questionMainText) {
      // will use default styling, no additions necessary
    } 
    else if ( ((questionMainText.length >= 38) && (questionMainText.length < 48)) ) {
      styleObject.medium = true;
    } else if (questionMainText.length > 42) {
      styleObject["long"] = true;
    }
    return styleObject
  }

  startExam() {
    this.examService.finishActivateMedia();
  }

}
