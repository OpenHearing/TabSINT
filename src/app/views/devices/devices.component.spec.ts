import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { ConfigComponent } from './devices.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { TabsintConfigComponent } from './config-views/tabsint-config/tabsint-config.component';
import { SoftwareConfigComponent } from './config-views/software-config/software-config.component';
import { LogConfigComponent } from './config-views/log-config/log-config.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatMenuModule } from '@angular/material/menu';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { QRCodeModule } from 'angularx-qrcode';

describe('ConfigComponent', () => {
  let component: ConfigComponent;
  let fixture: ComponentFixture<ConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        ConfigComponent,
        TabsintConfigComponent,
        SoftwareConfigComponent,
        LogConfigComponent,
      ],
      schemas: [NO_ERRORS_SCHEMA],
      imports: [
        FormsModule,
        MatExpansionModule,
        BrowserAnimationsModule,
        MatMenuModule,
        NgbModule,
        QRCodeModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
