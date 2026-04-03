import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomResponseAreaComponent } from './custom-response-area.component';
import { ResultsService } from '../../../../controllers/results.service';
import { TranslateModule } from '@ngx-translate/core';

describe('CustomResponseAreaComponent', () => {
  let component: CustomResponseAreaComponent;
  let fixture: ComponentFixture<CustomResponseAreaComponent>;
  let mockResultsService: jasmine.SpyObj<ResultsService>;

  beforeEach(async () => {
    mockResultsService = jasmine.createSpyObj('ResultsService', ['_dummyMethod']);

    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [CustomResponseAreaComponent],
      providers: [{ provide: ResultsService, useValue: mockResultsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CustomResponseAreaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
