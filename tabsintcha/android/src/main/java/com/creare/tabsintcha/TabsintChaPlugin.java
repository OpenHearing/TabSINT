package com.creare.tabsintcha;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.JSONException;
import org.json.JSONObject;

@CapacitorPlugin(
  name = "TabsintCha",
  permissions = {
    @Permission(
      alias = "bluetooth",
      strings = {
        android.Manifest.permission.BLUETOOTH_CONNECT,
        android.Manifest.permission.BLUETOOTH_SCAN,
        android.Manifest.permission.BLUETOOTH_ADVERTISE,
        android.Manifest.permission.ACCESS_COARSE_LOCATION,
        android.Manifest.permission.ACCESS_FINE_LOCATION,
      }
    ),
  }
)
public class TabsintChaPlugin extends Plugin {

  private static final String TAG = "TabsintChaPlugin";
  private static final String BT_PERMISSIONS_ALIAS = "bluetooth";
  private static final String DISCOVERY_EVENT = "TabsintChaDiscovery";
  private static final String DEVICE_EVENT = "TabsintChaDevice";
  private TabsintCha implementation;

  @Override
  public void load() {
    implementation = new TabsintCha();
    implementation.setContext(getContext());

    implementation.setDeviceListenerCallback(object -> {
      try {
        notifyListeners(DEVICE_EVENT, new JSObject(object.toString()));
      } catch (JSONException exception) {
        android.util.Log.e(TAG, exception.getMessage(), exception);
      }
    });

    implementation.setBluetoothListenerCallback(object -> {
      try {
        notifyListeners(DISCOVERY_EVENT, new JSObject(object.toString()));
      } catch (JSONException exception) {
        android.util.Log.e(TAG, exception.getMessage(), exception);
      }
    });
  }

  @PluginMethod
  public void getDeviceDiscoveryEventName(PluginCall pluginCall) {
    JSObject obj = new JSObject();
    obj.put("value", DISCOVERY_EVENT);
    pluginCall.resolve(obj);
  }

  @PluginMethod
  public void getDeviceResponseEventName(PluginCall pluginCall) {
    JSObject obj = new JSObject();
    obj.put("value", DEVICE_EVENT);
    pluginCall.resolve(obj);
  }

  @PermissionCallback
  private void bluetoothPermissionsSearchCallback(PluginCall pluginCall) throws Exception {
    if (getPermissionState(BT_PERMISSIONS_ALIAS) == PermissionState.GRANTED) {
      execute(pluginCall, implementation.startChaSearchAction);
    } else {
      pluginCall.reject("Bluetooth Permissions not granted.");
    }
  }

  @PluginMethod
  public void startChaSearch(PluginCall pluginCall) {
    if (getPermissionState(BT_PERMISSIONS_ALIAS) != PermissionState.GRANTED) {
      requestPermissionForAlias(BT_PERMISSIONS_ALIAS, pluginCall, "bluetoothPermissionsSearchCallback");
    }
    execute(pluginCall, implementation.startChaSearchAction);
  }

  @PluginMethod
  public void cancelChaSearch(PluginCall pluginCall) {
    execute(pluginCall, implementation.cancelChaSearchAction);
  }

  @PluginMethod
  public void getBluetoothAdapterState(PluginCall pluginCall) {
    execute(pluginCall, implementation.getBluetoothAdapterStateAction);
  }

  @PluginMethod
  public void setBluetoothAdapterState(PluginCall pluginCall) {
    execute(pluginCall, implementation.setBluetoothAdapterStateAction);
  }

  @PluginMethod
  public void getBuildVersion(PluginCall pluginCall) {
    execute(pluginCall, implementation.getBuildVersionAction);
  }

  @PluginMethod
  public void connect(PluginCall pluginCall) {
    execute(pluginCall, implementation.connectAction);
  }

  @PluginMethod
  public void disconnect(PluginCall pluginCall) {
    execute(pluginCall, implementation.disconnectAction);
  }

  @PluginMethod
  public void requestAssociatedA2DP(PluginCall pluginCall) {
    execute(pluginCall, implementation.requestAssociatedA2DPAction);
  }

  @PluginMethod
  public void startListener(PluginCall pluginCall) {
    execute(pluginCall, implementation.startListenerAction);
  }

  @PluginMethod
  public void stopListener(PluginCall pluginCall) {
    execute(pluginCall, implementation.stopListenerAction);
  }

  @PluginMethod
  public void requestCalibrationList(PluginCall pluginCall) {
    execute(pluginCall, implementation.requestCalibrationListAction);
  }

  @PluginMethod
  public void requestCalibrationEntry(PluginCall pluginCall) {
    execute(pluginCall, implementation.requestCalibrationEntryAction);
  }

  @PluginMethod
  public void startCalibrationWrite(PluginCall pluginCall) {
    execute(pluginCall, implementation.startCalibrationWriteAction);
  }

  @PluginMethod
  public void requestId(PluginCall pluginCall) {
    execute(pluginCall, implementation.requestIdAction);
  }

  @PluginMethod
  public void requestProbeId(PluginCall pluginCall) {
    execute(pluginCall, implementation.requestProbeIdAction);
  }

  @PluginMethod
  public void requestStatus(PluginCall pluginCall) {
    execute(pluginCall, implementation.requestStatusAction);
  }

  @PluginMethod
  public void queueExam(PluginCall pluginCall) {
    execute(pluginCall, implementation.queueExamAction);
  }

  @PluginMethod
  public void requestResults(PluginCall pluginCall) {
    execute(pluginCall, implementation.requestResultsAction);
  }

  @PluginMethod
  public void requestSdBytesFree(PluginCall pluginCall) {
    execute(pluginCall, implementation.requestSdBytesFreeAction);
  }

  @PluginMethod
  public void examSubmission(PluginCall pluginCall) {
    execute(pluginCall, implementation.examSubmissionAction);
  }

  // This function is deprecated, and will be removed in a future release.
  @PluginMethod
  public void setSoftwareButtonState(PluginCall pluginCall) {
    execute(pluginCall, implementation.setSoftwareButtonStateAction);
  }

  @PluginMethod
  public void abortExams(PluginCall pluginCall) {
    execute(pluginCall, implementation.abortExamsAction);
  }

  @PluginMethod
  public void requestExamId(PluginCall pluginCall) {
    execute(pluginCall, implementation.requestExamIdAction);
  }

  @PluginMethod
  public void reprogram(PluginCall pluginCall) {
    execute(pluginCall, implementation.reprogramAction);
  }

  @PluginMethod
  public void reboot(PluginCall pluginCall) {
    execute(pluginCall, implementation.rebootAction);
  }

  @PluginMethod
  public void shutdown(PluginCall pluginCall) {
    execute(pluginCall, implementation.shutdownAction);
  }

  @PluginMethod
  public void deleteFile(PluginCall pluginCall) {
    execute(pluginCall, implementation.deleteFileAction);
  }

  @PluginMethod
  public void deleteFileCrc(PluginCall pluginCall) {
    execute(pluginCall, implementation.deleteFileAction);
  }

  @PluginMethod
  public void startFileRead(PluginCall pluginCall) {
    execute(pluginCall, implementation.startFileReadAction);
  }

  @PluginMethod
  public void startFileWrite(PluginCall pluginCall) {
    execute(pluginCall, implementation.startFileWriteAction);
  }

  @PluginMethod
  public void requestDirectory(PluginCall pluginCall) {
    execute(pluginCall, implementation.requestDirectoryAction);
  }

  @PluginMethod
  public void requestDirectoryCrc(PluginCall pluginCall) {
    execute(pluginCall, implementation.requestDirectoryAction);
  }

  @PluginMethod
  public void getLfnFromSfn(PluginCall pluginCall) {
    execute(pluginCall, implementation.getLfnFromSfnAction);
  }

  @PluginMethod
  public void makeDirectory(PluginCall pluginCall) {
    execute(pluginCall, implementation.makeDirectoryAction);
  }

  @PluginMethod
  public void cancelFileOperation(PluginCall pluginCall) {
    execute(pluginCall, implementation.cancelFileOperationAction);
  }

  @PluginMethod
  public void format(PluginCall pluginCall) {
    execute(pluginCall, implementation.formatAction);
  }

  @PluginMethod
  public void noiseFeatureStart(PluginCall pluginCall) {
    execute(pluginCall, implementation.noiseFeatureStartAction);
  }

  @PluginMethod
  public void noiseFeaturePause(PluginCall pluginCall) {
    execute(pluginCall, implementation.noiseFeaturePauseAction);
  }

  @PluginMethod
  public void noiseFeatureResume(PluginCall pluginCall) {
    execute(pluginCall, implementation.noiseFeatureResumeAction);
  }

  @PluginMethod
  public void noiseFeatureStop(PluginCall pluginCall) {
    execute(pluginCall, implementation.noiseFeatureStopAction);
  }

  @PluginMethod
  public void noiseFeatureChangeLevel(PluginCall pluginCall) {
    execute(pluginCall, implementation.noiseFeatureChangeLevelAction);
  }

  @PluginMethod
  public void requestSetting(PluginCall pluginCall) {
    execute(pluginCall, implementation.requestSettingAction);
  }

  @PluginMethod
  public void writeSetting(PluginCall pluginCall) {
    execute(pluginCall, implementation.writeSettingAction);
  }

  void execute(PluginCall pluginCall, TabsintCha.Action action) {
    try {
      JSONObject response = action.perform(pluginCall.getData());
      pluginCall.resolve(new JSObject(response.toString()));
    } catch (Exception exception) {
      android.util.Log.e(TAG, exception.getMessage(), exception);
      pluginCall.reject(exception.getMessage());
    }
  }
}
