import { Component } from '@angular/core';
import { Subscription } from 'rxjs';
import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';
import { DiskModel } from '../../models/disk/disk.service';
import { StateModel } from '../../models/state/state.service';
import { ExamService } from '../../controllers/exam.service';
import { AppState, ExamState } from '../../utilities/constants';
import { PageInterface } from '../../models/page/page.interface';
import { PageModel } from '../../models/page/page.service';
import { ButtonTextService } from '../../controllers/button-text.service';

@Component({
  selector: 'exam-view',
  templateUrl: './exam.component.html',
  styleUrl: './exam.component.css'
})

export class ExamComponent {
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  currentPage: PageInterface;
  pageSubscription: Subscription | undefined;
  state: StateInterface;
  ExamState = ExamState;
  buttonText: string = 'Submit';
  buttonTextSubscription: Subscription | undefined;
  constructor (
    private readonly examService: ExamService,
    private readonly diskModel: DiskModel,
    private readonly stateModel: StateModel,
    private readonly pageModel: PageModel,
    private readonly buttonTextService: ButtonTextService
  ) {
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
    this.currentPage = this.pageModel.getPage();
  }

  ngOnInit(): void {
    this.diskSubscription = this.diskModel.diskSubject.subscribe( (updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
    this.pageSubscription = this.pageModel.currentPageSubject.subscribe( (updatedPage: PageInterface) => {
      this.currentPage = updatedPage;
    });
    this.examService.switchToExamView();
    this.state.appState = AppState.Exam;
    this.buttonTextSubscription = this.buttonTextService.buttonText$.subscribe((newText: string) => {
      this.buttonText = newText;
    });
  }

  ngOnDestroy(): void {
    this.diskSubscription?.unsubscribe();
    this.pageSubscription?.unsubscribe();
    this.state.appState = AppState.null;
    this.buttonTextSubscription?.unsubscribe();
  }

  begin() {
    this.examService.begin();
  }

  submit() {
    this.examService.submit();
  }

  back() {
    this.examService.back();
  }

  skip() {
    this.examService.skip();
  }

  reset() {
    this.examService.reset();
  }

  help() {
    this.examService.help();
  }
}
