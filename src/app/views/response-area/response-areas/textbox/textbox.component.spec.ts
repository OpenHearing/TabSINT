import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextboxComponent } from './textbox.component';
import { FormsModule } from '@angular/forms';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { ExamService } from '../../../../controllers/exam.service';
import { StateModel } from '../../../../models/state/state.service';
import { PageModel } from '../../../../models/page/page.service';

describe('TextboxComponent', () => {
  let component: TextboxComponent;
  let fixture: ComponentFixture<TextboxComponent>;
  let mockExamService: jasmine.SpyObj<ExamService>;

  beforeEach(async () => {
    mockExamService = jasmine.createSpyObj('ExamService', ['_dummyMethod']);

    await TestBed.configureTestingModule({
      declarations: [TextboxComponent],
      imports: [FormsModule],
      providers: [StateModel, ResultsModel, PageModel, { provide: ExamService, useValue: mockExamService }],
    }).compileComponents();

    fixture = TestBed.createComponent(TextboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
