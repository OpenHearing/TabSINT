import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { TympanConfigComponent } from './tympan-config.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatMenuModule } from '@angular/material/menu';

describe('TympanConfigComponent', () => {
  let component: TympanConfigComponent;
  let fixture: ComponentFixture<TympanConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TympanConfigComponent],
      imports: [NgbModule,
        MatMenuModule,
        TranslateModule.forRoot({
                  loader: {
                    provide: TranslateLoader,
                    useClass: TranslateFakeLoader
                  }
                })],
      providers: [TranslateService, TranslateStore]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TympanConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
