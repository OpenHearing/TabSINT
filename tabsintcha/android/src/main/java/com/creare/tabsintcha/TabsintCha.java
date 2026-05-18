package com.creare.tabsintcha;

import android.content.Context;
import com.creare.cha.A2DP_CHA;
import com.creare.cha.CHA;
import com.creare.cha.CalibrationEntry;
import com.creare.cha.CalibrationList;
import com.creare.cha.CalibrationListEntry;
import com.creare.cha.ChaError;
import com.creare.cha.Exam;
import com.creare.cha.FileDescOut;
import com.creare.cha.Id2;
import com.creare.cha.NoiseFeature;
import com.creare.cha.Results;
import com.creare.cha.Status;
import com.creare.cha.Streamable;
import com.creare.cha.SubmissionInterface;
import com.creare.cha.exams.AudiometrySubmission;
import java.lang.reflect.Constructor;
import java.lang.reflect.InvocationTargetException;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

class TabsintCha {

  private static final String TAG = "TabsintCha";
  final java.util.HashMap<String, A2DP_CHA> a2dpMap = new java.util.HashMap<>();
  final java.util.HashMap<String, ChaState> chaMap = new java.util.HashMap<>();
  final java.util.HashSet<String> chaConnectedSet = new java.util.HashSet<>();
  private EventListenerCallback deviceListenerCallback;
  private EventListenerCallback bluetoothListenerCallback;
  private Context context;

  interface EventListenerCallback {
    void onEvent(JSONObject object);
  }

  interface Action {
    public JSONObject perform(JSONObject object) throws Exception;
  }

  static final class ActionException extends Exception {

    public ActionException(String message) {
      super(message);
    }
  }

  void setContext(Context ctxt) {
    this.context = ctxt;
  }

  void setDeviceListenerCallback(EventListenerCallback callback) {
    this.deviceListenerCallback = callback;
  }

  void clearDeviceListenerCallback() {
    this.deviceListenerCallback = null;
  }

  void setBluetoothListenerCallback(EventListenerCallback callback) {
    this.bluetoothListenerCallback = callback;
  }

  void clearBluetoothListenerCallback() {
    this.bluetoothListenerCallback = null;
  }

  private static final JSONObject createValueObject(String value) {
    JSONObject obj = new JSONObject();
    try {
      obj.put("value", value);
    } catch (JSONException ex) {
      // noop
    }
    return obj;
  }

  Action getBluetoothAdapterStateAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      try {
        boolean result = CHA.getBluetoothAdapterState();
        return createValueObject(result ? "Bluetooth On" : "Bluetooth Off");
      } catch (Exception ex) {
        throw new ActionException("Could not access BluetoothAdapter: " + ex.getMessage());
      }
    }
  };

  Action setBluetoothAdapterStateAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String newState = inputData.optString("newState", "");
      boolean fail = false;
      boolean enable = false;

      if (newState.equals("")) {
        fail = true;
      } else {
        newState = newState.toLowerCase();
        if ("on".equals(newState)) {
          enable = true;
        } else if ("off".equals(newState)) {
          enable = false;
        } else {
          fail = true;
        }
      }

      if (!fail) {
        try {
          // Provide the application context for the library to use for BT enable:
          CHA.setApplicationContext(context);
          CHA.setBluetoothAdapterState(enable);
          return createValueObject(enable ? "Bluetooth Enabled" : "Bluetooth Disabled");
        } catch (Exception ex) {
          throw new ActionException("Could not enable BluetoothAdapter: " + ex.getMessage());
        }
      } else {
        throw new ActionException("Expected one of 'on', 'off' for method" + " setBluetoothAdapterState().");
      }
    }
  };

  Action getBuildVersionAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      return createValueObject(com.creare.cha.BuildVersion.tstamp);
    }
  };

  Action startChaSearchAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String infStr = inputData.getString("infStr");
      CHA.Interface inf;

      if (infStr == null || infStr.isEmpty()) {
        throw new ActionException("Interface argument required.");
      } else {
        try {
          inf = CHA.Interface.valueOf(infStr);
        } catch (IllegalArgumentException iae) {
          StringBuilder sb = new StringBuilder();
          sb.append("CHA interface \"");
          sb.append(infStr);
          sb.append("\" not supported.  Please use one of: ");
          for (CHA.Interface chaInf : CHA.Interface.values()) {
            sb.append(chaInf);
            sb.append(' ');
          }
          throw new ActionException(sb.toString());
        }
      }
      // Provide the application context for the library to use for discovery:
      CHA.setApplicationContext(context);
      // Clear out any unconnected CHA handles:
      chaMap.entrySet().removeIf(entry -> !chaConnectedSet.contains(entry.getKey()));
      // Begin the search:
      CHA.startChaSearch(inf, wrapperChaSearchCallback);
      return createValueObject("Search callback started.");
    }
  };

  Action cancelChaSearchAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      CHA.cancelChaSearch();
      return createValueObject("CHA search cancelled.");
    }
  };

  Action connectAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      // Before connecting, verify that the discovery search is over:
      CHA.cancelChaSearch();
      CHA cha = getCha(name);

      // Attempt to connect:
      cha.connect();
      chaConnectedSet.add(cha.toString());

      return createValueObject("Connected to " + name);
    }
  };

  Action disconnectAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      ChaState chaState = getChaState(name);
      chaState.cha.disconnect(); // this will remove all listeners
      chaConnectedSet.remove(chaState.cha.toString());
      chaState.chaListener = null;
      return createValueObject("Disconnected from " + name);
    }
  };

  Action requestAssociatedA2DPAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      ChaState chaState = getChaState(name);
      CHA cha = chaState.cha;
      A2DP_CHA a2dpCha = chaState.cha.requestAssociatedA2DP();

      if (a2dpCha != null && chaState.chaListener != null) {
        // We have an immediate result. Invoke the listener:
        chaState.chaListener.associatedA2dpDiscovered(cha, a2dpCha);
      } else {
        // Will be discovered.
      }
      return createValueObject("Request associated A2DP processed");
    }
  };

  Action startListenerAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      ChaState chaState = getChaState(name);
      if (chaState.chaListener != null) {
        // If we already have a listener, remove it:
        chaState.cha.removeListener(chaState.chaListener);
        chaState.chaListener = null;
      }

      chaState.chaListener = new WrappedChaListener(chaState);
      chaState.cha.addListener(chaState.chaListener);
      return createValueObject(chaState.cha.toString());
    }
  };

  Action stopListenerAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      ChaState chaState = getChaState(name);
      chaState.cha.removeListener(chaState.chaListener);
      chaState.chaListener = null;
      return createValueObject(chaState.cha.toString());
    }
  };

  Action requestCalibrationListAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      CHA cha = getCha(name);
      cha.requestCalibrationList();
      return createValueObject("Cal. list request sent to " + name);
    }
  };

  Action requestCalibrationEntryAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      final int calIndex = inputData.getInt("index");

      CHA cha = getCha(name);
      cha.requestCalibrationEntry(calIndex);
      return createValueObject("Cal. entry request sent to " + name);
    }
  };

  Action startCalibrationWriteAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      final int calIndex = inputData.getInt("index");
      final JSONObject listEntryArgs = inputData.optJSONObject("entry");
      final JSONObject calDataArgs = inputData.optJSONObject("dataArgs"); // calibration data (freqCalTable, amp gain,
      // etc.)
      final JSONObject speakerBaselineArgs = inputData.optJSONObject("speakerArgs");

      CHA cha = getCha(name);
      // Set into structure:
      final CalibrationListEntry cle = new CalibrationListEntry();
      if (listEntryArgs != null) {
        readJsonViaIntrospection(listEntryArgs, cle);
      }
      final CalibrationEntry ce = new CalibrationEntry();
      if (calDataArgs != null) {
        readJsonViaIntrospection(calDataArgs, ce);
      }
      // Last, optional argument are any overrides of the speaker baseline in the
      // calibration.
      if (speakerBaselineArgs != null) {
        readJsonViaIntrospection(speakerBaselineArgs, ce.speakerBaseline);
      }

      cha.startCalibrationWrite(calIndex, cle, ce);
      return createValueObject("Cal. write started with " + name);
    }
  };

  Action requestIdAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      CHA cha = getCha(name);
      cha.requestId();
      return createValueObject("ID request sent to " + name);
    }
  };

  Action requestProbeIdAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      CHA cha = getCha(name);
      cha.requestProbeId();
      return createValueObject("Probe ID request sent to " + name);
    }
  };

  Action requestStatusAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      CHA cha = getCha(name);
      cha.requestStatus();
      return createValueObject("Status request sent to " + name);
    }
  };

  Action queueExamAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      String examName = inputData.getString("examName");
      final JSONObject params = inputData.optJSONObject("params");

      ChaState chaState = getChaState(name);
      CHA cha = chaState.cha;

      Class<?> c = cha.getClass().getClassLoader().loadClass("com.creare.cha.exams." + examName);
      Exam e = (Exam) c.newInstance();

      if (params != null) {
        readJsonViaIntrospection(params, e);
      }

      // Queue the exam:
      cha.queueExam(e);

      // Store for submission purposes:
      chaState.activeExam = e;
      return createValueObject("Exam " + e + " queued on " + name);
    }
  };

  Action examSubmissionAction = new Action() {
    // Submit user data for a running exam.
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      String subName = inputData.getString("submissionName");
      final JSONObject params = inputData.optJSONObject("params");

      ChaState chaState = getChaState(name);
      CHA cha = chaState.cha;

      Class<?> c = cha.getClass().getClassLoader().loadClass("com.creare.cha.exams." + subName);
      SubmissionInterface sub = (SubmissionInterface) c.newInstance();

      if (params != null) {
        readJsonViaIntrospection(params, sub);
      }

      if (chaState.activeExam == null) {
        throw new ActionException("An active exam is needed for submissions.");
      } else {
        // Submit the object to the CHA:
        cha.examSubmission(chaState.activeExam, sub);
        return createValueObject("User data submitted to " + name);
      }
    }
  };

  Action setSoftwareButtonStateAction = new Action() {
    // This is a specific submission for audiometric button state.
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      int bs = inputData.getInt("state");

      ChaState chaState = getChaState(name);

      if (chaState.activeExam == null) {
        throw new ActionException("An active exam is needed to set button state.");
      } else {
        chaState.cha.examSubmission(chaState.activeExam, new AudiometrySubmission(bs));
        return createValueObject("Button state set.");
      }
    }
  };

  Action abortExamsAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      CHA cha = getCha(name);

      cha.abortExams();
      return createValueObject("Exams aborted.");
    }
  };

  Action requestResultsAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      ChaState chaState = getChaState(name);

      if (chaState.activeExam == null) {
        throw new ActionException("No exam is active.");
      } else {
        chaState.cha.requestResults(chaState.activeExam);
        return createValueObject("Results requested.");
      }
    }
  };

  Action requestSdBytesFreeAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      CHA cha = getCha(name);
      cha.requestSdBytesFree();
      return createValueObject("SD space request sent to " + name);
    }
  };

  Action reprogramAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      int crc32 = inputData.getInt("crc32");

      CHA cha = getCha(name);
      cha.reprogram(crc32);
      return createValueObject("CHA reprogramming.");
    }
  };

  Action rebootAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      CHA cha = getCha(name);
      cha.reboot();
      return createValueObject("CHA rebooting.");
    }
  };

  Action shutdownAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      CHA cha = getCha(name);
      cha.shutdown();
      return createValueObject("Shutdown command sent.");
    }
  };

  Action deleteFileAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      String remoteFile = inputData.getString("remoteFile");
      int flags = inputData.optInt("flags", 0);

      CHA cha = getCha(name);
      cha.deleteFile(remoteFile, flags);
      return createValueObject("CHA delete request sent.  Use " + "STATUS.lastCtrlWrite to detect errors.");
    }
  };

  Action startFileWriteAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      String localFile = inputData.getString("localFile");
      String remoteFile = inputData.getString("remoteFile");
      int flags = inputData.optInt("flags", 0);

      CHA cha = getCha(name);
      cha.startFileWrite(localFile, remoteFile, flags);
      return createValueObject("CHA file write begun.");
    }
  };

  Action startFileReadAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      String localFile = inputData.getString("localFile");
      String remoteFile = inputData.getString("remoteFile");

      CHA cha = getCha(name);
      cha.startFileRead(localFile, remoteFile);
      return createValueObject("CHA file read begun.");
    }
  };

  Action requestDirectoryAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      String remotePath = inputData.getString("remotePath");
      int flags = inputData.optInt("flags", 0);

      CHA cha = getCha(name);
      cha.requestDirectory(remotePath, flags);
      return createValueObject("CHA directory listing begun.");
    }
  };

  Action getLfnFromSfnAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      String fullPath = inputData.getString("fullPath");

      CHA cha = getCha(name);
      String lfn = cha.getLfnFromSfn(fullPath);
      return createValueObject(lfn);
    }
  };

  Action makeDirectoryAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      String remotePath = inputData.getString("remotePath");
      int flags = inputData.optInt("flags", 0);

      CHA cha = getCha(name);
      // Send the command to create the directory:
      cha.makeDirectory(remotePath, flags);
      // Indicate success to the app.
      return createValueObject("CHA creare directory command sent; " + "use STATUS to determine success.");
    }
  };

  Action cancelFileOperationAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      getCha(name).cancelFileOperation();
      return createValueObject("File operation cancelled.");
    }
  };

  Action formatAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      getCha(name).format();
      return createValueObject("Format operation started.");
    }
  };

  Action a2dpIsPairedAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      boolean result = getA2dp(name).isPaired();
      return createValueObject("" + result);
    }
  };

  Action a2dpIsConnectedAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      boolean result = getA2dp(name).isConnected();
      return createValueObject("" + result);
    }
  };

  Action a2dpBeginPairingAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      getA2dp(name).beginPairing();
      return createValueObject("A2DP Pairing");
    }
  };

  Action a2dpUnpairAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      getA2dp(name).unpair();
      return createValueObject("A2DP Unpaired");
    }
  };

  Action a2dpBeginConnectionAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      getA2dp(name).beginConnection();
      return createValueObject("A2DP Connecting");
    }
  };

  Action a2dpDisconnectAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      getA2dp(name).disconnect();
      return createValueObject("A2DP Disconnected");
    }
  };

  // Noise Feature Support //
  Action noiseFeatureStartAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      JSONObject params = inputData.optJSONObject("params");

      CHA cha = getCha(name);
      NoiseFeature nf = new NoiseFeature();
      if (params != null) {
        readJsonViaIntrospection(params, nf);
      }
      cha.noiseFeatureStart(nf);
      return createValueObject("CHA noise feature started.");
    }
  };

  Action noiseFeaturePauseAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      CHA cha = getCha(name);
      cha.noiseFeaturePause();
      return createValueObject("CHA noise feature paused.");
    }
  };

  Action noiseFeatureResumeAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      CHA cha = getCha(name);
      cha.noiseFeatureResume();
      return createValueObject("CHA noise feature resumed.");
    }
  };

  Action noiseFeatureStopAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      CHA cha = getCha(name);
      cha.noiseFeatureStop();
      return createValueObject("CHA noise feature stopped.");
    }
  };

  Action noiseFeatureChangeLevelAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      JSONArray jsonLevels = inputData.getJSONArray("levels");

      CHA cha = getCha(name);
      float[] levelsSPL = { (float) jsonLevels.getDouble(0), (float) jsonLevels.getDouble(1) };
      cha.noiseFeatureChangeLevel(levelsSPL);
      return createValueObject("CHA noise feature levels changed.");
    }
  };

  // Setting API //
  Action requestSettingAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      String settingName = inputData.getString("settingName");

      CHA cha = getCha(name);
      cha.requestSetting(settingName);
      return createValueObject("Requested setting.");
    }
  };

  Action writeSettingAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");
      String settingName = inputData.getString("settingName");
      float value = (float) inputData.getDouble("value");

      CHA cha = getCha(name);
      // Write to the CHA:
      cha.writeSetting(settingName, value);
      return createValueObject("Wrote setting.");
    }
  };

  Action requestExamIdAction = new Action() {
    public JSONObject perform(JSONObject inputData) throws Exception {
      String name = inputData.getString("name");

      CHA cha = getCha(name);
      // Write to the CHA:
      cha.requestExamId();
      return createValueObject("Requested id.");
    }
  };

  private final A2DP_CHA getA2dp(String name) throws IllegalArgumentException {
    A2DP_CHA a2dp = a2dpMap.get(name);

    if (a2dp == null) {
      throw new IllegalArgumentException("No A2DP_CHA \"" + name + "\" has been discovered.");
    }

    return a2dp;
  }

  // Class Methods //
  static JSONObject createJsonViaIntrospection(Streamable o) throws JSONException, IllegalAccessException, InvocationTargetException {
    return createJsonViaIntrospection(new JSONObject(), o);
  }

  static JSONObject createJsonViaIntrospection(JSONObject root, Streamable o)
    throws JSONException, IllegalAccessException, InvocationTargetException {
    java.lang.reflect.Field[] fields;
    final JSONObject json = root;

    try {
      fields = o.getFieldList();
    } catch (NoSuchFieldException e) {
      throw new JSONException("Error getting field list", e);
    }

    for (java.lang.reflect.Field f : fields) {
      android.util.Log.d("json", "@" + json.hashCode() + " = " + json + " field = " + f);
      Object value;
      // First, see if the field name has a 'getter'. If so, use that in preference to
      // the raw field.
      try {
        java.lang.reflect.Method meth = o.getClass().getMethod("get" + f.getName(), (java.lang.Class<?>[]) null);
        value = meth.invoke(o);
      } catch (NoSuchMethodException nsme) {
        // There is no getter. Just use the field.
        value = f.get(o);
      }
      try {
        if (value instanceof Streamable) {
          // Recurse.
          JSONObject child = createJsonViaIntrospection((Streamable) value);
          json.put(f.getName(), child);
        } else if (value.getClass().isArray()) {
          JSONArray arr;

          if (Streamable.class.isAssignableFrom(value.getClass().getComponentType())) {
            // We have an array of streamable objects.
            Streamable[] starr = (Streamable[]) f.get(o);
            arr = new JSONArray();
            for (int i = 0; i < starr.length; ++i) {
              arr.put(i, createJsonViaIntrospection(starr[i]));
            }
          } else {
            // We have an array of primitives.
            // Convert the Java array into a JSON array.
            arr = new JSONArray(value);
          }
          // Add to output JSON:
          json.put(f.getName(), arr);
        } else {
          // Put the scalar object.
          json.put(f.getName(), value);
        }
      } catch (Throwable t) {
        // silently discard field
      }
    }

    return json;
  }

  private static final Object handleJSArray(Object value, String key, Streamable o) throws JSONException, NoSuchMethodException {
    Object outputArray = null;

    // The value is a JSON array. Since Javascript has no
    // integer type, the JSON parser converts anything without
    // a fractional part to an integer. So, we need to
    // determine which class the setter needs, create that
    // class, copy the data, then invoke the setter.
    JSONArray ja = (JSONArray) value;
    Class<?> arrayClass = ja.get(0).getClass(); // assumes all same
    android.util.Log.d(TAG, "JSON array " + ja + ", elClass = " + arrayClass);

    // Is it an integer array setter?
    try {
      o.getClass().getMethod("set" + key, int[].class);
      // Yes. Create the destination array:
      int[] iArr = new int[ja.length()];
      // Copy the values:
      for (int i = 0; i < iArr.length; ++i) {
        iArr[i] = ja.getInt(i);
      }
      // Set the object:
      outputArray = iArr;
    } catch (NoSuchMethodException nsme) {
      try {
        // No. How about float?
        o.getClass().getMethod("set" + key, float[].class);
        // Yes. We will need 32-bit floats.
        float[] fArr = new float[ja.length()];
        // Copy the values:
        for (int i = 0; i < fArr.length; ++i) {
          fArr[i] = (float) ja.getDouble(i);
        }
        outputArray = fArr;
      } catch (NoSuchMethodException nsme2) {
        // We will now try strings.
        o.getClass().getMethod("set" + key, String[].class);
        // The setter exists. Create the destination array:
        String[] sArr = new String[ja.length()];
        // Copy the values:
        for (int i = 0; i < sArr.length; ++i) {
          sArr[i] = ja.getString(i);
        }
        outputArray = sArr;
      }
      // If the appropriate setter not found the exception will propagate.
    }

    return outputArray;
  }

  private static final void readJsonViaIntrospection(JSONObject json, Streamable o)
    throws JSONException, IllegalAccessException, java.lang.reflect.InvocationTargetException {
    java.lang.reflect.Field[] fields;

    try {
      fields = o.getFieldList();
    } catch (NoSuchFieldException e) {
      throw new JSONException("Error getting field list", e);
    }

    // Iterate over the keys in the JSON. Error if they do not correspond to a set
    // method or a field.
    for (java.util.Iterator<?> iter = json.keys(); iter.hasNext(); ) {
      boolean notFound = true;
      String key = iter.next().toString();
      Object value = json.get(key);
      android.util.Log.d(TAG, "JSON key " + key + " = " + value + "," + value.getClass());

      // First, see if a 'set' method exists.
      try {
        // Possibly remap classes:
        Class<?> clazz = value.getClass();
        if (clazz == Boolean.class) {
          clazz = Boolean.TYPE; // actually use primitive type
        } else if (clazz == Double.class) {
          clazz = Float.TYPE; // Make float
          value = Float.valueOf(((Double) value).floatValue());
        } else if (clazz == JSONArray.class) {
          value = handleJSArray(value, key, o);

          // Set the class of the resulting array:
          clazz = value.getClass();
        } else {
          // Leave it.
        }
        java.lang.reflect.Method meth = o.getClass().getMethod("set" + key, clazz);
        meth.invoke(o, value);
        notFound = false;
      } catch (NoSuchMethodException nsme) {
        // There is no setter. Find the field.
        for (java.lang.reflect.Field f : fields) {
          if (f.getName().equals(key)) {
            // Match! Set and end search.
            notFound = false;

            if (value instanceof JSONObject) {
              // Recurse. This assumes the field is Streamable.
              readJsonViaIntrospection((JSONObject) value, (Streamable) f.get(o));
            } else {
              f.set(o, value);
            }
            break;
          }
        }
      }

      if (notFound) {
        throw new JSONException("Field " + key + " not found in " + o.getClass().getName());
      }
    }
  }

  final ChaState getChaState(String name) throws IllegalArgumentException {
    ChaState cha = chaMap.get(name);
    if (cha == null) {
      throw new IllegalArgumentException("No CHA \"" + name + "\" has been discovered.");
    }
    return cha;
  }

  final CHA getCha(String name) throws IllegalArgumentException {
    return getChaState(name).cha;
  }

  static final class ChaState {

    CHA cha;
    com.creare.cha.ChaListener chaListener;
    Exam activeExam;

    ChaState(CHA cha) {
      this.cha = cha;
    }
  }

  final class WrappedChaListener implements com.creare.cha.ChaListener {

    WrappedChaListener(ChaState parentState) {
      this.parentState = parentState;
      listenerIsSet();
    }

    public void calibrationEntryReceived(CHA cha, int index, CalibrationEntry calEntry) {
      handleResponse("CalibrationEntry #" + index, calEntry);
    }

    public void calibrationListReceived(CHA cha, CalibrationList list) {
      handleResponse("CalibrationList", list);
    }

    public void idReceived(CHA cha, Id2 id) {
      handleResponse("Id", id);
    }

    public void probeIdReceived(CHA cha, com.creare.cha.ProbeId id) {
      handleResponse("ProbeId", id);
    }

    public void dateTimeReceived(CHA cha, long time) {
      // NOOP
    }

    public void statusReceived(CHA cha, Status s) {
      try {
        // Create a JSON object from the fields in the ID:
        JSONObject obj = new JSONObject("{" + s.toString().replace('\n', ',') + "}");
        sendResultToListener("Status", obj);
      } catch (JSONException e) {
        handleJsonException(e);
      }
    }

    public void errorReceived(CHA cha, ChaError err) {
      try {
        // Create a JSON object:
        JSONObject obj = new JSONObject();
        // Add fields for the code and message:
        obj.put("Code", err.getCode());
        obj.put("Message", err.getMessage());

        sendResultToListener("Error", obj);
      } catch (JSONException e) {
        handleJsonException(e);
      }
    }

    public void resultsReceived(CHA cha, Results r) {
      android.util.Log.d(TAG, "Results = " + r);
      handleResponse("Result", r);
    }

    public void settingReceived(CHA cha, int index, float value) {
      try {
        // Create a JSON object:
        JSONObject obj = new JSONObject();
        // Add fields for the setting index and value:
        obj.put("Index", index);
        obj.put("Value", value);

        sendResultToListener("Setting", obj);
      } catch (JSONException e) {
        handleJsonException(e);
      }
    }

    public void connected(CHA cha) {
      try {
        sendResultToListener("Connected", null);
      } catch (JSONException e) {
        handleJsonException(e);
      }
    }

    public void disconnected(CHA cha) {
      try {
        sendResultToListener("Disconnected", null);
      } catch (JSONException e) {
        handleJsonException(e);
      }
    }

    /**
     * Progress indicator callback.
     */
    public void fileProgress(CHA cha, int bytesTransferred, int totalBytes) {
      try {
        // Create a JSON object:
        JSONObject obj = new JSONObject();
        // Add fields for the code and message:
        obj.put("BytesTransferred", bytesTransferred);
        obj.put("TotalBytes", totalBytes);

        sendResultToListener("FileProgress", obj);
      } catch (JSONException e) {
        handleJsonException(e);
      }
    }

    /**
     * Indicates receipt of a directory entry.
     */
    public void dirEntryReceived(CHA cha, FileDescOut entry) {
      try {
        // Create a JSON object:
        JSONObject obj = new JSONObject();
        // Add fields for the code and message:
        obj.put("Path", entry.path);
        obj.put("SizeBytes", entry.sizeBytes);
        obj.put("Attributes", entry.attributes);

        sendResultToListener("DirEntry", obj);
      } catch (JSONException e) {
        handleJsonException(e);
      }
    }

    /**
     * Notification that a file operation has completed.
     */
    public void fileOperationComplete(CHA cha, String outcome) {
      try {
        JSONObject obj = new JSONObject();
        obj.put("Outcome", outcome);
        sendResultToListener("FileOperationComplete", obj);
      } catch (JSONException e) {
        handleJsonException(e);
      }
    }

    /**
     * Notification that the number of bytes available on the CHA's
     * SD card has been received.
     */
    public void sdBytesFreeReceived(CHA cha, long nBytes) {
      try {
        JSONObject obj = new JSONObject();
        obj.put("BytesFree", nBytes);
        sendResultToListener("SdBytesFreeReceived", obj);
      } catch (JSONException e) {
        handleJsonException(e);
      }
    }

    public void formatComplete(CHA cha, int resultCode) {
      try {
        JSONObject obj = new JSONObject();
        obj.put("ResultCode", resultCode);
        sendResultToListener("FormatComplete", obj);
      } catch (JSONException e) {
        handleJsonException(e);
      }
    }

    public void associatedA2dpDiscovered(CHA cha, A2DP_CHA a2dpCha) {
      if (a2dpCha != null) {
        // Add it to the map:
        a2dpMap.put(a2dpCha.toString(), a2dpCha);
      } else {
        // The search was completed without an associated A2DP object found.
      }

      try {
        JSONObject obj = new JSONObject();
        obj.put("A2DP_CHA", "" + a2dpCha);
        sendResultToListener("AssociatedA2dpDiscovered", obj);
      } catch (JSONException e) {
        handleJsonException(e);
      }
    }

    public void examCountReceived(CHA cha, int count) {
      try {
        JSONObject obj = new JSONObject();
        obj.put("ExamCount", count);
        sendResultToListener("ExamCountReceived", obj);
      } catch (JSONException e) {
        handleJsonException(e);
      }
    }

    public void currentExamReceived(CHA cha, Exam exam) {
      // Replace the active exam with this one:
      parentState.activeExam = exam;
      handleResponse("ExamReceived", exam);
    }

    // Private Methods //
    private void listenerIsSet() {
      // Send a "Set" message to the event listener
      try {
        JSONObject obj = new JSONObject();
        obj.put("name", parentState.cha.toString());
        JSONArray arr = new JSONArray();
        arr.put(0, "Set");
        obj.put("res", arr);

        // Send the result to the listener:
        if (deviceListenerCallback != null) {
          deviceListenerCallback.onEvent(obj);
        }
      } catch (JSONException e) {
        handleJsonException(e);
      }
    }

    private void sendResultToListener(String identifier, JSONObject obj) throws JSONException {
      JSONObject objResponse = new JSONObject();
      objResponse.put("name", parentState.cha.toString());
      JSONArray arr = new JSONArray();
      arr.put(0, identifier);
      if (obj != null) {
        // Add it to the array:
        arr.put(1, obj);
      } else {
        // Do not.
      }
      objResponse.put("res", arr);

      // Send the result to the listener:
      if (deviceListenerCallback != null) {
        deviceListenerCallback.onEvent(objResponse);
      }
    }

    private void handleJsonException(JSONException e) {
      android.util.Log.e(TAG, e.getMessage(), e);

      JSONObject obj = new JSONObject();
      try {
        obj.put("name", parentState.cha.toString());
        obj.put("res", e.getMessage());
      } catch (JSONException ex) {
        // noop
      }

      // Send the result to the listener:
      if (deviceListenerCallback != null) {
        deviceListenerCallback.onEvent(obj);
      }
    }

    private void handleResponse(String identifier, Streamable streamable) {
      try {
        // Create a JSON object from the fields in the input:
        JSONObject obj = createJsonViaIntrospection(streamable);
        // Regrettable, but this allows us to not repeat code in the results handler.
        if (streamable instanceof Results) {
          Streamable ext = ((Results) streamable).getExtendedResults();
          if (ext != null) {
            // Aggregate the extended results fields into the extant results JSON.
            createJsonViaIntrospection(obj, ext);
          } else {
            // No extended results available for this set.
          }
        } else {
          // Not a results object.
        }
        android.util.Log.d(TAG, "JSON = " + obj);
        sendResultToListener(identifier, obj);
      } catch (Throwable t) {
        android.util.Log.e(TAG, t.getMessage(), t);
        JSONObject obj = new JSONObject();
        try {
          obj.put("name", parentState.cha.toString());
          obj.put("res", t.getMessage());
        } catch (JSONException ex) {
          // noop
        }

        // Send the result to the listener:
        if (deviceListenerCallback != null) {
          deviceListenerCallback.onEvent(obj);
        }
      }
    }

    private ChaState parentState;
  }

  private final com.creare.cha.SearchCallback wrapperChaSearchCallback = new com.creare.cha.SearchCallback() {
    public void chaFound(CHA cha) {
      // Create a JSON object that contains the relevant information about the CHA we
      // have discovered.
      JSONObject obj = new JSONObject();

      try {
        obj.put("name", cha.toString());
        obj.put("status", "searching");
      } catch (JSONException ex) {
        // noop
      }

      // Add it to the map of CHAs:
      chaMap.put(cha.toString(), new ChaState(cha));

      // Send the result to the listener:
      if (bluetoothListenerCallback != null) {
        bluetoothListenerCallback.onEvent(obj);
      }
    }

    public void searchComplete() {
      JSONObject obj = new JSONObject();

      try {
        obj.put("name", "");
        obj.put("status", "done");
      } catch (JSONException ex) {
        // noop
      }

      // Send the result to the listener:
      if (bluetoothListenerCallback != null) {
        bluetoothListenerCallback.onEvent(obj);
      }
    }
  };
}
