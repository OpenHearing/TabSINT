import { Component, OnInit } from '@angular/core';
import { PageModel } from '../../../../models/page/page.service';
import { Subscription } from 'rxjs';
import { PageInterface } from '../../../../models/page/page.interface';
import { InputListItem, MultipleInputInterface } from './multiple-input.interface';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { StateModel } from '../../../../models/state/state.service';
import { StateInterface } from '../../../../models/state/state.interface';

@Component({
  selector: 'multiple-input-view',
  templateUrl: './multiple-input.component.html',
  styleUrl: './multiple-input.component.css'
})
export class MultipleInputComponent  implements OnInit {
  pageSubscription: Subscription | undefined;
  results: ResultsInterface;
  state: StateInterface;
  today: string = new Date().toISOString().slice(0, 10);
  reviewDisabled: boolean = false;
  multiDropdownModel: { [key: number]: any[] } = {};
  multiDropdownJson: { [key: number]: any[] } = [];
  verticalSpacing: number = 15;
  textAlign: string = 'center';
  review: boolean = false;
  inputList: InputListItem[] = [{
    text: 'default text'
  }];

  constructor (
    private readonly pageModel: PageModel,
    private readonly resultsModel: ResultsModel,
    private readonly stateModel: StateModel
  ) {
    this.results = this.resultsModel.getResults();
    this.state = this.stateModel.getState();
  }

  ngOnInit() {
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe( (updatedPage: PageInterface) => {
      if (updatedPage?.responseArea?.type == 'multipleInputResponseArea') {
        const updatedMultipleInputResponseArea = updatedPage.responseArea as MultipleInputInterface;
        if (updatedMultipleInputResponseArea) {
          this.verticalSpacing = updatedMultipleInputResponseArea.verticalSpacing ?? 15;
          this.textAlign = updatedMultipleInputResponseArea.textAlign ?? 'center';
          this.inputList = updatedMultipleInputResponseArea.inputList;

          // Initialize multi-dropdown data
          updatedMultipleInputResponseArea.inputList.forEach((item: any, index: number) => {
            if (item.inputType === 'multi-dropdown') {
              this.multiDropdownJson[index] = item.options.map((option: any, i: number) => ({
                id: i,
                label: option,
              }));
              this.multiDropdownModel[index] = [];
            }
          });

          // Initialize responses
         this.results.currentPage.response = updatedMultipleInputResponseArea.inputList.map(
            (item: any) => item.value
          );

          this.updateSubmittableLogic();
        }
      }
    });

  }

  enableReview(status: boolean): void {
    this.reviewDisabled = status;
  }

  selectResponse(i: number, option: any): void {
    this.results.currentPage.response[i] = option;
    this.updateSubmittableLogic();
  }

  selectMultiResponse(i: number): void {
    const multiResp = this.multiDropdownModel[i];
    this.results.currentPage.response[i] = multiResp;
    this.updateSubmittableLogic();
  }

  updateSubmittableLogic(): void {
    const isSubmittable = this.inputList.every(
      (item: any, idx: number) =>
        !item.required || this.isDefined(item, this.results.currentPage.response[idx])
    );
    this.state.isSubmittable = isSubmittable;
  }

  isDefined(item: any, val: any): boolean {
    if (['text', 'number'].includes(item.inputType)) {
      return val !== '' && val !== null && val !== undefined;
    }
    return val !== undefined;
  }
}
