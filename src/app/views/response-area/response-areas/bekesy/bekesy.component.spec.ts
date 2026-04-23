import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { BekesyComponent } from './bekesy.component';
import { PageModel } from '../../../../models/page/page.service';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { StateModel } from '../../../../models/state/state.service';
import { ExamService } from '../../../../controllers/exam.service';
import { AudioService } from '../../../../services/audio.service';
import { Logger } from '../../../../services/logger.service';

describe('BekesyComponent', () => {
  let component: BekesyComponent;
  let fixture: ComponentFixture<BekesyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BekesyComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [ResultsModel, StateModel, PageModel, ExamService, AudioService, Logger],
    }).compileComponents();

    fixture = TestBed.createComponent(BekesyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
