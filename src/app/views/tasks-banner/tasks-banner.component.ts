import { Component, OnDestroy, OnInit } from '@angular/core';
import { Tasks } from '../../utilities/tasks.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tasks-banner',
  templateUrl: './tasks-banner.component.html',
  styleUrl: './tasks-banner.component.css'
})
export class TasksBannerComponent implements OnInit, OnDestroy{
  isVisible = false;
  taskSubscription!: Subscription;
  taskList: { [key: string]: string } = {};

  constructor(private tasks: Tasks) {}

  ngOnInit(): void {
    this.taskSubscription = this.tasks.tasks$.subscribe(tasks => {
      this.taskList = tasks;
      this.isVisible = Object.keys(this.taskList).length > 0;
    });
  }

  ngOnDestroy(): void {
    if (this.taskSubscription) {
      this.taskSubscription.unsubscribe();
    }
  }

  getOngoingTasksMessage(): string {
    const taskMessages = Object.values(this.taskList);
    return taskMessages.length > 0 ? taskMessages.join(', ') : 'Performing tasks...';
  }
}
