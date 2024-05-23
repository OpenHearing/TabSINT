import { Injectable } from '@angular/core';
import _, { Dictionary } from 'lodash';

@Injectable({
    providedIn: 'root',
})

export class Tasks {

    hidden: boolean = false;
    list: Dictionary<string> = {};

    register(task: string, msg: string): void {
        this.list[task] = msg;
    }
    
    deregister(task: string): void {
        delete this.list[task];

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