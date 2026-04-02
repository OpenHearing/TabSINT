import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DebugComponent } from './debug.component';
import { TranslocoTestingModule } from '@jsverse/transloco';

describe('DebugComponent', () => {
  let component: DebugComponent;
  let fixture: ComponentFixture<DebugComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DebugComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      
    }).compileComponents();

    fixture = TestBed.createComponent(DebugComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
