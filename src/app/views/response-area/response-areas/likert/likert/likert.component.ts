import { Component, EventEmitter, inject, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { ResultsModel } from '../../../../../models/results/results-model.service';
import { PageModel } from '../../../../../models/page/page.service';
import { ResultsInterface } from '../../../../../models/results/results.interface';
import { LikertInterface, LikertQuestion, LikertSpecifier } from './likert.interface';
import { PageInterface } from '../../../../../models/page/page.interface';
import { likertSchema } from '../../../../../../schema/response-areas/likert.schema';
import { StateModel } from '../../../../../models/state/state.service';
import { StateInterface } from '../../../../../models/state/state.interface';
import { ExamService } from '../../../../../controllers/exam.service';

/** One question expanded into everything the template needs to render it. */
interface NormalizedQuestion {
  text: string;
  levels: number;
  topLabels: string[];
  bottomLabels: string[];
  topLabelSlots: LabelSlot[];
  bottomLabelSlots: LabelSlot[];
  centerLabelAbove: string | null;
  centerLabelBelow: string | null;
  labelFontSize: string | null;
  questionFontSize: string | null;
  useEmoticons: boolean;
}

/**
 * A rendered label sized and aligned to its own share of the scale: `flexGrow` is how many
 * "level-widths" wide its box should be, so it lines up with its own level's button.
 */
interface LabelSlot {
  label: string;
  flexGrow: number;
  align: 'left' | 'center' | 'right';
}

@Component({
  selector: 'app-likert-view',
  templateUrl: './likert.component.html',
  styleUrl: './likert.component.css',
})
export class LikertComponent implements OnInit, OnDestroy {
  private readonly resultsModel = inject(ResultsModel);
  private readonly pageModel = inject(PageModel);
  private readonly stateModel = inject(StateModel);
  private readonly examService = inject(ExamService);
  @Output() responseChange = new EventEmitter<number>();

  likertExamProperties: LikertInterface = {
    type: likertSchema.properties.type.default,
    autoSubmit: likertSchema.properties.autoSubmit.default,
  };

  // Controller variables
  questions: NormalizedQuestion[] = [];
  sliderValue: (number | null)[] = [];
  isNotApplicable: boolean[] = [];
  emoticons: string[] = ['😠', '😟', '😐', '🙂', '😃'];

  // Configuration variables (shared across all questions)
  useRadioButtons: boolean = false;
  useSlider: boolean = false;
  naBox: boolean = false;
  verticalSpacing: number = likertSchema.properties.verticalSpacing.default;

  results: ResultsInterface;
  state: StateInterface;

  private pageSubscription?: Subscription;
  stateSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;

  constructor() {
    this.results = this.resultsModel.getResults();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.stateSubscription = this.stateModel.stateSubject.subscribe(updatedState => {
      this.state = updatedState;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe(updatedResults => {
      this.results = updatedResults;
    });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type == 'likertResponseArea') {
        this.likertExamProperties.autoSubmit = (updatedPage.responseArea as LikertInterface)?.autoSubmit;
        setTimeout(() => {
          this.initializeResponseArea(updatedPage.responseArea as LikertInterface);
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.pageSubscription?.unsubscribe();
    this.resultsSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  onResponseChange(questionIndex: number, levelIndex: number | string | null): void {
    this.resultsModel.updateCurrentPageResponseElement(questionIndex, levelIndex);
    this.stateModel.updateState({
      doesResponseExist: this.results.currentPage.response !== Array.from({ length: this.questions.length }, () => null),
    });
    this.stateModel.setPageSubmittable();
    this.responseChange.emit(this.results.currentPage.response);
    if (this.likertExamProperties.autoSubmit && this.allQuestionsAnswered()) {
      this.examService.submit();
    }
  }

  /** Whether every question on the page has a non-null response, required before autoSubmit fires. */
  private allQuestionsAnswered(): boolean {
    const response = this.results.currentPage.response;
    return Array.isArray(response) && response.every(value => value !== null);
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
      res = 'NA';
    } else {
      res = this.sliderValue[questionIndex];
    }
    this.onResponseChange(questionIndex, res);
  }

  setSliderValue(questionIndex: number, value: number): void {
    this.sliderValue[questionIndex] = value;
    this.onResponseChange(questionIndex, value);
  }

  /** Whether a label row has any non-empty entries worth rendering. */
  hasLabels(labels: string[]): boolean {
    return labels.some(label => label !== '');
  }

  private initializeResponseArea(responseArea: LikertInterface): void {
    const rawQuestions: (string | LikertQuestion)[] = responseArea.questions?.length ? responseArea.questions : [''];
    this.useRadioButtons = responseArea.useRadioButtons ?? likertSchema.properties.useRadioButtons.default;
    this.useSlider = responseArea.useSlider ?? likertSchema.properties.useSlider.default;
    this.naBox = responseArea.naBox ?? likertSchema.properties.naBox.default;
    this.verticalSpacing = responseArea.verticalSpacing ?? likertSchema.properties.verticalSpacing.default;
    this.questions = rawQuestions.map(question => this.normalizeQuestion(question, responseArea));
    this.sliderValue = this.questions.map(() => null);
    this.isNotApplicable = this.questions.map(() => false);
    this.resultsModel.updateCurrentPage({ response: Array.from({ length: this.questions.length }, () => null) });
  }

  /** Expand a question (string or object) plus the response-area defaults into a NormalizedQuestion. */
  private normalizeQuestion(question: string | LikertQuestion, responseArea: LikertInterface): NormalizedQuestion {
    const q: LikertQuestion = typeof question === 'string' ? { text: question } : question;
    const levels = q.levels ?? responseArea.levels ?? likertSchema.properties.levels.default;
    const topLabels: string[] = Array.from({ length: levels }, () => '');
    const bottomLabels: string[] = Array.from({ length: levels }, () => '');

    for (const specifier of this.resolveSpecifiers(q, responseArea, levels)) {
      if (specifier.level < 0 || specifier.level >= levels) continue;
      if (specifier.position === 'below') {
        bottomLabels[specifier.level] = specifier.label;
      } else {
        topLabels[specifier.level] = specifier.label;
      }
    }

    return {
      text: q.text ?? '',
      levels,
      topLabels,
      bottomLabels,
      topLabelSlots: this.computeLabelSlots(topLabels),
      bottomLabelSlots: this.computeLabelSlots(bottomLabels),
      centerLabelAbove: q.centerLabelAbove ?? responseArea.centerLabelAbove ?? null,
      centerLabelBelow: q.centerLabelBelow ?? responseArea.centerLabelBelow ?? null,
      labelFontSize: this.toPx(q.labelFontSize ?? responseArea.labelFontSize),
      questionFontSize: this.toPx(q.questionFontSize ?? responseArea.questionFontSize),
      useEmoticons: q.useEmoticons ?? responseArea.useEmoticons ?? likertSchema.properties.useEmoticons.default,
    };
  }

  /**
   * Size and align each non-empty label to the region halfway to its nearest labeled neighbor
   * (or the row edge, if it has no neighbor on that side) — a 1-D Voronoi partition. Levels with
   * no label at all consume no space. When every level is labeled, every share degenerates to `1`
   * (equal columns, matching `.likert-option`'s equal-width layout).
   *
   * Alignment is based on whether the box actually extends past the label's own natural column
   * [index, index+1) on a given side, not merely on whether a neighbor exists: a label with no
   * genuine extra room on either side (e.g. every edge label in a fully-labeled row) is centered
   * over its own button exactly like an interior label; only a label that actually grew into free
   * neighboring space is anchored toward its own button and left to grow the other way.
   */
  private computeLabelSlots(labels: string[]): LabelSlot[] {
    const populatedIndices = labels.reduce<number[]>((acc, label, index) => {
      if (label !== '') acc.push(index);
      return acc;
    }, []);

    return populatedIndices.map((index, rank) => {
      const prevIndex = rank > 0 ? populatedIndices[rank - 1] : null;
      const nextIndex = rank < populatedIndices.length - 1 ? populatedIndices[rank + 1] : null;
      // Column `index` naturally spans [index, index+1). Split the gap of empty columns to a
      // neighbor between that neighbor's own column and this one, so two adjacent (dense) labels
      // meet exactly at their shared column edge, degenerating to flexGrow 1 each.
      const left = prevIndex === null ? 0 : (prevIndex + 1 + index) / 2;
      const right = nextIndex === null ? labels.length : (index + 1 + nextIndex) / 2;
      const extendsLeft = left < index;
      const extendsRight = right > index + 1;
      const align: LabelSlot['align'] = extendsLeft && extendsRight ? 'center' : extendsLeft ? 'right' : extendsRight ? 'left' : 'center';

      return { label: labels[index], flexGrow: right - left, align };
    });
  }

  /**
   * Collect the labels for a question by combining both sources so they can be shown at the
   * same time (e.g. descriptive labels on one side, numbers on the other). Per-question values
   * override the response-area values. `labels` are placed via `position`; `specifiers` carry
   * their own per-item `position`. When both target the same level+side, the specifier wins.
   */
  private resolveSpecifiers(q: LikertQuestion, responseArea: LikertInterface, levels: number): LikertSpecifier[] {
    const defaultPosition = likertSchema.properties.position.default;
    const result: LikertSpecifier[] = [];

    const labels = q.labels ?? responseArea.labels;
    if (labels) {
      const labelPosition = q.position ?? responseArea.position ?? defaultPosition;
      result.push(...this.labelsToSpecifiers(labels, labelPosition, levels));
    }

    const specifiers = q.specifiers ?? responseArea.specifiers;
    if (specifiers) {
      result.push(...specifiers);
    }

    return result;
  }

  /**
   * Convert a plain labels array into specifiers. A labels array the same length as the scale
   * places one label per level; a length-2 array places labels at the two ends.
   */
  private labelsToSpecifiers(labels: string[], position: 'above' | 'below', levels: number): LikertSpecifier[] {
    if (labels.length === 2 && levels > 2) {
      return [
        { level: 0, label: labels[0], position },
        { level: levels - 1, label: labels[1], position },
      ];
    }
    return labels.map((label, level) => ({ level, label, position }));
  }

  private toPx(size: number | undefined): string | null {
    return size === undefined ? null : `${size}px`;
  }
}
