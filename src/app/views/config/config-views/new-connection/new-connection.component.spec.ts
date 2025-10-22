import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewConnectionComponent } from './new-connection.component';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

describe('NewConnectionComponent', () => {
  let component: NewConnectionComponent;
  let fixture: ComponentFixture<NewConnectionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NewConnectionComponent],
      imports: [
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useClass: TranslateFakeLoader,
          },
        }),
      ],
      providers: [TranslateService, TranslateStore],
    }).compileComponents();

    fixture = TestBed.createComponent(NewConnectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
