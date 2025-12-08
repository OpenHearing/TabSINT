import { Injectable } from '@angular/core';

import { AppModel } from '../models/app/app.service';
import { AppInterface } from '../models/app/app.interface';

@Injectable({
  providedIn: 'root',
})
export class Paths {
  app: AppInterface;

  constructor(private readonly appModel: AppModel) {
    this.app = this.appModel.getApp();
  }

  www(path: string): string {
    if (this.app.tablet) {
      path = 'www/' + path;
    } else if (this.app.test) {
      path = 'base/www/' + path;
    }
    return path;
  }

  /**
   * Path joining for the provided path items.
   * @param items The items to be joined into a singular path.
   * @returns The joined path of the provided items.
   */
  join(...items: string[]) {
    return items
      .filter(e => String(e).trim())
      .map(p => p.replace(/^\/+/, '').replace(/\/+$/, ''))
      .join('/');
  }
}
