import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogConfigComponent } from './log-config.component';
import { TranslocoTestingModule } from '@jsverse/transloco';

describe('LogConfigComponent', () => {
  let component: LogConfigComponent;
  let fixture: ComponentFixture<LogConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogConfigComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      
    }).compileComponents();

    fixture = TestBed.createComponent(LogConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
