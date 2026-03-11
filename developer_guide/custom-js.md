# User Guide

This is a WIP guide for how to use customJS response areas. This customJS response area framework allows users to input their own html and js files to be injected into TabSINT. It should be noted that when using your own html and js files that TabSINT may not function as expected. Additionally, errors inside the html and js users generate may be incorrect and error out without the errors propagating back to TabSINT. As a result the customJS response area can be unpredictable, challenging to debug, and used at the developers' own risk. Developers will not be able to leverage Angular or its syntax as the app is compiled ahead of time. This means developers can only rely on html and js code and anything they import themselves. Examples can be found in the built in develop protocol (`src/assets/protocols/develop/protocol.json`) after selecting the `Custom Response Area` subprotocol. These examples provide simple ways to interact with various TabSINT functionality and reviewing the html and js files serves as basic documentation. A brief description of each the html and js files are outlined in Example Usage section below.

When using the customResponseArea, the `window` variable will be updated to contain the `tabsint` property. Note that this property will get overwritten each time you call a customJS response area so user defined variables inside the `tabsint` property may be deleted. As a result we recommend storing variables that need to persist somehwere else. Additionally, `window.tabsint` itself and the following `window.tabsint` variables should never be overwritten from the customJS code as overwritting them would eliminate access to them and potentially cause major issues when running tabsint:

- logger
- resultsService
- examService
- fileService
- resultsModel
- pageModel
- protocolModel
- diskModel
- stateModel

These properties provide access to TabSINT's built in functionality and should be used with caution. In general, the services contain functions and the models contain data. The services typically complement the models. Developers should interact with the models using getters and setters to avoid any data loss. Note that you should use the getter directly before you need the data to avoid any missing data. To determine the getters, setters, and functions provided by the various services and models, develoeprs should look at the TabSINT code for each of them. The exact files are referenced below and the TabSINT code base itself can act as some documentation on when and how to use the functions.

## Models

### Results Model

This model can be used to interact with the TabSINT results to read and/or write to the results from the customJS response area. To view the results, use the following command: `window.tabsint.resultsModel.getResults();`. To set results, use the following command: `window.tabsint.resultsModel.updateCurrentPage({ response: myResponse });`. See `src/app/models/results/results-model.service.ts` and its adjacent interface for more details about how to use the getter and setter for the results model.

### Page Model

The page model contains everything about the current page. To grab information about the page, use the following command: `window.tabsint.pageModel.getPage();`. See `src/app/models/page/page.service.ts` and its adjacent interface for more details. 

### Protocol Model

The protocol model contains everything about the currently loaded protocol. See `src/app/models/protocol/protocol-model.service.ts` for more details.

### Disk Model

This disk model contains all the app variables that persist across opening and closing the app. See `src/app/models/disk/disk.service.ts` for more details.

### State Model

The state model is repsonsible for determining the state of the app. This may be useful for changing the `isSubmittable` parameter to `true` or `false` to control whether the page is submittable. See `src/app/models/state/state.service.ts` for more details.

## Services

### Logger

Logger should be used for "print" statements and usage can be determined from `src/app/services/logger.service.ts`.

### Results Service

This allows control over the results service. See `src/app/controllers/results.service.ts` for more details.

### Exam Service

This allows control over the exam including navigating to the next page and submitting the current page. See `src/app/controllers/exam.service.ts` for more details.

### File Service

This allows control over the file service allowing read and write access. Note that Android enforces scoped storage and you may need to request permissions depending on where are trying to read and/or write. See `src/app/services/file.service.ts` for more details.

## Example Usage

There are four different example html and js files that cover a range of useful functionality. The files can be found at: `src/assets/protocols/develop/custom-response-areas/`

1. Simple example with a button that uses the TabSINT logger and changes the TabSINT results object.
   - `html_basic_example.html` and `js_basic_example.js`
2. Example showing how to change views within the same customJS response area as well as modifying the state variable to prevent submitting the exam until ready.
   - `html_multi_example.html` and `js_multi_example.js`
   - NOTE: Currently a bug is enabling the first page to be submittable when it should not be.
3. Example of how to use our file service to read and write files.
   - `html_file_example.html` and `js_file_example.js`
4. Example showing how to interact with the page and disk variables.
   - `html_disk_example.html` and `js_disk_example.js`
5. Example showing how to interact with previous results and optionally display information.
   - `html_results_example.html` and `js_results_example.js`
