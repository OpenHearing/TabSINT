import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SweptDpoaeInputParametersComponent } from './swept-dpoae-input-parameters.component';


describe('SweptDpoaeInputParametersComponent', () => {
  let component: SweptDpoaeInputParametersComponent;
  let fixture: ComponentFixture<SweptDpoaeInputParametersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SweptDpoaeInputParametersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SweptDpoaeInputParametersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
