import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TextboxComponent } from './textbox.component';
import { FormsModule } from '@angular/forms';
import { ResultsModel } from '../../../../models/results/results-model.service';
import { ExamService } from '../../../../controllers/exam.service';
import { StateModel } from '../../../../models/state/state.service';
import { PageModel } from '../../../../models/page/page.service';
import { pageInterfaceDefaults } from '../../../../utilities/defaults';
import { ResponseArea } from '../../../../interfaces/page-definition.interface';

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

  it('falls back to the schema default row count when the protocol omits rows', () => {
    const pageModel = TestBed.inject(PageModel);
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'textbox',
      responseArea: { type: 'textboxResponseArea' } as ResponseArea,
    });
    fixture.detectChanges();

    expect(component.rows).toBe(1);
  });

  it('uses the row count supplied by the protocol', () => {
    const pageModel = TestBed.inject(PageModel);
    pageModel.updatePage({
      ...pageInterfaceDefaults,
      id: 'textbox',
      responseArea: { type: 'textboxResponseArea', rows: 5 } as ResponseArea,
    });
    fixture.detectChanges();

    expect(component.rows).toBe(5);
  });
});
