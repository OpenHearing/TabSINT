import { Component } from '@angular/core';
import { StateModel } from '../../models/state/state.service';
import { AppState } from '../../utilities/constants';
import { ExamService } from '../../controllers/exam.service';

@Component({
  selector: 'header-view',
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  isExam: Boolean = false;
  
  constructor(private stateModel: StateModel, public examService: ExamService) {}

  ngOnInit(): void {
    this.isExam = this.stateModel.getState().appState === AppState.Exam;
  }

}
