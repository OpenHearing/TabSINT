import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SweptDpoaeInProgressComponent } from './swept-dpoae-in-progress.component';


describe('SweptDpoaeInProgressComponentt', () => {
  let component: SweptDpoaeInProgressComponent;
  let fixture: ComponentFixture<SweptDpoaeInProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SweptDpoaeInProgressComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SweptDpoaeInProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
