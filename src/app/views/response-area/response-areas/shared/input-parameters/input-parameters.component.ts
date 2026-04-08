import { Component, Input } from '@angular/core';
import { KeyValue } from '@angular/common';

/**
 * Component for displaying parameters to the user in a tabulated format.
 */
@Component({
  selector: 'app-input-parameters',
  templateUrl: './input-parameters.component.html',
  styleUrl: './input-parameters.component.css',
})
export class InputParametersComponent {
  /** A message to display above the tabulated data.*/
  @Input() instruction?: string;
  /** The data to be displayed in a table format.*/
  @Input() parameterMap!: Map<string, string>;

  /** Used to preserve original order of map. */
  originalOrder = (a: KeyValue<string, string>, b: KeyValue<string, string>): number => {
    return 0;
  };
}
