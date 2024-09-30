import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoftwareConfigComponent } from './software-config.component';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

describe('SoftwareConfigComponent', () => {
  let component: SoftwareConfigComponent;
  let fixture: ComponentFixture<SoftwareConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SoftwareConfigComponent],
      imports: [TranslateModule.forRoot({
                  loader: {
                    provide: TranslateLoader,
                    useClass: TranslateFakeLoader
                  }
                })],
      providers: [TranslateService, TranslateStore]
      })
      .compileComponents();
    
    fixture = TestBed.createComponent(SoftwareConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
