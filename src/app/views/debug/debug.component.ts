import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import _ from 'lodash';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';
import { PageInterface } from '../../models/page/page.interface';
import { PageModel } from '../../models/page/page.service';
import { ResultsModel } from '../../models/results/results-model.service';
import { CurrentResults, ExamResults, ResultsInterface } from '../../models/results/results.interface';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
@Component({
  selector: 'app-debug-view',
  templateUrl: './debug.component.html',
  styleUrl: './debug.component.css',
})
export class DebugComponent implements OnInit, OnDestroy {
  private readonly diskModel = inject(DiskModel);
  private readonly pageModel = inject(PageModel);
  private readonly resultsModel = inject(ResultsModel);
  private readonly stateModel = inject(StateModel);

  disk: DiskInterface;
  currentPage: PageInterface;
  pageResults: CurrentResults;
  examResults: ExamResults;
  state: StateInterface;
  isCollapsed: boolean = true;

  // Section expansion state
  sectionExpanded = {
    page: false,
    pageResults: false,
    examResults: false,
    state: false,
  };

  // Subscriptions
  diskSubscription: Subscription | undefined;
  pageSubscription: Subscription | undefined;
  resultsSubscription: Subscription | undefined;
  stateSubscription: Subscription | undefined;

  constructor() {
    this.disk = this.diskModel.getDisk();
    this.currentPage = this.pageModel.getPage();
    const results = this.resultsModel.getResults();
    this.pageResults = structuredClone(results.currentPage);
    this.examResults = structuredClone(results.currentExam);
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.pageSubscription = this.pageModel.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      // Only replace the reference when the content actually changed - the json-viewer
      // rebuilds its expand state from scratch whenever it's handed a new object reference.
      if (!_.isEqual(this.currentPage, updatedPage)) {
        this.currentPage = updatedPage;
      }
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe((updatedResults: ResultsInterface) => {
      // resultsModel mutates its object in place and re-emits the same top-level reference,
      // so clone the parts we display before comparing - otherwise we'd be comparing the
      // (already-mutated) object against itself and every update would look like a no-op.
      const updatedPageResults = structuredClone(updatedResults.currentPage);
      if (!_.isEqual(this.pageResults, updatedPageResults)) {
        this.pageResults = updatedPageResults;
      }
      const updatedExamResults = structuredClone(updatedResults.currentExam);
      if (!_.isEqual(this.examResults, updatedExamResults)) {
        this.examResults = updatedExamResults;
      }
    });
    this.stateSubscription = this.stateModel.stateSubject.subscribe((updatedState: StateInterface) => {
      if (!_.isEqual(this.state, updatedState)) {
        this.state = updatedState;
      }
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
    this.pageSubscription?.unsubscribe();
    this.resultsSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  /**
   * Toggle the expansion state of a debug section
   * @param section The section key to toggle
   */
  toggleSection(section: keyof typeof this.sectionExpanded): void {
    this.sectionExpanded[section] = !this.sectionExpanded[section];
  }

  formatNumber(i: number) {
    return Math.round(i * 10) / 10;
  }
}
