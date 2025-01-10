import { Component, OnInit } from '@angular/core';
import { PageModel } from '../../../../models/page/page.service';
import { Subscription } from 'rxjs';
import { PageInterface } from '../../../../models/page/page.interface';
import { InputListItem, MultipleInputInterface } from './multiple-input.interface';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { ResultsInterface } from '../../../../models/results/results.interface';
import { StateModel } from '../../../../models/state/state.service';
import { StateInterface } from '../../../../models/state/state.interface';
import { multipleInputSchema } from '../../../../../schema/response-areas/multiple-input.schema';

@Component({
  selector: 'multiple-input-view',
  templateUrl: './multiple-input.component.html',
  styleUrl: './multiple-input.component.css'
})
export class MultipleInputComponent  implements OnInit {
  results: ResultsInterface;
  state: StateInterface;

  // Configuration variables
  today: string = new Date().toISOString().slice(0, 10);
  reviewDisabled: boolean = false;
  multiDropdownModel: { [key: number]: any[] } = {};
  multiDropdownJson: { [key: number]: any[] } = [];
  verticalSpacing: number = multipleInputSchema.properties.verticalSpacing.default;
  textAlign: string = multipleInputSchema.properties.textAlign.default;
  review: boolean = multipleInputSchema.properties.review.default;
  inputList: InputListItem[] = [{
    text: 'default text'
  }];

  pageSubscription: Subscription | undefined;

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
          this.initializeConfigurationVariables(updatedMultipleInputResponseArea);
          this.initializeReponses(updatedMultipleInputResponseArea);
          this.updateSubmittableLogic();
        }
      }
    });
  }

  ngOnDestroy() {
    this.pageSubscription?.unsubscribe();
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

  private initializeConfigurationVariables(updatedMultipleInputResponseArea: MultipleInputInterface) {    
    this.verticalSpacing = updatedMultipleInputResponseArea.verticalSpacing ?? multipleInputSchema.properties.verticalSpacing.default;
    this.textAlign = updatedMultipleInputResponseArea.textAlign ?? multipleInputSchema.properties.textAlign.default;
    this.review = updatedMultipleInputResponseArea.review ?? multipleInputSchema.properties.review.default;
    this.inputList = updatedMultipleInputResponseArea.inputList.map((item: any) => {
      return {
        ...item, 
        required: item.required ?? multipleInputSchema.properties.inputList.items.properties.required.default
      };
    });
    
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
  }

  private initializeReponses(updatedMultipleInputResponseArea: MultipleInputInterface) {
    this.results.currentPage.response = updatedMultipleInputResponseArea.inputList.map(
      (item: any) => {
        if (item.inputType === 'date' && item.dateProperties.default === 'today') {
          return this.today;
        } else {
          return item.value;
        }
      }
    );
  }

}
