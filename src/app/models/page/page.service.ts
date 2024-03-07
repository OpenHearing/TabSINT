import { Injectable } from '@angular/core';
import { PageInterface } from './page.interface';

@Injectable({
    providedIn: 'root',
})

export class PageModel {

    pageModel: PageInterface = {
        name: "name",
        filename: "path/to/file",
        units: "mm",
        example: 100,
        other: ["array","of","strings"],
        dict: {"key":"value"}
    }

    getPage(): PageInterface {
        return this.pageModel;
    }

}