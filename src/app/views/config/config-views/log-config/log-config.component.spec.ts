import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogConfigComponent } from './log-config.component';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

describe('LogConfigComponent', () => {
  let component: LogConfigComponent;
  let fixture: ComponentFixture<LogConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogConfigComponent],
      imports: [TranslateModule.forRoot({
                  loader: {
                    provide: TranslateLoader,
                    useClass: TranslateFakeLoader
                  }
                })],
      providers: [TranslateService, TranslateStore]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LogConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
