import { Injectable } from '@angular/core';
import _, { Dictionary } from 'lodash';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
    providedIn: 'root',
})

export class Tasks {

    hidden: boolean = false;
    private taskSubject = new BehaviorSubject<Dictionary<string>>({});
    tasks$ = this.taskSubject.asObservable();
    list: Dictionary<string> = {};

    register(task: string, msg: string): void {
        this.list[task] = msg;
        this.taskSubject.next(this.list);
    }
    
    deregister(task: string): void {
        delete this.list[task];
        this.taskSubject.next(this.list);
        if (this.numOngoing() < 1) {
          this.hidden = false;
        }
    }

    hide(): void {
        this.hidden = true;
    }

    unhide(): void {
        this.hidden = false;
    }

    isOngoing(task: string): boolean {
        return _.has(this.list, task);
    }

    numOngoing(): number {
        return _.keys(this.list).length;
    }
}