This is a WIP guide for how to use external response areas.



Select TabSINT functionality is available to be accessed via the window. 

When using the externalResponseArea, the `window` variable will be updated to contain the `tabsint` property. Note that this property will get overwritten each time you call an external response area so user defined variables inside the `tabsint` property may be deleted. Additionally, the following `window.tabsint` variables should never be set to avoid issues:
- logger
- resultsService
- examService
- fileService
- resultsModel
- pageModel
- protocolModel
- diskModel
- stateModel

These properties provide access to TabSINTs built in functionality and should be used with caution. In general, the services contain functions and the models contain data. The services typically compliment the models. It should be noted that the models should be interacted with using getters and setters to avoid any data loss. We recommend looking at the specific models to see what the getter and setter functions look like.

# Models

## Results Model
This includes the model and the service. You will need to know the structure of the TabSINT results in order to add / read from it for the custom external response area. To set results, you will also need to do something like this:

`window.tabsint.resultsModel.updateCurrentPage({ response: myResponse });`

See `src/app/models/results/results-model.service.ts` for more details about how to use the getter and setter for the results model.

## Page Model
The page model contains everything about the current page. See `src/app/models/page/page.service.ts` for more details.

## Protocol Model
The protocol model contains everything about the currently loaded protocol. See `src/app/models/protocol/protocol-model.service.ts` for more details.


## Disk Model
This disk model contains all the app variables that persist across opening and closing the app. See `src/app/models/disk/disk.service.ts` for more details.

## State Model
The state model is repsonsible for determining the state of the app. This may be useful for changing the `isSubmittable` parameter to `true` or `false` to control whether the page is submittable. See `src/app/models/state/state.service.ts` for more details.


# Services

## Logger 
Logger should be used for "print" statements and usage can be determined from `src/app/services/logger.service.ts`.

## Results Service
This allows control over the results service. See `src/app/controllers/results.service.ts` for more details.

## Exam Service

This allows control over the exam including navigating to the next page and submitting the current page. See `src/app/controllers/exam.service.ts` for more details.

## File Service

This allows control over the file service allowing read and write access. Note that Android enforces scoped storage and you may need to request permissions depending on where are trying to read and/or write. See `src/app/services/file.service.ts` for more details.



TODO: 
- [ ] test with multi page protocol as one exam
- [ ] test with multi page protocol as multiple exams
- [ ] test reading and writing
- [x] test interacting with results
- [ ] test interacting with protocol, displaying parameters
- [ ] test setting something to disk


wrap eval in try catch?
    what happens if eval errors, what happens if the code eval runs errors?