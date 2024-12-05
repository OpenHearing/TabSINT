import { Injectable } from '@angular/core';
import { PageInterface } from './page.interface';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { PageDefinition } from '../../interfaces/page-definition.interface';
import { pageInterfaceDefaults } from '../../utilities/defaults';

@Injectable({
    providedIn: 'root',
})

export class PageModel {

    currentPage: PageInterface = pageInterfaceDefaults;

    currentPageSubject = new BehaviorSubject<PageInterface>(this.currentPage);

    stack: PageDefinition[] = [];
    
    getPage(): PageInterface {
        return this.currentPage;
    }

}