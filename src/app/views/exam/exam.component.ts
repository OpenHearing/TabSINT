import { Component } from '@angular/core';
import { StateModel } from '../../models/state/state.service';
import { AppState } from '../../utilities/constants';

@Component({
  selector: 'exam-view',
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.css'
})

export class ExamComponent {

  constructor(private stateModel: StateModel) {}

  ngOnInit(): void {
    this.stateModel.setAppState(AppState.Exam);
  }

  ngOnDestroy(): void {
    this.stateModel.setAppState(AppState.null);
  }
}
