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
  @Output() responseChange = new EventEmitter<number>();

  questions: string[] = [''];
  levels: number = 10;
  position: "above" | "below" = "above";
  labels: string[] = [''];
  useEmoticons: boolean = false;
  emoticons: string[] = ['😠', '😟', '😐', '🙂', '😃'];
  useSlider: boolean = true;
  naBox: boolean = false;
  sliderValue: number[] = [];
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
          this.useSlider = updatedLikertResponseArea.useSlider ?? likertSchema.properties.useSlider.default;
          this.naBox = updatedLikertResponseArea.naBox ?? likertSchema.properties.naBox.default;
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

  onSliderChange(questionIndex: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    this.sliderValue[questionIndex] = parseFloat(target.value);
    this.onResponseChange(questionIndex, this.sliderValue[questionIndex]);
  }

  onNotApplicableChange(questionIndex: number, event: Event): void {
    const target = event.target as HTMLInputElement;
    const isChecked = target.checked;
    this.results.currentPage.response[questionIndex] = isChecked ? "NA" : this.sliderValue[questionIndex];
    this.responseChange.emit(this.results.currentPage.response);
  }
  setSliderValue(questionIndex: number, value: number): void {
    this.sliderValue[questionIndex] = value;
    this.onResponseChange(questionIndex, value);
  }
  
}
