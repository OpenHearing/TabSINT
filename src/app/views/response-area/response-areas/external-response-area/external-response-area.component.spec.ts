import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalResponseAreaComponent } from './external-response-area.component';

describe('ExternalResponseAreaComponent', () => {
  let component: ExternalResponseAreaComponent;
  let fixture: ComponentFixture<ExternalResponseAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExternalResponseAreaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ExternalResponseAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
