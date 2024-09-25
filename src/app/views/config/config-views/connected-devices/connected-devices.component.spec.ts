import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectedDevicesComponent } from './connected-devices.component';

describe('ConnectedDevicesComponent', () => {
  let component: ConnectedDevicesComponent;
  let fixture: ComponentFixture<ConnectedDevicesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ConnectedDevicesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConnectedDevicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
