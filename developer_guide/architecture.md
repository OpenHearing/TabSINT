# App Architecture

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.1.1.

The application is designed following a [Model-View-Controller (MVC) design pattern](https://developer.mozilla.org/en-US/docs/Glossary/MVC).

- [Interfaces](https://www.typescriptlang.org/docs/handbook/interfaces.html) are used to define data structures, limiting the use of the `any` type. 
- `Utilities` are functions and classes that don't depend on models and services, such that they can be called from anywhere. Utilities are [services](https://angular.dev/guide/di/creating-injectable-service) in the Angular terminology, which are injectable accross the application. Models define the data structure and save the data associated with each model. 
- `Models` and `Controllers` are [services](https://angular.dev/guide/di/creating-injectable-service) in the Angular terminology. 
- `Views` are [components](https://angular.dev/guide/components) in the angular terminology, and encompass:
  * a TypeScript class with behaviors, 
  * a HTML template that renders as the UI, 
  * a CSS file that defines the component styles, and 
  * a test file. 

- `Response Areas` are how TabSINT runs and displays exam realted content. They consist of `Views`, use `Models`, and `Controllers`. `Response Areas` live in src/app/views/response-area/response-areas/ and have the following file structure (replace myResponseArea with the name of your response area):
  * myResponseArea directory
    * HTML file
    * Typescript file
    * CSS file
    * test file
  * myResponseAreaResultViewer directory
    * HTML file
    * Typescript file
    * CSS file
    * test file
  * interface file that describes parameters required for the response area

Separating the component's view-related features from services other kinds of processing makes the component classes lean and efficient. The specifics of how the models, views, controllers, and utilities related to each other in TabSINT are illustrated here. It is important to carefully follow the dependency injections to avoid circular injections.

<img src="architecture.png">

## Documentation

We are currently planning to use TS Docs. This will look something like the following example. Note that if you hover over the example in VS Code or other IDE's this will provide you with information about the function.

/**
    * Example of TS Doc
    *
    * @summary can put summary here
    * @param x description of variable x
    * @returns what the function returns
    * @customExpression can define anything like this as well
*/
ExampleFunction(x:string) {
    // does something
    return something
}

### Exam Engine

The exam will start initialize in NOT-READY state. When a protocol is loaded, the exam state will change to READY. Then, users can navigate to exam view and begin the exam calling begin(). This will add pages to protocolStack and initialize the currentPage variable. Whenever the currentPage variable changes currentPageSubject will also be updated. All repsonseArea's and any other code that needs to can subscribe to that subject and therefore will be notified whenever it updates. This is how the responseArea page parameters will update in real-time for the DOM.

Users progress through pages in the exam via the submit button which will call submit(). Submit() will be set to submitDefault() unless explicitly overwritten. For now it is not overwritten anywhere but we may need that funcitonality for custom protocols. SubmitDefault() will call advancePage(). AdvancePage() will advance the page to the next page in protocolStack if available. Otherwise it will look for a followOn and then update the protocolStack and go to the next page. This will change the currentPage variable and cause the currentPageSubject to emit the current page so all responseArea's subscribing will recieve an update.

[PREVIOUS: Building and Running](building-running.md)

[NEXT: Repository Organization](organization.md)

[BACK TO INDEX](developer-guide-index.md)