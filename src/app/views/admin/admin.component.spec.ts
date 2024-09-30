import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';

import { AdminComponent } from './admin.component';
import { HeaderComponent } from '../header/header.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { IndicatorComponent } from '../indicator/indicator.component';
import { MatMenuModule } from '@angular/material/menu';
import { ConfigComponent } from '../config/config.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { TabsintConfigComponent } from '../config/config-views/tabsint-config/tabsint-config.component';
import { SoftwareConfigComponent } from '../config/config-views/software-config/software-config.component';
import { LogConfigComponent } from '../config/config-views/log-config/log-config.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { DeviceConfigComponent } from '../config/config-views/device-config/device-config.component';
import { NewConnectionComponent } from '../config/config-views/new-connection/new-connection.component';
import { ConnectedDevicesComponent } from '../config/config-views/connected-devices/connected-devices.component';

describe('AdminComponent', () => {
  let component: AdminComponent;
  let fixture: ComponentFixture<AdminComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AdminComponent, 
        HeaderComponent, 
        IndicatorComponent, 
        ConfigComponent, 
        TabsintConfigComponent,
        SoftwareConfigComponent,
        LogConfigComponent,
        DeviceConfigComponent,
        NewConnectionComponent,
        ConnectedDevicesComponent
      ],
      imports: [
        FormsModule,
        NgbModule, 
        MatMenuModule, 
        MatExpansionModule,
        BrowserAnimationsModule,
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
    
    fixture = TestBed.createComponent(AdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
