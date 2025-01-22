import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WAIInputParametersComponent } from './wai-input-parameters.component';


describe('SweptDpoaeInputParametersComponent', () => {
  let component: WAIInputParametersComponent;
  let fixture: ComponentFixture<WAIInputParametersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [WAIInputParametersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(WAIInputParametersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
