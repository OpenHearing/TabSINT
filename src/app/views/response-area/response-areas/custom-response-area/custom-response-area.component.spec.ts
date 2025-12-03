import { ComponentFixture, TestBed } from '@angular/core/testing';

import { customResponseAreaComponent } from './custom-response-area.component';

describe('customResponseAreaComponent', () => {
  let component: customResponseAreaComponent;
  let fixture: ComponentFixture<customResponseAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [customResponseAreaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(customResponseAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
