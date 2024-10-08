import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateFakeLoader, TranslateLoader, TranslateModule, TranslateService, TranslateStore } from '@ngx-translate/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { DeviceInfoComponent } from './device-info.component';
import { MatMenuModule } from '@angular/material/menu';

describe('DeviceInfoComponent', () => {
  let component: DeviceInfoComponent;
  let fixture: ComponentFixture<DeviceInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DeviceInfoComponent],
      imports: [
        MatExpansionModule,
        MatMenuModule,
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
    
    fixture = TestBed.createComponent(DeviceInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
