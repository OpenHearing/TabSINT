import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResponseAreaComponent } from './response-area.component';

describe('ResponseAreaComponent', () => {
  let component: ResponseAreaComponent;
  let fixture: ComponentFixture<ResponseAreaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ResponseAreaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ResponseAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
