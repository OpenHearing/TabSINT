import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { BekesyComponent } from './bekesy.component';
import { SoftwareButtonComponent } from '../shared/audiometry/software-button/software-button.component';
import { PageModel } from '../../../../models/page/page.service';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';
import { AudioService } from '../../../../services/audio.service';
import { Logger } from '../../../../services/logger.service';
import { pageInterfaceDefaults } from '../../../../utilities/defaults';
import { ResponseArea } from '../../../../interfaces/page-definition.interface';

describe('BekesyComponent', () => {
  let component: BekesyComponent;
  let fixture: ComponentFixture<BekesyComponent>;
  let examService: jasmine.SpyObj<ExamService>;
  let pageModel: PageModel;
  let stateModel: StateModel;

  /** Drive the exam to its reversal limit using only the software-button handlers. */
  function reachReversalLimit(): void {
    component.touchstartFun();
    component.touchendFun();
  }

  beforeEach(async () => {
    examService = jasmine.createSpyObj<ExamService>('ExamService', ['submit', 'submitDefault']);

    await TestBed.configureTestingModule({
      declarations: [BekesyComponent, SoftwareButtonComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [ResultsModel, StateModel, PageModel, AudioService, Logger, { provide: ExamService, useValue: examService }],
    }).compileComponents();

    fixture = TestBed.createComponent(BekesyComponent);
    component = fixture.componentInstance;
    pageModel = TestBed.inject(PageModel);
    stateModel = TestBed.inject(StateModel);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('advances once enough reversals are recorded when the protocol omits autoSubmit', () => {
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bekesy',
      responseArea: { type: 'bekesyResponseArea', numberReversals: 1 } as ResponseArea,
    });
    fixture.detectChanges();

    reachReversalLimit();

    expect(component.bekesyResponseParameter.autoSubmit).toBeTrue();
    expect(examService.submitDefault).toHaveBeenCalled();
  });

  it('waits for the user to submit once enough reversals are recorded when autoSubmit is turned off', () => {
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bekesy',
      responseArea: { type: 'bekesyResponseArea', numberReversals: 1, autoSubmit: false } as ResponseArea,
    });
    fixture.detectChanges();

    reachReversalLimit();

    expect(stateModel.getState().isSubmittable).toBeTrue();
    expect(examService.submitDefault).not.toHaveBeenCalled();
  });

  it('always advances when the user presses submit, regardless of autoSubmit', () => {
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'bekesy',
      responseArea: { type: 'bekesyResponseArea', autoSubmit: false } as ResponseArea,
    });
    fixture.detectChanges();

    component.submitButton();

    expect(examService.submitDefault).toHaveBeenCalled();
  });
});
