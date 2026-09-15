# Notice

Code and documentation Copyright (C) 2015-2026 Creare. Code released under the Apache v2 License, for educational or research purposes (and under a commercial license for other purposes) as provided under TabSINT Licenses.

Creare has used commercially reasonable efforts in preparing the
TabSINT Software but makes no guarantee or warranty of any nature
with regard to its use, performance, or operation.

Creare makes no representations or warranties, and Creare shall
incur no liability or other obligation of any nature whatsoever to
any person from any and all actions arising from the use of this
software. THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
FOR A PARTICULAR PURPOSE ARE HEREBY EXPRESSLY EXCLUDED. The final
responsibility for the proper use and functioning of the TabSINT
Software shall rest solely with the USAMRAA.

## Acknowledgment

This code development was supported by the US Army Medical Research Materiel Command and the Army Public Health Command under SBIR Phase III Awards #W81XWH-13-C-0194, W81XWH-16-C-0160, W81XWH-17-C-0218, W81XWH-16-C-0015, W81XWH-19-C-0175, W81XWH-20-C-0070 to [Creare LLC](www.creare.com). In particular, we gratefully acknowledge the support and contributions of the Audiology and Speech Center at the Walter Reed National Military Medical Center and the Department of Defense Hearing Center of Excellence in the development and extensive testing of this software.

## Privacy Policy

TabSINT is a platform for configuring and administering hearing-related exams, as well as general-purpose questionnaires. As a flexible platform, TabSINT may be configured to automatically collect many types of data, including images, audio, and tablet location. This data can be uploaded to a back end data repository only if configured by a TabSINT Administrator. The TabSINT administrator is responsible for configuring the application, developing and testing the protocol, and managing test results. Data is never transferred outside the application unless configured by the TabSINT administrator, or if TabSINT is configured to upload application logs for debugging purposes.

### Logging

The TabSINT application includes a setting to upload application loags to private server to help debug remote issues. By default, this setting is disabled. If this setting is enabled, the application may record device state, location, network status, or test results in the application log and upload this data to our server. Please ensure logging is set to the desired state before using the application.

If you have questions regarding these policies, please contact tabsint@creare.com.

## Third-Party Licenses

The TabSINT Software relies on many open source libraries.
We recommend you read their licenses, as their terms may differ from the terms described in our [LICENSE](https://github.com/OpenHearing/TabSINT/blob/main/LICENSE).

### Application framework and platform

- Angular — animations, cdk, common, compiler, core, forms, material, platform-browser, platform-browser-dynamic, router (MIT, [angular/angular](https://github.com/angular/angular), [angular/components](https://github.com/angular/components), [angular/angular-cli](https://github.com/angular/angular-cli))
- Capacitor — core, android, ios (MIT, [ionic-team/capacitor](https://github.com/ionic-team/capacitor))
- Capacitor plugins — app, device, filesystem, keyboard, network, screen-orientation (MIT, [ionic-team/capacitor-plugins](https://github.com/ionic-team/capacitor-plugins))
- @capacitor/angular (MIT, [ionic-team/capacitor-angular-toolkit](https://github.com/ionic-team/capacitor-angular-toolkit))
- @capacitor/barcode-scanner (MIT, [ionic-team/capacitor-barcode-scanner](https://github.com/ionic-team/capacitor-barcode-scanner))
- @capacitor/file-transfer (MIT, [ionic-team/capacitor-file-transfer](https://github.com/ionic-team/capacitor-file-transfer))
- @capacitor/filesystem (MIT, [ionic-team/capacitor-filesystem](https://github.com/ionic-team/capacitor-filesystem))
- @capacitor-community/bluetooth-le (MIT, [capacitor-community/bluetooth-le](https://github.com/capacitor-community/bluetooth-le))
- @capacitor-community/sqlite (MIT, [capacitor-community/sqlite](https://github.com/capacitor-community/sqlite))
- jeep-sqlite (MIT, [jepiqueau/jeep-sqlite](https://github.com/jepiqueau/jeep-sqlite))
- RxJS (Apache-2.0, [ReactiveX/rxjs](https://github.com/ReactiveX/rxjs))
- zone.js (MIT, [angular/angular](https://github.com/angular/angular))
- tslib (0BSD, [microsoft/tslib](https://github.com/microsoft/tslib))

### User interface

- Bootstrap (MIT, [twbs/bootstrap](https://github.com/twbs/bootstrap))
- Bootstrap Icons (MIT, [twbs/icons](https://github.com/twbs/icons))
- ng-bootstrap (MIT, [ng-bootstrap/ng-bootstrap](https://github.com/ng-bootstrap/ng-bootstrap))
- Popper (MIT, [floating-ui/floating-ui](https://github.com/floating-ui/floating-ui))
- Ionicons (MIT, [ionic-team/ionicons](https://github.com/ionic-team/ionicons))
- angular-material-icons (MIT, [klarsys/angular-material-icons](https://github.com/klarsys/angular-material-icons))
- material-icons-font (Apache-2.0, [daimoonis/material-icons-font](https://github.com/daimoonis/material-icons-font))
- Roboto and Open Sans fonts (Apache-2.0, bundled under `src/fonts/`)
- angularx-qrcode (MIT, [cordobo/angularx-qrcode](https://github.com/cordobo/angularx-qrcode))
- ngx-json-viewer (MIT, [hivivo/ngx-json-viewer](https://github.com/hivivo/ngx-json-viewer))
- jsonformatter (Apache-2.0, [mohsen1/json-formatter](https://github.com/mohsen1/json-formatter))
- Transloco (MIT, [jsverse/transloco](https://github.com/jsverse/transloco))

### Data, plotting, and utilities

- D3 (ISC, [d3/d3](https://github.com/d3/d3))
- Lodash (MIT, [lodash/lodash](https://github.com/lodash/lodash))
- Ajv (MIT, [ajv-validator/ajv](https://github.com/ajv-validator/ajv))
- Papa Parse (MIT, [mholt/PapaParse](https://github.com/mholt/PapaParse))
- ngx-csv-parser (MIT, [tofiqquadri/ngx-csv-parser](https://github.com/tofiqquadri/ngx-csv-parser))
- SheetJS xlsx (Apache-2.0, [SheetJS/sheetjs](https://github.com/SheetJS/sheetjs))
- buffer (MIT, [feross/buffer](https://github.com/feross/buffer))
- simple-git (MIT, [steveukx/git-js](https://github.com/steveukx/git-js))

### Build tooling

- esbuild (MIT, [evanw/esbuild](https://github.com/evanw/esbuild))
- webpack-subresource-integrity (MIT, [waysact/webpack-subresource-integrity](https://github.com/waysact/webpack-subresource-integrity))
- angular-eslint (MIT, [angular-eslint/angular-eslint](https://github.com/angular-eslint/angular-eslint))

The `tabsintaudio`, `tabsintcha`, and `tabsintfs` Capacitor plugins in this repository are maintained by Creare and are covered by the TabSINT licenses.

Additional files included in the `/node_modules` directory are externally maintained libraries used by this software, which have their own licenses.
