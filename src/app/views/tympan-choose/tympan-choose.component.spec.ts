import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TympanChooseComponent } from './tympan-choose.component';

describe('TympanChooseComponent', () => {
  let component: TympanChooseComponent;
  let fixture: ComponentFixture<TympanChooseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TympanChooseComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TympanChooseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
