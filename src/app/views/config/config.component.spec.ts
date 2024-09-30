import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { DeviceConfigComponent } from './config-views/device-config/device-config.component';
import { NewConnectionComponent } from './config-views/new-connection/new-connection.component';
import { ConfigComponent } from './config.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { TabsintConfigComponent } from './config-views/tabsint-config/tabsint-config.component';
import { SoftwareConfigComponent } from './config-views/software-config/software-config.component';
import { LogConfigComponent } from './config-views/log-config/log-config.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatMenuModule } from '@angular/material/menu';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { ConnectedDevicesComponent } from './config-views/connected-devices/connected-devices.component';

describe('ConfigComponent', () => {
  let component: ConfigComponent;
  let fixture: ComponentFixture<ConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConfigComponent,
        TabsintConfigComponent,
        SoftwareConfigComponent,
        LogConfigComponent,
        DeviceConfigComponent,
        NewConnectionComponent,
        ConnectedDevicesComponent
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
