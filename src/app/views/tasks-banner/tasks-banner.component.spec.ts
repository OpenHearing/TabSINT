import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TasksBannerComponent } from './tasks-banner.component';

describe('TasksBannerComponent', () => {
  let component: TasksBannerComponent;
  let fixture: ComponentFixture<TasksBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TasksBannerComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TasksBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
