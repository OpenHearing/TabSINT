import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AudiogramComponent } from './audiogram.component';

describe('AudiogramComponent', () => {
  let component: AudiogramComponent;
  let fixture: ComponentFixture<AudiogramComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AudiogramComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AudiogramComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
