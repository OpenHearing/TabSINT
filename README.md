# OpenTabSINT

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.1.1.

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