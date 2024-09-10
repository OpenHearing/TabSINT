import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { ConfigComponent } from './config.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { TabsintConfigComponent } from '../tabsint-config/tabsint-config.component';
import { ChaConfigComponent } from '../cha-config/cha-config.component';
import { SoftwareConfigComponent } from '../software-config/software-config.component';
import { LogConfigComponent } from '../log-config/log-config.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatMenuModule } from '@angular/material/menu';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';

describe('ConfigComponent', () => {
  let component: ConfigComponent;
  let fixture: ComponentFixture<ConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfigComponent,
        TabsintConfigComponent,
        ChaConfigComponent,
        SoftwareConfigComponent,
        LogConfigComponent
      ],
      imports: [
        FormsModule,
        MatExpansionModule,
        BrowserAnimationsModule,
        MatMenuModule,
        NgbModule,
        TranslateModule.forRoot({
                  loader: {
                    provide: TranslateLoader,
                    useClass: TranslateFakeLoader
                  }
                })
      ],
      providers: [TranslateService, TranslateStore]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
