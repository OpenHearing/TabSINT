import { Injectable } from '@angular/core';
import { PageInterface } from './page.interface';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';

@Injectable({
    providedIn: 'root',
})

export class PageModel {

    currentPage: PageInterface = {
        id: "id",
        name: "name",
        filename: "path/to/file",
        units: "mm",
        example: 100,
        other: ["array", "of", "strings"],
        dict: { "key": "value" },
        enableBackButton: true,
        hideProgressBar: false,
        helpText: "helpText",
        submitText: "Submit",
        isSubmittable: true,
        canGoBack: true,
        responseArea: {
            type: "type",
        },
        title: "title",
        instructionText: "instructionText",
        subtitle: "subtitle",
        // image: {
        //     path: "path"
        // },
        image: undefined,
        questionSubText: "questionSubText",
        questionMainText: "questionMainText",
        loadingRequired: false,
        loadingActive: false,
        // followOns: [],
        exportToCSV: false
    };

    currentPageObservable = new BehaviorSubject(this.currentPage);

    stack: PageInterface[] = [];
    
    getPage(): PageInterface {
        return this.currentPage;
    }

}