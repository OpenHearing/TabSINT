# Development Environment

## WSL / Linux

To build and develop the TabSINT software, you must set up your local machine with the appropriate developer dependencies.

All the following commands should be run on your WSL machine unless specified otherwise. 

### Install [Git](https://git-scm.com/)

### Install NVM (Node Version Manager)

1. **Install `curl`**: First, ensure you have `curl` installed. Run the following command:
   
    ```bash
    sudo apt install curl
    ```

2. **Download and Install nvm**: Use `curl` to download and install nvm version 0.39.4:

    ```bash
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.4/install.sh | bash
    ```

3. **Load nvm**: To start using `nvm`, add the following lines to your `.bashrc` file:

    ```bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
    ```

4. **Reload .bashrc**: Apply the changes made to `.bashrc`:

    ```bash
    source ~/.bashrc
    ```

5. **Verify nvm Installation**: Confirm that `nvm` is installed correctly by checking its version:

    ```bash
    nvm -v
    ```
  (If nvm -v does not work, try restarting the terminal and trying nvm -v or command -v nvm)

  ### Install Node.js and npm after installing Nvm

1. **Install the Latest Node.js Version**: Use `nvm` to install the latest version of Node.js, which includes npm:

    ```bash
    nvm install node
    ```

2. **Install a Specific Node.js Version**: If your project requires a specific version of Node.js (e.g., 14.18.1), install it using:

    ```bash
    nvm install v22.4.0
    ```

3. **Verify Node.js and npm Installation**: Check the installed versions of Node.js and npm:

    ```bash
    node -v
    npm -v
    ```

4. **Set Default Node.js Version**: Use the installed version:

    ```bash
    nvm use v22.4.0
    ```

By following these steps, you will have nvm, Node.js, and npm installed and properly configured on your system.

### Install Java (OpenJDK 17.0.12)

1. **Install OpenJDK 17**: Use the following command to install OpenJDK 17.0.12:

    ```bash
    sudo apt-get install openjdk-17-jdk
    ```

2. **Verify Java Installation**: Confirm the Java installation by checking its version:

    ```bash
    java -version

3. **Export JAVA_HOME Variable**: Set the `JAVA_HOME` environment variable to the root of the JDK directory. Add the following line to your `.bashrc` file:

    ```bash
    export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
    ```

    After adding the line, reload your `.bashrc` file to apply the changes:

    ```bash
    source ~/.bashrc
    ``` 

You should see output similar to the following:

```text
openjdk 17.0.12 2024-07-16
OpenJDK Runtime Environment (build 17.0.12+7-Ubuntu-1ubuntu220.04)
OpenJDK 64-Bit Server VM (build 17.0.12+7-Ubuntu-1ubuntu220.04, mixed mode, sharing)
```

### Install Android Command Line Tools

1. **Download Command Line Tools**:

    ```bash
    curl https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -o /tmp/cmd-tools.zip
    ```

2. **Create Directory for Android Tools**:

    ```bash
    mkdir -p $HOME/android/cmdline-tools
    ```

3. **Unzip the Downloaded File**:

    ```bash
    unzip /tmp/cmd-tools.zip -d $HOME/android/cmdline-tools
    mv $HOME/android/cmdline-tools/cmdline-tools $HOME/android/cmdline-tools/latest
    rm /tmp/cmd-tools.zip
    ```

4. **Update Your .bashrc File**:

    ```bash
    export ANDROID_HOME="$HOME/android"
    export ANDROID_SDK_ROOT="${ANDROID_HOME}"
    export PATH="${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/tools:${ANDROID_HOME}/tools/bin:${PATH}"
    ```

5. **Reload .bashrc**:

    ```bash
    source ~/.bashrc
    ```

### Install Android Platform Tools, Platforms, and Build Tools (Version 31.0.3)

1. **Download and Install Platform Tools Version 31.0.3**:

    ```bash
    curl https://dl.google.com/android/repository/platform-tools_r31.0.3-linux.zip -o /tmp/platform-tools.zip
    unzip /tmp/platform-tools.zip -d $HOME/android/
    rm /tmp/platform-tools.zip
    ```

2. **Install Platforms and Build Tools Using sdkmanager**:

    ```bash
    sdkmanager "platforms;android-31" "build-tools;31.0.3"
    ```

### Verify the Installation

1. **Check ADB Version**:

    ```bash
    adb version
    ```

    It should look something like this:

    ```
    Android Debug Bridge version 1.0.41
    Version 31.0.3-7562133
    Installed as /home/ppallavalli/android/platform-tools-31.0.3/platform-tools/adb
    ```

2. **Check Build Tools and Platforms**:

    ```bash
    ls $ANDROID_HOME/build-tools/
    ls $ANDROID_HOME/platforms/
    ```

3. **Additional Setup for Windows**:
   
    The ADB platform-tools should be installed on Windows as well. Use the Android Studio Steps in the Windows -> Android section of this document.

4. **Set Up ADB Server on Windows**:

    Once Android is installed properly on Windows, run the following commands in a Windows Terminal:

    ```bash
    adb kill-server
    adb -a nodaemon server
    ```

5. **Connect ADB from WSL**:

    Then run the following commands on WSL:

    ```bash
    export ADB_SERVER_SOCKET=tcp:$(tail -1 /etc/resolv.conf | cut -d' ' -f2):5037 or export ADB_SERVER_SOCKET=<your ip-address>:5037
    adb devices
    ```

    If you have a device connected, it should show up in the list of devices. The export command can be added to your `.bashrc` file if needed, or you can run it when using WSL.


<!-- ### Install ADB 

**Versions need to match from WSL to Windows in order for this to work properly; version currently used 1.0.41**

```bash
mkdir -p /usr/local/android-sdk
cd /usr/local/android-sdk/
curl -OL https://dl.google.com/android/repository/platform-tools-latest-linux.zip
unzip platform-tools-latest-linux.zip 
rm -f platform-tools-latest-linux.zip 
ln -s /usr/local/android-sdk/platform-tools/adb /usr/bin/adb  # it's okay if this one doesn't work
export PATH=/usr/local/android-sdk/platform-tools:${PATH} 
echo "export PATH=/usr/local/android-sdk/platform-tools:${PATH}"
adb version

```
The ADB platform-tools should be installed on Windows as well. Use the Android Studio Steps in the Windows -> Android section of this document.
Once Android is installed properly on windows, run the following commands in a Windows Terminal: 
```bash
adb kill-server
adb -a nodaemon server
```  
Then run the following commands on WSL: 
```bash
export ADB_SERVER_SOCKET=tcp:$(tail -1 /etc/resolv.conf | cut -d' ' -f2):5037
adb devices
```

If you have a device connected it should show up in the list of devices. The export command can be added to your .bashrc file is needed or you can run it when running WSL.

### Repositories
Make sure you have both the tabsint and the cordova-plugin-creare-cha repositories on your machine. 
Setup a `tabsint.json` file in the config folder in tabsint similar to the following: 
```json
{

    "build": "tabsint",
  
    "description": "Official tabsint release for android",
  
    "cordovaPlugins": [
  
      {
  
        "package": "com.creare.cordova.cha",
  
        "src": "/home/<username>/repos/cordova-plugin-creare-cha/"
  
      }
  
    ]
  
}
```
Change the `src` to work with your file path. -->

<!-- ### Install Android build-tools

1. Go here: https://developer.android.com/studio
2. Scroll down to `Command line tools only`
3. Download the linux version
4. Move the zip file into your wsl home directory
5. Make a directory called `android-tools`. (If you need sudo, edit your permissions using chmod. rwe permissions will be needed for building tabsint.)
6. Move the zip file into the `android-tools` directory
7. Make a `build-tools` directory inside the `android-tools` directory

```bash
sudo unzip commandlinetools-linux-9477386_latest.zip
sudo rm commandlinetools-linux-9477386_latest.zip
cd cmdline-tools/bin
sudo bash sdkmanager --install "platform-tools" "platforms;android-32" "build-tools;32.0.0" --sdk_root=.
sudo bash sdkmanager --licenses --sdk_root=.
mv ~/android-tools/cmdline-tools/bin/build-tools/32.0.0 ~/android-tools/build-tools/32.0.0
cp -R ~/android-tools/cmdline-tools/bin/licenses ~/android-tools/
```
### Add exports to the end of your .bashrc file with `sudo nano ~/.bashrc`; make sure to change the paths accordingly

```bash
export ANDROID_HOME="/home/<username>/android-tools"
export ANDROID_SDK_ROOT="/home/<username>/android-tools"
export PLATFORM_TOOLS="/usr/local/android-sdk/platform-tools"
export JAVA_HOME="/usr/lib/jvm/java-1.11.0-openjdk-amd64/"
export PATH="$ANDROID_HOME/cmdline-tools:$ANDROID_HOME/cmdline-tools/bin:$PLATFORM_TOOLS:$JAVA_HOME:$PATH"
``` -->
### Gradle

Install Gradle using 'apt install gradle'

## Windows

To build and develop the TabSINT software, you must set up your local machine with the appropriate developer dependencies.

Confirm you have the following tools:

- [Git](https://git-scm.com/)
- [Node](https://nodejs.org/)
  - Make sure global `node_modules` directory is on your system path
  - **Node** comes with a command line package manager `npm`
  - Currently requires Node 14.x (14.18.1 as of Tabsint v4.5.0)

**NOTE: When installing Git for Windows, I had to add a couple extra things to my path, per this [stackoverflow post](https://stackoverflow.com/a/50833818). When installing Node, select the Current version. Do not install the LTS version.**

## Setting up TabSINT and its Dependencies

Once you have the required tools, clone this git repository somewhere on your local machine and enter the `tabsint` directory. If you are uncomfortable using git from the command line, we recommend [SourceTree](https://www.sourcetreeapp.com/).

From the `tabsint` directory, run the following command to install dependencies (npm modules and bower components):

```bash
$ npm install
```

At this point, you are ready to serve the app locally in the browser for testing.

### Tablet Dependencies

A few extra tools are necessary to build the app for mobile devices:

#### Android

To build an android package you need the following tools:

- [JAVA JDK](http://www.oracle.com/technetwork/java/javase/downloads/index.html)
  - Currently requires Java JDK 17.0.12
  - Confirm that you have the environment variable `JAVA_HOME` set to be the root of the JDK directory (i.e. `C:\Program Files\Java\jdkx.x.x`)
  - **NOTE: Oracle's download page seems broken (October 26, 2020), so I used [this](https://adoptopenjdk.net/?variant=openjdk8&jvmVariant=hotspot) to install the JDK**
- [Android Studio](https://developer.android.com/sdk/index.html)
  - Note down the path where the Android SDK is installed
  - Make sure the following directories within the Android SDK root directory are on your system path:
    - `[path-to-sdk]/tools/`
    - `[path-to-sdk]/platform-tools/`
    - `[path-to-sdk]/build-tools/[sdk-version]/` where `[sdk-version]` is the SDK version you have installed (32 as of TabsINT v4.5.0).
    - **NOTE: if using the Android Studio (Windows) sdkmanager to install the tools, platform-tools and build-tools, the installed files might be found in the C:\Users\User\AppData\Local\Android\Sdk directory. To fix this issue I copied these folders to my C:\Program Files\Android\Android Studio directory.**
- [Gradle](https://gradle.org/install/)
  - Current version on continuous integration jobs is 7.3.3.
  - Note down the path where Gradle is installed
  - Make sure the bin directory within your Gradle installation is on your system path.
- As of Android 12, `ANDROID_HOME` is now the preferred environment variable, and not `ANDROID_SDK_ROOT`. Depending on your environment, you may need to define these.

#### iOS

To build an iOS package, you must be developing on a mac with the current build of XCode. Additionally, you should ensure that you have the XCode command-line-tools. Get them by entering the following into a Terminal:

```bash
$ xcode-select --install
```

Cordova may have additional requirements. To find these and how to satisfy them, type the following into the Terminal:

```bash
$ npm run cordova -- requirements
```
