import { Component } from '@angular/core';
import { StateModel } from '../../models/state/state.service';
import { AppState } from '../../utilities/constants';

@Component({
  selector: 'header-view',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isExam: Boolean = false;
  
  constructor(private stateModel: StateModel) {}

  ngOnInit(): void {
    this.isExam = this.stateModel.getState().appState === AppState.Exam;
  }

}
