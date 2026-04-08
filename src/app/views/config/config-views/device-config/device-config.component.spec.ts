import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { NewConnectionComponent } from '../new-connection/new-connection.component';
import { DeviceConfigComponent } from './device-config.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatMenuModule } from '@angular/material/menu';
import { ConnectedDevicesComponent } from '../connected-devices/connected-devices.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormsModule } from '@angular/forms';

describe('DeviceConfigComponent', () => {
  let component: DeviceConfigComponent;
  let fixture: ComponentFixture<DeviceConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeviceConfigComponent, NewConnectionComponent, ConnectedDevicesComponent],
      imports: [
        FormsModule,
        NgbModule,
        MatMenuModule,
        MatExpansionModule,
        BrowserAnimationsModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
