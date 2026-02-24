import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable } from 'rxjs';

import { MultipleInputComponent } from './multiple-input.component';
import { ExamService } from '../../../../controllers/exam.service';

describe('MultipleInputComponent', () => {
  let component: MultipleInputComponent;
  let fixture: ComponentFixture<MultipleInputComponent>;
  let mockExamService: jasmine.SpyObj<ExamService>;

  beforeEach(async () => {
    mockExamService = jasmine.createSpyObj('ExamService', ['_dummyMethod'], { currentPageObservable: new Observable(undefined) });

    await TestBed.configureTestingModule({
      declarations: [MultipleInputComponent],
      providers: [{ provide: ExamService, useValue: mockExamService }],
    }).compileComponents();

    fixture = TestBed.createComponent(MultipleInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
