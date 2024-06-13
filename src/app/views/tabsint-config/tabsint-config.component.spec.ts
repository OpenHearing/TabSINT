import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { TabsintConfigComponent } from './tabsint-config.component';
import { MatMenuModule } from '@angular/material/menu';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

describe('TabsintConfigComponent', () => {
  let component: TabsintConfigComponent;
  let fixture: ComponentFixture<TabsintConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TabsintConfigComponent],
      imports: [
        MatMenuModule, 
        NgbModule,
        FormsModule,
        TranslateModule.forRoot({
                  loader: {
                    provide: TranslateLoader,
                    useClass: TranslateFakeLoader
                  }
                })],
      providers: [TranslateService, TranslateStore]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TabsintConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
