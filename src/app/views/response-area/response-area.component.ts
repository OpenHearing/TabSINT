import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { PageInterface } from '../../interfaces/page-definition.interface';
import { ExamService } from '../../controllers/exam.service';

@Component({
  selector: 'response-area',
  templateUrl: './response-area.component.html',
  template: 'response-area',
  styleUrl: './response-area.component.css',
})
export class ResponseAreaComponent implements OnInit, OnDestroy {
  pageSubscription: Subscription | undefined;
  currentPage?: PageInterface;

  constructor(private readonly examService: ExamService) {}

  ngOnInit(): void {
    this.pageSubscription = this.examService.currentPageObservable.subscribe((updatedPage: PageInterface) => {
      this.currentPage = updatedPage;
    });
  }

  ngOnDestroy(): void {
    this.pageSubscription?.unsubscribe();
  }
}
