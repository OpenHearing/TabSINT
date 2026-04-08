import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MatExpansionModule } from '@angular/material/expansion';
import { DeviceInfoComponent } from './device-info.component';
import { MatMenuModule } from '@angular/material/menu';
import { TympanDevice } from '../../../../models/devices/tympan-device';

describe('DeviceInfoComponent', () => {
  let component: DeviceInfoComponent;
  let fixture: ComponentFixture<DeviceInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeviceInfoComponent],
      imports: [
        MatExpansionModule,
        MatMenuModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DeviceInfoComponent);
    component = fixture.componentInstance;
    component.device = new TympanDevice('1', 'Device', 'UUID');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
