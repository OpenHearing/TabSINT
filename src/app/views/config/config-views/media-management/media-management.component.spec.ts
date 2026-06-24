import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { TympanDevice } from '../../../../models/devices/tympan-device';
import { MediaManagementComponent } from './media-management.component';

describe('MediaManagementComponent', () => {
  let component: MediaManagementComponent;
  let fixture: ComponentFixture<MediaManagementComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MediaManagementComponent],
      imports: [
        MatExpansionModule,
        MatMenuModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaManagementComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
