import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChaConfigComponent } from './cha-config.component';

describe('ChaConfigComponent', () => {
  let component: ChaConfigComponent;
  let fixture: ComponentFixture<ChaConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChaConfigComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChaConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
