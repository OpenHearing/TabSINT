import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { PageModel } from '../../../../../models/page/page.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { LikertInterface } from './likert.interface';
import { PageInterface } from '../../../../../models/page/page.interface';
import { likertSchema } from '../../../../../../schema/response-areas/likert.schema';
import { ExamService } from '../../../../../controllers/exam.service';
import { StateModel } from '../../../../../models/state/state.service';
import { StateInterface } from '../../../../../models/state/state.interface';

@Component({
  selector: 'likert-view',
  templateUrl: './likert.component.html',
  styleUrl: './likert.component.css'
})
export class LikertComponent implements OnInit, OnDestroy {
  @Output() responseChange = new EventEmitter<number>();

  // Controller variables
  questions: string[] = [];
  sliderValue: (number | null)[] = [];
  isNotApplicable: boolean[] = [];
  emoticons: string[] = ['😠', '😟', '😐', '🙂', '😃'];

  // Configuration variables
  levels: number = 10;
  position: "above" | "below" = "above";
  labels: string[] = [];
  useEmoticons: boolean = false;
  useSlider: boolean = true;
  naBox: boolean = false;

  results: ResultsInterface;
  state: StateInterface;

  private pageSubscription?: Subscription;

  constructor (
    private readonly examService: ExamService, 
    private readonly resultsModel: ResultsModel,
    private readonly pageModel: PageModel,
    private readonly stateModel: StateModel
  ) {
    this.results = this.resultsModel.getResults();
    this.state = this.stateModel.getState();
  }

  ngOnInit() {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe( (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type == "likertResponseArea") {
        setTimeout(() => {
          this.initializeResponseArea(updatedPage.responseArea as LikertInterface);
        });
      }
    });
  }

  ngOnDestroy() {
    this.pageSubscription?.unsubscribe();
  }

  onResponseChange(questionIndex: number, levelIndex: number | string | null): void {
    this.results.currentPage.response[questionIndex] = levelIndex;
    this.state.doesResponseExist = this.results.currentPage.response !== Array.from({ length: this.questions.length }, () => null);
    this.stateModel.setPageSubmittable();
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
    let res;

    if (isChecked) {
      res = null;
      res = "NA";
    } else {
      res = this.sliderValue[questionIndex];
    }
    this.onResponseChange(questionIndex, res);
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
    this.results.currentPage.response = Array.from({ length: this.questions.length }, () => null);
  }

}
