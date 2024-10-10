import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MaxOutputScreenComponent } from './max-output-screen.component';

describe('MaxOutputScreenComponent', () => {
  let component: MaxOutputScreenComponent;
  let fixture: ComponentFixture<MaxOutputScreenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MaxOutputScreenComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MaxOutputScreenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
