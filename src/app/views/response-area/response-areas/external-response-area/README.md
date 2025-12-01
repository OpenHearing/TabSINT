This is a WIP guide for how to use external response areas.



Select TabSINT functionality is available to be accessed via the window. 


The following window.tabsint variables should NOT be set to avoid issues:
- logger
- results
- examService

Logger should be used for "print" statements and usage can be determined from `src/app/services/logger.service.ts`.
You will need to know the structure of the TabSINT results in order to add / read from it for the custom external response area.