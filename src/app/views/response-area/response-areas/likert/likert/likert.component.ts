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

  questions: string[] = [];
  sliderValue: (number | null)[] = [];
  isNotApplicable: boolean[] = [];
  emoticons: string[] = ['😠', '😟', '😐', '🙂', '😃'];
  results: ResultsInterface;

  // Configuration variables
  levels: number = 10;
  position: "above" | "below" = "above";
  labels: string[] = [];
  useEmoticons: boolean = false;
  useSlider: boolean = true;
  naBox: boolean = false;

  private pageSubscription?: Subscription;

  constructor (
    private readonly resultsModel: ResultsModel,
    private readonly pageModel: PageModel
  ) {
    this.results = this.resultsModel.getResults();
  }

  ngOnInit() {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe( (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type == "likertResponseArea") {
        this.initializeResponseArea(updatedPage.responseArea as LikertInterface);
      }
    });
  }

  ngOnDestroy() {
    this.pageSubscription?.unsubscribe();
  }

  onResponseChange(questionIndex: number, levelIndex: number | null): void {
    this.results.currentPage.response[questionIndex] = levelIndex;
    this.responseChange.emit(this.results.currentPage.response); 
  }

  onSliderChange(questionIndex: number, event: Event): void {
    const value = parseFloat((event.target as HTMLInputElement).value);
    this.sliderValue[questionIndex] = value;
    this.onResponseChange(questionIndex, value);
  }

  onNotApplicableChange(questionIndex: number, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    this.isNotApplicable[questionIndex] = isChecked;
    
    if (isChecked) {
      this.sliderValue[questionIndex] = null;
      this.results.currentPage.response[questionIndex] = "NA";
    } else {
      this.results.currentPage.response[questionIndex] = this.sliderValue[questionIndex];
    }

    this.responseChange.emit(this.results.currentPage.response);
  }

  setSliderValue(questionIndex: number, value: number): void {
    this.sliderValue[questionIndex] = value;
    this.onResponseChange(questionIndex, value);
  }
 
  private initializeResponseArea(responseArea: LikertInterface): void {
    this.questions = responseArea.questions ?? [''];
    this.sliderValue = this.questions.map(() => null);
    this.isNotApplicable = this.questions.map(() => false);
    this.levels = responseArea.levels ?? likertSchema.properties.levels.default;
    this.position = responseArea.position ?? likertSchema.properties.position.default;
    this.labels = responseArea.labels ?? [''];
    this.useEmoticons = responseArea.useEmoticons ?? likertSchema.properties.useEmoticons.default;
    this.useSlider = responseArea.useSlider ?? likertSchema.properties.useSlider.default;
    this.naBox = responseArea.naBox ?? likertSchema.properties.naBox.default;
    this.results.currentPage.response = Array.from({ length: this.questions.length }, () => "NA");
  }
 
}
