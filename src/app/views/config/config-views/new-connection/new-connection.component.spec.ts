import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewConnectionComponent } from './new-connection.component';
import { TranslocoTestingModule } from '@jsverse/transloco';

describe('NewConnectionComponent', () => {
  let component: NewConnectionComponent;
  let fixture: ComponentFixture<NewConnectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewConnectionComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      
    }).compileComponents();

    fixture = TestBed.createComponent(NewConnectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
