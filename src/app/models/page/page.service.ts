import { Injectable } from '@angular/core';
import { PageInterface } from './page.interface';

@Injectable({
    providedIn: 'root',
})

export class PageModel {

    pageModel: PageInterface = {
        name: "name",
        enableBackButton: true,
        hideProgressBar: false,
        helpText: "helpText",
        submitText: undefined,
        isSubmittable: true,
        canGoBack: Function,
        responseArea: {
            enableSkip: true,
            type: "type"
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
        loadingActive: false
    }

    getPage(): PageInterface {
        return this.pageModel;
    }

}