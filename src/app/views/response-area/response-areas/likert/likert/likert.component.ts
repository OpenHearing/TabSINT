import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { PageModel } from '../../../../../models/page/page.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { LikertInterface } from './likert.interface';
import { PageInterface } from '../../../../../models/page/page.interface';
import { likertSchema } from '../../../../../../schema/response-areas/likert.schema';

@Component({
  selector: 'likert-view',
  templateUrl: './likert.component.html',
  styleUrl: './likert.component.css'
})
export class LikertComponent implements OnInit, OnDestroy {
  questions: string[] = [''];
  levels: number = 10;
  position: "above" | "below" = "above";
  labels: string[] = [''];
  useEmoticons: boolean = false;
  emoticons: string[] = ['😠', '😟', '😐', '🙂', '😃'];
  @Output() responseChange = new EventEmitter<number>();
  results: ResultsInterface;
  pageSubscription: Subscription | undefined;

  constructor (
    private readonly resultsModel: ResultsModel,
    private readonly pageModel: PageModel
  ) {
    this.results = this.resultsModel.getResults();
  }

  ngOnInit() {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe( (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type == "likertResponseArea") {
        const updatedLikertResponseArea = updatedPage.responseArea as LikertInterface;
        if (updatedLikertResponseArea) {
          this.questions = updatedLikertResponseArea.questions ?? [''];
          this.levels = updatedLikertResponseArea.levels ?? likertSchema.properties.levels.default;
          this.position = updatedLikertResponseArea.position ?? likertSchema.properties.position.default;
          this.labels = updatedLikertResponseArea.labels ?? [''];
          this.useEmoticons = updatedLikertResponseArea.useEmoticons ?? likertSchema.properties.useEmoticons.default;
          this.results.currentPage.response = Array.from({ length: this.questions.length }, () => "NA");
        }
      }
    });
  }

  ngOnDestroy() {
    this.pageSubscription?.unsubscribe();
  }

  onResponseChange(questionIndex: number, levelIndex: number): void {
    this.results.currentPage.response[questionIndex] = levelIndex;
    this.responseChange.emit(this.results.currentPage.response); 
  }
}
