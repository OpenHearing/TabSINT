import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

import { TextboxResultViewerComponent } from './textbox-result-viewer.component';
import { ExamService } from '../../../../controllers/exam.service';

describe('TextboxResultViewerComponent', () => {
  let component: TextboxResultViewerComponent;
  let fixture: ComponentFixture<TextboxResultViewerComponent>;
  let mockExamService: jasmine.SpyObj<ExamService>;

  beforeEach(async () => {
    mockExamService = jasmine.createSpyObj('ExamService', ['_dummyMethod'], { currentPageObservable: new Observable(undefined) });

    await TestBed.configureTestingModule({
      declarations: [TextboxResultViewerComponent],
      imports: [FormsModule],
      providers: [{ provide: ExamService, useValue: mockExamService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TextboxResultViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
