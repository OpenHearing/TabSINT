# Building and Running

TabSINT can be run on both a browser and tablet using `npm` build scripts. 
<!-- The build of TabSINT can be customized using a config file in the `/config` directory.  -->

## NPM Scripts

The **npm** package manager allows you to write custom scripts that can access the shell utilities available in the `node_modules/.bin` directory.  You can run these scripts by typing into the command line:

```bash
$ npm run [script name]
```

The scripts are defined in the `scripts` section of [`package.json`](../package.json). 
For more information, please see [NPM Scripts](https://docs.npmjs.com/misc/scripts).

<!-- ## Config Files

To customize your build of TabSINT, you can include your own config file in the `/config` directory.
The config file must conform to the [`config_schema.json`](../config/config_schema.json) in the tabsint repository.

To use your own config file while building tabsint, use the npm script:

```
$ npm run set-config [config filename]
```

Here is an example config, based on the example config in `/config/example_config.json`):

``` json
{
  "build": "build",
  "platform":"android",
  "description": "this is my build of tabsint",
  "gitlab": {
    "host": "https://gitlab.com/",
    "namespace":"group",
    "token": "private-token"
  }
}
```


You would add this to your project by running:

```
$ npm run set-config example_config
```


### Version Controlling Config Files

All files except `example_config.json` and `config_schema.json` in the `/config` directory are currently ignore by git. 
If you would like to version control config files (which is generally a good idea), the tabsint build scripts will also look for config files in the `config` directory of the path defined by an environment variable `TABSINT_ADMIN`.

For example, on a Linux or Mac machine, you can define the `TABSINT_ADMIN` environment variable to be equivalent to the path `/Users/creare/tabsint-admin` in your `.bash_profile`:

```bash
alias TABSINT_ADMIN="/Users/creare/tabsint-admin"
```


To refer to this environment variable instead of your local `/config` directory, use the flag `--tabsintadmin` when running `set-project`:

```
$ npm run set-project [config filename] --tabsintadmin
```

You could now put config files in the directory `Users/creare/tabsint-admin/config/` (i.e. `Users/creare/tabsint-admin/config/[config filename].json`) and the tabsint build scripts will be able to use these files.

[Environment variables](https://www.digitalocean.com/community/tutorials/how-to-read-and-set-environmental-and-shell-variables-on-a-linux-vps) can be defined on the command line or using a GUI like [Rapid Environment Editor](http://www.rapidee.com/en/download) (windows only).   -->

## Build in a Browser

You can build and debug TabSINT in a browser on your computer. 
Once you have set up your [development environment](dev-env.md), run the following command from the root of the tabsint repository:

```bash
$ ng serve
```
or:

```bash
$ npm run start
```

For debugging purposes, you can use the [Chrome Developer Tools](https://developer.chrome.com/devtools).
Be aware that browser caching can cause the browser not to see local changes.
We recommend using a private browser (i.e. Mozilla Private Window or Google Chrome Incognito) and turning off browser caching while debugging.

## On a Tablet

You can build the app for a mobile device and push it using the tabsint build tools. From the root directory, run the following command on the command line:

```bash
$ npm run run.android
```

**NOTE: I had an issue with Gradle heap size, which I resolved via [stackoverflow](https://stackoverflow.com/a/31760855)**

### Connect Device to Computer

Before you can push apps to the tablet, you must connect to your device using `adb` (android debug bridge):

- Your tablet must have [USB Debugging enabled via the Developer Options](https://developers.google.com/web/tools/chrome-devtools/remote-debugging/).
- (Optional) You may need to ensure that your device is in MTP mode. In settings/storage, tap the top right (three blocks stacked vertically in the header bar) then tap *USB computer connection*.  Make sure Media device (MTP) is checked.
- In the command line, type `adb devices`.  If this is the first time calling adb in this command window, the adb daemon will load. After the daemon is loaded, you should see your device listed. If you are having trouble, try to cycle `MTP` and `USB debugging` off then back on.

*Windows Users*:

To check if your Android device is correctly connected, connect your device(s) by USB, open a command prompt, and enter the command `adb devices`. 
Your USB-connected devices should be displayed.

If the device is not displayed, Windows may be missing the correct Android ADB driver. 
Here are some steps to correct the issue:

1. You should enable USB debugging in the `Android settings -> Developer options -> USB debugging`.
2. Open `Device Manager`
3. Open MTP USB device and navigate to `Hardware` tab
4. Select the malfunctioning driver (should have a triangular yellow warning icon) and click `Properties`.
5. Allow Windows to fix automatically (on Windows >= 7)
6. Open a command prompt, and type `adb devices`. Your device will now be listed.

### Debug TabSINT on Device

Once connected, you can use the Chrome developer tools to debug TabSINT on the device.  Go to `chrome://inspect/#devices`, then open the TabSINT option.


[PREVIOUS: Development Environment](development-environment.md)
[NEXT: Architechture](architecture.md)