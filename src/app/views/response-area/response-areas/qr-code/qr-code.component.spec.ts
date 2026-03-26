import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResultsModel } from '../../../../models/results/results-model.service';
import { StateModel } from '../../../../models/state/state.service';
import { PageModel } from '../../../../models/page/page.service';
import { QrCodeResponseAreaComponent } from './qr-code.component';
import { QrService } from '../../../../services/qr.service';
import { Notifications } from '../../../../services/notifications.service';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

describe('QrCodeResponseAreaComponent', () => {
  let component: QrCodeResponseAreaComponent;
  let fixture: ComponentFixture<QrCodeResponseAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [QrCodeResponseAreaComponent],
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
      providers: [TranslateService, TranslateStore, StateModel, ResultsModel, PageModel, QrService, Notifications],
    }).compileComponents();

    fixture = TestBed.createComponent(QrCodeResponseAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
