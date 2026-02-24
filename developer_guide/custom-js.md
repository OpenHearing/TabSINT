# User Guide

This is a WIP guide for how to use customJS response areas. This customJS response area framework allows users to input their own html and js files to be injected into TabSINT. It should be noted that when using your own html and js files that TabSINT may not function as expected. Additionally, errors inside the html and js users generate may be incorrect and error out without the errors propagating back to TabSINT. As a result the customJS response area can be unpredictable, challenging to debug, and used at the developers' own risk.

Examples are outlined and provided after a brief explanation of the exposed TabSINT functionality.

When using the customResponseArea, the `window` variable will be updated to contain the `tabsint` property. Note that this property will get overwritten each time you call a customJS response area so user defined variables inside the `tabsint` property may be deleted. Additionally, the following `window.tabsint` variables should never be overwritten from the customJS code as overwritting them would eliminate access to them and cause major issues running tabsint:

- logger
- resultsService
- examService
- fileService
- resultsModel
- protocolModel
- diskModel
- stateModel

These properties provide access to TabSINT's built in functionality and should be used with caution. In general, the services contain functions and the models contain data. The services typically complement the models. Interact with the models using getters and setters to avoid any data loss. Inspect the specific models to view their getter and setter functions.

## Models

### Results Model

Review the structure of the TabSINT results (see `results-model.service.ts`) to read from it in the customJS response area. To set results, use the following command:

`window.tabsint.resultsModel.updateCurrentPage({ response: myResponse });`

See `src/app/models/results/results-model.service.ts` for more details about how to use the getter and setter for the results model.

### Page Model

The page model contains everything about the current page. See `src/app/models/page/page.service.ts` for more details.

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
