import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomResponseAreaComponent } from './custom-response-area.component';

describe('CustomResponseAreaComponent', () => {
  let component: CustomResponseAreaComponent;
  let fixture: ComponentFixture<CustomResponseAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CustomResponseAreaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomResponseAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
