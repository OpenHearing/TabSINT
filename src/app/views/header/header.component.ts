import { Component } from '@angular/core';
import { StateM } from '../../models/state/state.service';
import { AppState } from '../../utilities/constants';

@Component({
  selector: 'header-view',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isExam: Boolean = false;
  
  constructor(private stateM: StateM) {}

  ngOnInit(): void {
    this.isExam = this.stateM.getState().appState === AppState.Exam;
  }

}
