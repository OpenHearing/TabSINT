import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Keyboard } from '@capacitor/keyboard';
import { PluginListenerHandle } from '@capacitor/core';
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

export class ExamComponent implements OnInit, OnDestroy  {
  // Controller varialbles
  buttonText: string = 'Submit';
  isKeyboardVisible = false;

  // Models
  disk: DiskInterface;
  currentPage: PageInterface;
  state: StateInterface;
  ExamState = ExamState;

  // Subscriptions
  diskSubscription: Subscription | undefined;
  pageSubscription: Subscription | undefined;
  buttonTextSubscription: Subscription | undefined;
  private keyboardShowListener?: PluginListenerHandle;
  private keyboardHideListener?: PluginListenerHandle;

  constructor (
    private readonly cdr: ChangeDetectorRef,
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
    this.initializeKeyboardListeners();
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
    this.removeKeyboardListeners();
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

  private async initializeKeyboardListeners() {
    this.keyboardShowListener = await Keyboard.addListener('keyboardWillShow', () => {
      this.isKeyboardVisible = true;
      this.cdr.detectChanges(); 
    });

    this.keyboardHideListener = await Keyboard.addListener('keyboardWillHide', () => {
      this.isKeyboardVisible = false;
      this.cdr.detectChanges(); 
    });
  }

  private async removeKeyboardListeners() {
    if (this.keyboardShowListener) {
      await this.keyboardShowListener.remove();
    }
    if (this.keyboardHideListener) {
      await this.keyboardHideListener.remove();
    }
  }
}
