import { Component, inject, Inject, OnDestroy, OnInit } from '@angular/core';
import { ExamService } from '../../controllers/exam.service';
import { WINDOW } from '../../utilities/window';
import { Subscription } from 'rxjs';
import { PageInterface } from '../../models/page/page.interface';
import { PageModel } from '../../models/page/page.service';

@Component({
  selector: 'app-exam-testing-view',
  templateUrl: './exam-testing.component.html',
  styleUrl: './exam-testing.component.css',
})
export class ExamTestingComponent implements OnInit, OnDestroy {
  private readonly examService = inject(ExamService);
  private readonly pageModel = inject(PageModel);

  pageSubscription: Subscription | undefined;
  questionPreMainTextClass?: object;
  questionMainTextClass?: object;
  title?: string;
  questionPreMainText?: string;
  questionMainText?: string;
  questionSubText?: string;
  instructionText?: string;
  examType?: string;
  imageBytes: string = '';
  imageWidth: string = '100%';

  constructor(@Inject(WINDOW) private readonly window: Window) {} // eslint-disable-line

  ngOnInit(): void {
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      this.title = updatedPage?.title;
      this.questionPreMainTextClass = this.shrinkTitleIfTooLong(updatedPage?.questionPreMainText);
      this.questionMainTextClass = this.shrinkTitleIfTooLong(updatedPage?.questionMainText);
      this.questionPreMainText = updatedPage?.questionPreMainText;
      this.questionMainText = updatedPage?.questionMainText;
      this.questionSubText = updatedPage?.questionSubText;
      this.instructionText = updatedPage?.instructionText;
      this.examType = updatedPage?.responseArea?.type;
      if (updatedPage?.image) {
        this.imageBytes = updatedPage.image.b64!;
        this.imageWidth = updatedPage.image?.width ?? this.imageWidth;
      } else {
        this.imageBytes = '';
        this.imageWidth = '100%';
      }
    });
  }

  ngOnDestroy(): void {
    this.pageSubscription?.unsubscribe();
  }

  shrinkTitleIfTooLong(text: string | undefined) {
    const styleObject = { medium: false, long: false };
    if (!text) {
      // will use default styling, no additions necessary
    } else if (text.length >= 38 && text.length < 48) {
      styleObject.medium = true;
    } else if (text.length > 42) {
      styleObject['long'] = true;
    }
    return styleObject;
  }
}
