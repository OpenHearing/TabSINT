import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'multiple-input-view',
  templateUrl: './multiple-input.component.html',
  styleUrl: './multiple-input.component.css'
})
export class MultipleInputComponent  implements OnInit {
  @Input() page: any = {};
  today: string = new Date().toISOString().slice(0, 10);
  reviewDisabled: boolean = false;
  multiDropdownModel: { [key: number]: any[] } = {};
  multiDropdownJson: { [key: number]: any[] } = [];

  ngOnInit() {
    const inputTypeForAll = this.page?.dm?.responseArea?.inputTypeForAll || 'text';

    // Initialize multi-dropdown data
    this.page.dm.responseArea.inputList.forEach((item: any, index: number) => {
      if (!item.inputType) {
        item.inputType = inputTypeForAll;
      }
      if (item.inputType === 'multi-dropdown') {
        this.multiDropdownJson[index] = item.options.map((option: any, i: number) => ({
          id: i,
          label: option,
        }));
        this.multiDropdownModel[index] = [];
      }
    });

    // Initialize responses
    this.page.result.response = this.page.dm.responseArea.inputList.map(
      (item: any) => item.value
    );

    this.updateSubmittableLogic();
  }

  enableReview(status: boolean): void {
    this.reviewDisabled = status;
  }

  selectResponse(itemIdx: number, option: any): void {
    this.page.result.response[itemIdx] = option;
    this.updateSubmittableLogic();
  }

  selectMultiResponse(itemIdx: number): void {
    const multiResp = this.multiDropdownModel[itemIdx].map((resp: any) => resp.label);
    this.page.result.response[itemIdx] = multiResp;
    this.updateSubmittableLogic();
  }

  updateSubmittableLogic(): void {
    const isSubmittable = this.page.dm.responseArea.inputList.every(
      (item: any, idx: number) =>
        !item.required || this.isDefined(item, this.page.result.response[idx])
    );
    this.page.dm.isSubmittable = isSubmittable;
  }

  isDefined(item: any, val: any): boolean {
    if (['text', 'number'].includes(item.inputType)) {
      return val !== '' && val !== null && val !== undefined;
    }
    return val !== undefined;
  }
}
