import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogConfigComponent } from './log-config.component';

describe('LogConfigComponent', () => {
  let component: LogConfigComponent;
  let fixture: ComponentFixture<LogConfigComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LogConfigComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LogConfigComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
