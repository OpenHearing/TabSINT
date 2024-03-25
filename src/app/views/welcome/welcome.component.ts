import { Component } from '@angular/core';
import { ExamService } from '../../controllers/exam.service';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css'
})
export class WelcomeComponent {

  constructor(public examService: ExamService) {}

  // TODO: Replace this variable with a model?
  config:any = {};

  scanQrCodeandAutoConfig() {
    console.log("scanQrCodeandAutoConfig() called from welcome.component.ts");
  }
}
