import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleResultModalComponent } from './single-result-modal.component';

describe('SingleResultModalComponent', () => {
  let component: SingleResultModalComponent;
  let fixture: ComponentFixture<SingleResultModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SingleResultModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SingleResultModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
