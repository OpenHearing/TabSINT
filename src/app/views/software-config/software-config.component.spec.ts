import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoftwareConfigComponent } from './software-config.component';

describe('SoftwareConfigComponent', () => {
  let component: SoftwareConfigComponent;
  let fixture: ComponentFixture<SoftwareConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SoftwareConfigComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SoftwareConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
