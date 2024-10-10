import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextboxResultViewerComponent } from './textbox-result-viewer.component';
import { FormsModule } from '@angular/forms';

describe('TextboxResultViewerComponent', () => {
  let component: TextboxResultViewerComponent;
  let fixture: ComponentFixture<TextboxResultViewerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TextboxResultViewerComponent],
      imports: [FormsModule]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TextboxResultViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
