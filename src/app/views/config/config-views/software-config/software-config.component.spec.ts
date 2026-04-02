import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoftwareConfigComponent } from './software-config.component';
import { TranslocoTestingModule } from '@jsverse/transloco';

describe('SoftwareConfigComponent', () => {
  let component: SoftwareConfigComponent;
  let fixture: ComponentFixture<SoftwareConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SoftwareConfigComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      
    }).compileComponents();

    fixture = TestBed.createComponent(SoftwareConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
