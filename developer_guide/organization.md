# Repository Organization

Below is a brief overview of the TabSINT file structure.

## / Root Directory 

- `/android`: *(not versioned)* Build files created after building the app.
  - `/build/outputs/apk/debug/app-debug.apk`: Debug apk location after building the app.
- `/bin`: Scripts and executables that help you develop and build the app (in development...)
- `/config`: These include `.json` configuration files that can be used to customize your tabsint build (in development...)
- `/custom_plugins`: Custom built cordova plugins that are included into the tabsint build (in development...)
- `/developer_guide`: Resources for developers and contributors.
- `/dist`: The tabsint web application. This is the *web page* that gets packaged by Capacitor as a native mobile application.
- `/node_modules`: *(not versioned)* Packages installed by npm
- `/src`: App source code. Sub-folders are organized to follow the app [architecture](architecture.md) described previously.


[PREVIOUS: Architechture](architecture.md)
[NEXT: Conventions](conventions.md)