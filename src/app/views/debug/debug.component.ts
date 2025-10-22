import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';

import { DiskInterface } from '../../models/disk/disk.interface';
import { DiskModel } from '../../models/disk/disk.service';
import { PageInterface } from '../../models/page/page.interface';
import { PageModel } from '../../models/page/page.service';
import { ResultsModel } from '../../models/results/results-model.service';
import { ResultsInterface } from '../../models/results/results.interface';
import { StateModel } from '../../models/state/state.service';
import { StateInterface } from '../../models/state/state.interface';
@Component({
  selector: 'debug-view',
  templateUrl: './debug.component.html',
  styleUrl: './debug.component.css',
})
export class DebugComponent implements OnInit, OnDestroy {
  disk: DiskInterface;
  currentPage: PageInterface;
  results: ResultsInterface;
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

  constructor(
    private readonly diskModel: DiskModel,
    private readonly pageModel: PageModel,
    private readonly resultsModel: ResultsModel,
    private readonly stateModel: StateModel
  ) {
    this.disk = this.diskModel.getDisk();
    this.currentPage = this.pageModel.getPage();
    this.results = this.resultsModel.getResults();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe((updatedPage: PageInterface) => {
      this.currentPage = updatedPage;
    });
    this.resultsSubscription = this.resultsModel.resultsSubject.subscribe((updatedResults: ResultsInterface) => {
      this.results = updatedResults;
    });
    this.stateSubscription = this.stateModel.stateSubject.subscribe((updatedState: StateInterface) => {
      this.state = updatedState;
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
