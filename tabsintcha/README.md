# Tabsintcha

Creare CHA Device Communication Plugin

The application implementing the plugin needs to specify the following runtime permissions in the Android Manifest.
This is a requirement for using the plugin.

- BLUETOOTH_CONNECT
- BLUETOOTH_SCAN
- BLUETOOTH_ADVERTISE
- ACCESS_COARSE_LOCATION
- ACCESS_FINE_LOCATION

## Install

```bash
npm install tabsintcha
npx cap sync
```

## API

<docgen-index>

* [`addListener(string, ...)`](#addlistenerstring-)
* [`removeAllListeners()`](#removealllisteners)
* [`checkPermissions(...)`](#checkpermissions)
* [`requestPermissions(...)`](#requestpermissions)
* [`getDeviceDiscoveryEventName(...)`](#getdevicediscoveryeventname)
* [`getDeviceResponseEventName(...)`](#getdeviceresponseeventname)
* [`getBluetoothAdapterState(...)`](#getbluetoothadapterstate)
* [`setBluetoothAdapterState(...)`](#setbluetoothadapterstate)
* [`getBuildVersion(...)`](#getbuildversion)
* [`startChaSearch(...)`](#startchasearch)
* [`cancelChaSearch(...)`](#cancelchasearch)
* [`connect(...)`](#connect)
* [`disconnect(...)`](#disconnect)
* [`requestAssociatedA2DP(...)`](#requestassociateda2dp)
* [`startListener(...)`](#startlistener)
* [`stopListener(...)`](#stoplistener)
* [`requestCalibrationList(...)`](#requestcalibrationlist)
* [`requestCalibrationEntry(...)`](#requestcalibrationentry)
* [`startCalibrationWrite(...)`](#startcalibrationwrite)
* [`requestId(...)`](#requestid)
* [`requestProbeId(...)`](#requestprobeid)
* [`requestStatus(...)`](#requeststatus)
* [`queueExam(...)`](#queueexam)
* [`examSubmission(...)`](#examsubmission)
* [`setSoftwareButtonState(...)`](#setsoftwarebuttonstate)
* [`abortExams(...)`](#abortexams)
* [`requestResults(...)`](#requestresults)
* [`requestSdBytesFree(...)`](#requestsdbytesfree)
* [`reprogram(...)`](#reprogram)
* [`reboot(...)`](#reboot)
* [`shutdown(...)`](#shutdown)
* [`deleteFile(...)`](#deletefile)
* [`startFileWrite(...)`](#startfilewrite)
* [`startFileRead(...)`](#startfileread)
* [`requestDirectory(...)`](#requestdirectory)
* [`getLfnFromSfn(...)`](#getlfnfromsfn)
* [`makeDirectory(...)`](#makedirectory)
* [`cancelFileOperation(...)`](#cancelfileoperation)
* [`format(...)`](#format)
* [`a2dpIsPaired(...)`](#a2dpispaired)
* [`a2dpIsConnected(...)`](#a2dpisconnected)
* [`a2dpBeginPairing(...)`](#a2dpbeginpairing)
* [`a2dpUnpair(...)`](#a2dpunpair)
* [`a2dpBeginConnection(...)`](#a2dpbeginconnection)
* [`a2dpDisconnect(...)`](#a2dpdisconnect)
* [`noiseFeatureStart(...)`](#noisefeaturestart)
* [`noiseFeaturePause(...)`](#noisefeaturepause)
* [`noiseFeatureResume(...)`](#noisefeatureresume)
* [`noiseFeatureStop(...)`](#noisefeaturestop)
* [`noiseFeatureChangeLevel(...)`](#noisefeaturechangelevel)
* [`requestSetting(...)`](#requestsetting)
* [`writeSetting(...)`](#writesetting)
* [`requestExamId(...)`](#requestexamid)
* [Interfaces](#interfaces)
* [Type Aliases](#type-aliases)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### addListener(string, ...)

```typescript
addListener(eventName: string, listenerFunc: ListenerCallback) => Promise<PluginListenerHandle>
```

Add a listener for plugin events.

| Param              | Type                                                          | Description                          |
| ------------------ | ------------------------------------------------------------- | ------------------------------------ |
| **`eventName`**    | <code>string</code>                                           | The name of the event to listen for. |
| **`listenerFunc`** | <code><a href="#listenercallback">ListenerCallback</a></code> | The listener function for the event. |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code>

--------------------


### removeAllListeners()

```typescript
removeAllListeners() => Promise<void>
```

Remove all listeners for plugin events.

--------------------


### checkPermissions(...)

```typescript
checkPermissions(options: object) => Promise<PermissionStatus>
```

Get the current status of permissions in the plugin.

| Param         | Type                | Description  |
| ------------- | ------------------- | ------------ |
| **`options`** | <code>object</code> | Empty Object |

**Returns:** <code>Promise&lt;<a href="#permissionstatus">PermissionStatus</a>&gt;</code>

--------------------


### requestPermissions(...)

```typescript
requestPermissions(options: object) => Promise<PermissionStatus>
```

Prompts the end user for permission to use the platform APIs that the plugin requires.

| Param         | Type                | Description  |
| ------------- | ------------------- | ------------ |
| **`options`** | <code>object</code> | Empty Object |

**Returns:** <code>Promise&lt;<a href="#permissionstatus">PermissionStatus</a>&gt;</code>

--------------------


### getDeviceDiscoveryEventName(...)

```typescript
getDeviceDiscoveryEventName(options: object) => Promise<{ value: string; }>
```

Get the device discovery event name needed for creating listeners for device searches.

| Param         | Type                | Description  |
| ------------- | ------------------- | ------------ |
| **`options`** | <code>object</code> | Empty Object |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### getDeviceResponseEventName(...)

```typescript
getDeviceResponseEventName(options: object) => Promise<{ value: string; }>
```

Get the device response event name needed for creating listeners for device responses.

| Param         | Type                | Description  |
| ------------- | ------------------- | ------------ |
| **`options`** | <code>object</code> | Empty Object |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### getBluetoothAdapterState(...)

```typescript
getBluetoothAdapterState(options: object) => Promise<{ value: string; }>
```

Query state of the Bluetooth adapter.

| Param         | Type                | Description  |
| ------------- | ------------------- | ------------ |
| **`options`** | <code>object</code> | Empty Object |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### setBluetoothAdapterState(...)

```typescript
setBluetoothAdapterState(options: SetBluetoothAdapterStateOptions) => Promise<{ value: string; }>
```

Enable/disable the Bluetooth adapter.

| Param         | Type                                                                                        | Description                                                                        |
| ------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **`options`** | <code><a href="#setbluetoothadapterstateoptions">SetBluetoothAdapterStateOptions</a></code> | See <a href="#setbluetoothadapterstateoptions">SetBluetoothAdapterStateOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### getBuildVersion(...)

```typescript
getBuildVersion(options: object) => Promise<{ value: string; }>
```

Get the build version of the CHA device.

| Param         | Type                | Description  |
| ------------- | ------------------- | ------------ |
| **`options`** | <code>object</code> | Empty Object |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### startChaSearch(...)

```typescript
startChaSearch(options: StartChaSearchOptions) => Promise<{ value: string; }>
```

Begin discovery of available CHAs.  This will continue until cancelled.
The messages can be observed using PluginName.addListener('TabsintChaDiscovery', callback).
The discovery will first check if permissions are available before continuing with the search.

| Param         | Type                                                                    | Description                                                    |
| ------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| **`options`** | <code><a href="#startchasearchoptions">StartChaSearchOptions</a></code> | See <a href="#startchasearchoptions">StartChaSearchOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### cancelChaSearch(...)

```typescript
cancelChaSearch(options: object) => Promise<{ value: string; }>
```

Abort discovery process.

| Param         | Type                | Description  |
| ------------- | ------------------- | ------------ |
| **`options`** | <code>object</code> | Empty Object |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### connect(...)

```typescript
connect(options: NameOptions) => Promise<{ value: string; }>
```

Connect to the specified CHA device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### disconnect(...)

```typescript
disconnect(options: NameOptions) => Promise<{ value: string; }>
```

Disconnect from the specified CHA device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### requestAssociatedA2DP(...)

```typescript
requestAssociatedA2DP(options: NameOptions) => Promise<{ value: string; }>
```

Request an A2DP interface to the CHA, that is associated with this CHA.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### startListener(...)

```typescript
startListener(options: NameOptions) => Promise<{ value: string; }>
```

Add a listener to receive notifications when events occur for the specified CHA device.
The messages can be observed using PluginName.addListener('TabsintChaDevice', callback)

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### stopListener(...)

```typescript
stopListener(options: NameOptions) => Promise<{ value: string; }>
```

Remove the listener for the specified CHA device to stop receiving notifications for it.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### requestCalibrationList(...)

```typescript
requestCalibrationList(options: NameOptions) => Promise<{ value: string; }>
```

Request the list of available calibrations from the specified CHA device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### requestCalibrationEntry(...)

```typescript
requestCalibrationEntry(options: RequestCalibrationEntryOptions) => Promise<{ value: string; }>
```

Request the indexed section of the calibration entry from the specified CHA device.

| Param         | Type                                                                                      | Description                                                                      |
| ------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **`options`** | <code><a href="#requestcalibrationentryoptions">RequestCalibrationEntryOptions</a></code> | See <a href="#requestcalibrationentryoptions">RequestCalibrationEntryOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### startCalibrationWrite(...)

```typescript
startCalibrationWrite(options: StartCalibrationWriteOptions) => Promise<{ value: string; }>
```

Begin writing a calibration entry to a specified CHA device.

| Param         | Type                                                                                  | Description                                                                  |
| ------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| **`options`** | <code><a href="#startcalibrationwriteoptions">StartCalibrationWriteOptions</a></code> | See <a href="#startcalibrationwriteoptions">StartCalibrationWriteOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### requestId(...)

```typescript
requestId(options: NameOptions) => Promise<{ value: string; }>
```

Request the ID information of the specified CHA device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### requestProbeId(...)

```typescript
requestProbeId(options: NameOptions) => Promise<{ value: string; }>
```

Request the ID information of the attached probe for the specified CHA device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### requestStatus(...)

```typescript
requestStatus(options: NameOptions) => Promise<{ value: string; }>
```

Request the status information of the specified CHA device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### queueExam(...)

```typescript
queueExam(options: QueueExamOptions) => Promise<{ value: string; }>
```

Add the exam object to a specified CHA device's queue.

| Param         | Type                                                          | Description                                          |
| ------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| **`options`** | <code><a href="#queueexamoptions">QueueExamOptions</a></code> | See <a href="#queueexamoptions">QueueExamOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### examSubmission(...)

```typescript
examSubmission(options: ExamSubmissionOptions) => Promise<{ value: string; }>
```

Send user input for the current exam to a specified CHA device.

| Param         | Type                                                                    | Description                                                    |
| ------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| **`options`** | <code><a href="#examsubmissionoptions">ExamSubmissionOptions</a></code> | See <a href="#examsubmissionoptions">ExamSubmissionOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### setSoftwareButtonState(...)

```typescript
setSoftwareButtonState(options: SetSoftwareButtonStateOptions) => Promise<{ value: string; }>
```

Set the state of the software button for a specified CHA device.

| Param         | Type                                                                                    | Description                                                                    |
| ------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **`options`** | <code><a href="#setsoftwarebuttonstateoptions">SetSoftwareButtonStateOptions</a></code> | See <a href="#setsoftwarebuttonstateoptions">SetSoftwareButtonStateOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### abortExams(...)

```typescript
abortExams(options: NameOptions) => Promise<{ value: string; }>
```

Cancel all exams queued for the specified CHA device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### requestResults(...)

```typescript
requestResults(options: NameOptions) => Promise<{ value: string; }>
```

Request the results for an exam from the specified CHA device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### requestSdBytesFree(...)

```typescript
requestSdBytesFree(options: NameOptions) => Promise<{ value: string; }>
```

Request the available SD space in bytes from the specified CHA device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### reprogram(...)

```typescript
reprogram(options: ReprogramOptions) => Promise<{ value: string; }>
```

Request the specified CHA device to reprogram its firmware based on file 'CHA_PROG.DAT', which should already be on its media.
The CRC32 value will be checked against the CHA computed CRC32 and reject the reprogram if they do not match.

| Param         | Type                                                          | Description                                          |
| ------------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| **`options`** | <code><a href="#reprogramoptions">ReprogramOptions</a></code> | See <a href="#reprogramoptions">ReprogramOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### reboot(...)

```typescript
reboot(options: NameOptions) => Promise<{ value: string; }>
```

Reboot the specified CHA device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### shutdown(...)

```typescript
shutdown(options: NameOptions) => Promise<{ value: string; }>
```

Shutdown the specified CHA device.
The command is ignored for USB connected devices.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### deleteFile(...)

```typescript
deleteFile(options: DeleteFileOptions) => Promise<{ value: string; }>
```

Delete a file from a specified CHA device.
The directory is relative to the USER directory.

| Param         | Type                                                            | Description                                            |
| ------------- | --------------------------------------------------------------- | ------------------------------------------------------ |
| **`options`** | <code><a href="#deletefileoptions">DeleteFileOptions</a></code> | See <a href="#deletefileoptions">DeleteFileOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### startFileWrite(...)

```typescript
startFileWrite(options: StartFileWriteOptions) => Promise<{ value: string; }>
```

Begin writing a file to the specified CHA device.

| Param         | Type                                                                    | Description                                                    |
| ------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| **`options`** | <code><a href="#startfilewriteoptions">StartFileWriteOptions</a></code> | See <a href="#startfilewriteoptions">StartFileWriteOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### startFileRead(...)

```typescript
startFileRead(options: StartFileReadOptions) => Promise<{ value: string; }>
```

Begin reading a file from the specified CHA device.

| Param         | Type                                                                  | Description                                                  |
| ------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| **`options`** | <code><a href="#startfilereadoptions">StartFileReadOptions</a></code> | See <a href="#startfilereadoptions">StartFileReadOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### requestDirectory(...)

```typescript
requestDirectory(options: RequestDirectoryOptions) => Promise<{ value: string; }>
```

Request the specified CHA device transmits the contents of a directory.

| Param         | Type                                                                        | Description                                                        |
| ------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **`options`** | <code><a href="#requestdirectoryoptions">RequestDirectoryOptions</a></code> | See <a href="#requestdirectoryoptions">RequestDirectoryOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### getLfnFromSfn(...)

```typescript
getLfnFromSfn(options: GetLfnFromSfnOptions) => Promise<{ value: string; }>
```

Convert the short file name returned by the directory function into a long file name for the specified CHA device.

| Param         | Type                                                                  | Description                                                  |
| ------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| **`options`** | <code><a href="#getlfnfromsfnoptions">GetLfnFromSfnOptions</a></code> | See <a href="#getlfnfromsfnoptions">GetLfnFromSfnOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### makeDirectory(...)

```typescript
makeDirectory(options: MakeDirectoryOptions) => Promise<{ value: string; }>
```

Create a directory on the specified CHA device.

| Param         | Type                                                                  | Description                                                  |
| ------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ |
| **`options`** | <code><a href="#makedirectoryoptions">MakeDirectoryOptions</a></code> | See <a href="#makedirectoryoptions">MakeDirectoryOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### cancelFileOperation(...)

```typescript
cancelFileOperation(options: NameOptions) => Promise<{ value: string; }>
```

Cancel an ongoing streamable operations on the specified CHA device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### format(...)

```typescript
format(options: NameOptions) => Promise<{ value: string; }>
```

Command the specified CHA device to format its SD card.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### a2dpIsPaired(...)

```typescript
a2dpIsPaired(options: NameOptions) => Promise<{ value: string; }>
```

Whether the specified A2DP device is paired or not.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### a2dpIsConnected(...)

```typescript
a2dpIsConnected(options: NameOptions) => Promise<{ value: string; }>
```

Whether the specified A2DP device is connected or not.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### a2dpBeginPairing(...)

```typescript
a2dpBeginPairing(options: NameOptions) => Promise<{ value: string; }>
```

Begin pairing the specified A2DP device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### a2dpUnpair(...)

```typescript
a2dpUnpair(options: NameOptions) => Promise<{ value: string; }>
```

Unpair the specified A2DP device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### a2dpBeginConnection(...)

```typescript
a2dpBeginConnection(options: NameOptions) => Promise<{ value: string; }>
```

Begin connection to the specified A2DP device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### a2dpDisconnect(...)

```typescript
a2dpDisconnect(options: NameOptions) => Promise<{ value: string; }>
```

Disconnect to the specified A2DP device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### noiseFeatureStart(...)

```typescript
noiseFeatureStart(options: NoiseFeatureStartOptions) => Promise<{ value: string; }>
```

Start playback of noise for the specified CHA device.

| Param         | Type                                                                          | Description                                                          |
| ------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **`options`** | <code><a href="#noisefeaturestartoptions">NoiseFeatureStartOptions</a></code> | See <a href="#noisefeaturestartoptions">NoiseFeatureStartOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### noiseFeaturePause(...)

```typescript
noiseFeaturePause(options: NameOptions) => Promise<{ value: string; }>
```

Pause the playback of noise for the specified CHA device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### noiseFeatureResume(...)

```typescript
noiseFeatureResume(options: NameOptions) => Promise<{ value: string; }>
```

Resume the playback of noise for the specified CHA device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### noiseFeatureStop(...)

```typescript
noiseFeatureStop(options: NameOptions) => Promise<{ value: string; }>
```

Stop the playback of noise for the specified CHA device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### noiseFeatureChangeLevel(...)

```typescript
noiseFeatureChangeLevel(options: NoiseFeatureChangeLevelOptions) => Promise<{ value: string; }>
```

Change the volume of the background noise without interrupting playback for the specified CHA device.

| Param         | Type                                                                                      | Description                                                                      |
| ------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **`options`** | <code><a href="#noisefeaturechangeleveloptions">NoiseFeatureChangeLevelOptions</a></code> | See <a href="#noisefeaturechangeleveloptions">NoiseFeatureChangeLevelOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### requestSetting(...)

```typescript
requestSetting(options: RequestSettingOptions) => Promise<{ value: string; }>
```

Request a setting by its index in the setting table from the specified CHA device.

| Param         | Type                                                                    | Description                                                    |
| ------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| **`options`** | <code><a href="#requestsettingoptions">RequestSettingOptions</a></code> | See <a href="#requestsettingoptions">RequestSettingOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### writeSetting(...)

```typescript
writeSetting(options: WriteSettingOptions) => Promise<{ value: string; }>
```

Write a setting by its index in the setting table to the specified CHA device.

| Param         | Type                                                                | Description                                                |
| ------------- | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| **`options`** | <code><a href="#writesettingoptions">WriteSettingOptions</a></code> | See <a href="#writesettingoptions">WriteSettingOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### requestExamId(...)

```typescript
requestExamId(options: NameOptions) => Promise<{ value: string; }>
```

Request the current exam id from the specified CHA device.

| Param         | Type                                                | Description                                |
| ------------- | --------------------------------------------------- | ------------------------------------------ |
| **`options`** | <code><a href="#nameoptions">NameOptions</a></code> | See <a href="#nameoptions">NameOptions</a> |

**Returns:** <code>Promise&lt;{ value: string; }&gt;</code>

--------------------


### Interfaces


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |


#### PermissionStatus

| Prop            | Type                                                        | Description                  |
| --------------- | ----------------------------------------------------------- | ---------------------------- |
| **`bluetooth`** | <code><a href="#permissionstate">PermissionState</a></code> | Bluetooth permission status. |


#### SetBluetoothAdapterStateOptions

| Prop           | Type                | Description                                              |
| -------------- | ------------------- | -------------------------------------------------------- |
| **`newState`** | <code>string</code> | The new state for the bluetooth adapter ("on" or "off"). |


#### StartChaSearchOptions

| Prop         | Type                | Description                                                                                             |
| ------------ | ------------------- | ------------------------------------------------------------------------------------------------------- |
| **`infStr`** | <code>string</code> | The CHA interface argument for the search. This indicates the type of connection to search for devices. |


#### NameOptions

| Prop       | Type                | Description          |
| ---------- | ------------------- | -------------------- |
| **`name`** | <code>string</code> | The CHA device name. |


#### RequestCalibrationEntryOptions

| Prop        | Type                | Description                                    |
| ----------- | ------------------- | ---------------------------------------------- |
| **`index`** | <code>number</code> | The index for the calibration entry to stream. |


#### StartCalibrationWriteOptions

| Prop              | Type                | Description                                                 |
| ----------------- | ------------------- | ----------------------------------------------------------- |
| **`index`**       | <code>number</code> | The index of the calibration to write to.                   |
| **`entry`**       | <code>object</code> | The description used the calibration list.                  |
| **`dataArgs`**    | <code>object</code> | The calibration data arguments.                             |
| **`speakerArgs`** | <code>object</code> | Speaker data arguments to be added to the calibration data. |


#### QueueExamOptions

| Prop           | Type                | Description                    |
| -------------- | ------------------- | ------------------------------ |
| **`examName`** | <code>string</code> | The name of the exam to queue. |
| **`params`**   | <code>object</code> | The parameters for the exam.   |


#### ExamSubmissionOptions

| Prop                 | Type                | Description                             |
| -------------------- | ------------------- | --------------------------------------- |
| **`submissionName`** | <code>string</code> | The name of the exam submission.        |
| **`params`**         | <code>object</code> | The parameters for the exam submission. |


#### SetSoftwareButtonStateOptions

| Prop        | Type                | Description                                              |
| ----------- | ------------------- | -------------------------------------------------------- |
| **`state`** | <code>number</code> | The new state of the software button to be set (0 or 1). |


#### ReprogramOptions

| Prop        | Type                | Description                                                                |
| ----------- | ------------------- | -------------------------------------------------------------------------- |
| **`crc32`** | <code>number</code> | The CRC32 checksum value to be used for validation in a reprogram request. |


#### DeleteFileOptions

| Prop             | Type                | Description                                  |
| ---------------- | ------------------- | -------------------------------------------- |
| **`remoteFile`** | <code>string</code> | The remote file on the device to be deleted. |
| **`flags`**      | <code>number</code> | Modification flags for request.              |


#### StartFileWriteOptions

| Prop             | Type                | Description                                   |
| ---------------- | ------------------- | --------------------------------------------- |
| **`localFile`**  | <code>string</code> | The path to the file on the device to create. |
| **`remoteFile`** | <code>string</code> | The path on the CHA to read.                  |
| **`flags`**      | <code>number</code> | Modification flags for request.               |


#### StartFileReadOptions

| Prop             | Type                | Description                                   |
| ---------------- | ------------------- | --------------------------------------------- |
| **`localFile`**  | <code>string</code> | The path to the file on the device to create. |
| **`remoteFile`** | <code>string</code> | The path on the CHA to read.                  |


#### RequestDirectoryOptions

| Prop             | Type                | Description                       |
| ---------------- | ------------------- | --------------------------------- |
| **`remotePath`** | <code>string</code> | The directory on the CHA to read. |
| **`flags`**      | <code>number</code> | Modification flags for request.   |


#### GetLfnFromSfnOptions

| Prop           | Type                | Description                      |
| -------------- | ------------------- | -------------------------------- |
| **`fullPath`** | <code>string</code> | The full path to the short file. |


#### MakeDirectoryOptions

| Prop             | Type                | Description                         |
| ---------------- | ------------------- | ----------------------------------- |
| **`remotePath`** | <code>string</code> | The directory on the CHA to create. |
| **`flags`**      | <code>number</code> | Modification flags for request.     |


#### NoiseFeatureStartOptions

| Prop         | Type                | Description                                 |
| ------------ | ------------------- | ------------------------------------------- |
| **`params`** | <code>object</code> | The configuration parameters for the noise. |


#### NoiseFeatureChangeLevelOptions

| Prop         | Type                  | Description                                      |
| ------------ | --------------------- | ------------------------------------------------ |
| **`levels`** | <code>number[]</code> | An array of length two of levels for left/right. |


#### RequestSettingOptions

| Prop              | Type                | Description                      |
| ----------------- | ------------------- | -------------------------------- |
| **`settingName`** | <code>string</code> | The name of the setting to read. |


#### WriteSettingOptions

| Prop              | Type                | Description                        |
| ----------------- | ------------------- | ---------------------------------- |
| **`settingName`** | <code>string</code> | The name of the setting to modify. |
| **`value`**       | <code>number</code> | The new value for the setting.     |


### Type Aliases


#### ListenerCallback

<code>(err: any, ...args: any[]): void</code>


#### PermissionState

<code>'prompt' | 'prompt-with-rationale' | 'granted' | 'denied'</code>

</docgen-api>
