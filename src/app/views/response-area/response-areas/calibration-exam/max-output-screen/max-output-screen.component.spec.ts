import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaxOutputScreenComponent } from './max-output-screen.component';
import { FormsModule } from '@angular/forms';
import { TranslocoTestingModule } from '@jsverse/transloco';

describe('MaxOutputScreenComponent', () => {
  let component: MaxOutputScreenComponent;
  let fixture: ComponentFixture<MaxOutputScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MaxOutputScreenComponent],
      imports: [
        FormsModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MaxOutputScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
