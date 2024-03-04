import { Component } from '@angular/core';
import { StateM } from '../../models/state/state.service';
import { AppState } from '../../utilities/constants';

@Component({
  selector: 'exam-view',
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.css'
})

export class ExamComponent {

  constructor(private stateM: StateM) {}

  ngOnInit(): void {
    this.stateM.setAppState(AppState.Exam);
  }

  ngOnDestroy(): void {
    this.stateM.setAppState(AppState.null);
  }
}
