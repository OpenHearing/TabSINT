import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChaInfoComponent } from './cha-info.component';

describe('ChaInfoComponent', () => {
  let component: ChaInfoComponent;
  let fixture: ComponentFixture<ChaInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChaInfoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ChaInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
