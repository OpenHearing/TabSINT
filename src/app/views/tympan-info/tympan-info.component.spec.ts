import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { TympanInfoComponent } from './tympan-info.component';
import { MatMenuModule } from '@angular/material/menu';

describe('ChaInfoComponent', () => {
  let component: TympanInfoComponent;
  let fixture: ComponentFixture<TympanInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TympanInfoComponent],
      imports: [TranslateModule.forRoot({
                  loader: {
                    provide: TranslateLoader,
                    useClass: TranslateFakeLoader
                  }
                }),
                MatMenuModule],
      providers: [TranslateService, TranslateStore]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TympanInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
