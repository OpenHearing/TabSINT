import { Injectable } from '@angular/core';
import { PageModel } from './page.interface';

@Injectable({
    providedIn: 'root',
})

export class PageM {

    pageM: PageModel = {
        name: "name",
        filename: "path/to/file",
        units: "mm",
        example: 100,
        other: ["array","of","strings"],
        dict: {"key":"value"}
    }

}