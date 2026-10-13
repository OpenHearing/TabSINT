import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ResultsModel } from '../../../../models/results/results-model.service';
import { StateModel } from '../../../../models/state/state.service';
import { PageModel } from '../../../../models/page/page.service';
import { QrCodeResponseAreaComponent } from './qr-code.component';
import { QrService } from '../../../../services/qr.service';
import { Notifications } from '../../../../services/notifications.service';
import { ExamService } from '../../../../controllers/exam.service';
import { pageInterfaceDefaults } from '../../../../utilities/defaults';
import { ResponseArea } from '../../../../interfaces/page-definition.interface';
import { TranslocoTestingModule } from '@jsverse/transloco';

describe('QrCodeResponseAreaComponent', () => {
  let component: QrCodeResponseAreaComponent;
  let fixture: ComponentFixture<QrCodeResponseAreaComponent>;
  let examService: jasmine.SpyObj<ExamService>;
  let qrService: jasmine.SpyObj<QrService>;
  let notifications: jasmine.SpyObj<Notifications>;
  let pageModel: PageModel;

  beforeEach(async () => {
    examService = jasmine.createSpyObj<ExamService>('ExamService', ['submit', 'submitDefault']);

    qrService = jasmine.createSpyObj<QrService>('QrService', ['scan']);
    qrService.scan.and.resolveTo('scanned-code');

    notifications = jasmine.createSpyObj<Notifications>('Notifications', ['alert']);
    notifications.alert.and.returnValue(of('closed'));

    await TestBed.configureTestingModule({
      declarations: [QrCodeResponseAreaComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [
        StateModel,
        ResultsModel,
        PageModel,
        { provide: QrService, useValue: qrService },
        { provide: Notifications, useValue: notifications },
        { provide: ExamService, useValue: examService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QrCodeResponseAreaComponent);
    component = fixture.componentInstance;
    pageModel = TestBed.inject(PageModel);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('auto-submits after a successful scan when the protocol omits autoSubmit', async () => {
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'qr',
      responseArea: { type: 'qrCodeResponseArea', scope: 'exam' } as ResponseArea,
    });
    fixture.detectChanges();

    await component.scanCode();

    expect(component.qrExamProperties.autoSubmit).toBeTrue();
    expect(examService.submit).toHaveBeenCalled();
  });

  it('does not auto-submit after a scan when autoSubmit is turned off', async () => {
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'qr',
      responseArea: { type: 'qrCodeResponseArea', scope: 'exam', autoSubmit: false } as ResponseArea,
    });
    fixture.detectChanges();

    await component.scanCode();

    expect(component.qrData).toBe('scanned-code');
    expect(examService.submit).not.toHaveBeenCalled();
  });
});
