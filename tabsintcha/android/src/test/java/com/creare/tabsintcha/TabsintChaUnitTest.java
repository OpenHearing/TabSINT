package com.creare.tabsintcha;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

import com.creare.cha.A2DP_CHA;
import com.creare.cha.CHA;
import com.creare.tabsintcha.TabsintCha;
import com.creare.tabsintcha.TabsintChaPlugin;
import java.util.Arrays;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;
import org.mockito.MockedStatic;
import org.mockito.Mockito.*;

/**
 * Unit testing for TabsintCha.
 */
public class TabsintChaUnitTest {

  TabsintCha tabsintCha;
  CHA cha;
  TabsintCha.EventListenerCallback deviceListenerCallback;
  TabsintCha.EventListenerCallback bluetoothListenerCallback;
  A2DP_CHA a2dpCha;

  @Before
  public void initialize() {
    tabsintCha = new TabsintCha();
    cha = mock(CHA.class);
    a2dpCha = mock(A2DP_CHA.class);
    deviceListenerCallback = mock(TabsintCha.EventListenerCallback.class);
    bluetoothListenerCallback = mock(TabsintCha.EventListenerCallback.class);
  }

  @Test
  public void testGetBluetoothAdapterStateActionReturnsBluetoothOn() throws Exception {
    try (MockedStatic<CHA> mocked = mockStatic(CHA.class)) {
      mocked.when(CHA::getBluetoothAdapterState).thenReturn(true);

      JSONObject object = new JSONObject();
      JSONObject response = tabsintCha.getBluetoothAdapterStateAction.perform(object);

      assertEquals(response.optString("value"), "Bluetooth On");
      mocked.verify(CHA::getBluetoothAdapterState);
    }
  }

  @Test
  public void testGetBluetoothAdapterStateActionReturnsBluetoothOff() throws Exception {
    try (MockedStatic<CHA> mocked = mockStatic(CHA.class)) {
      mocked.when(CHA::getBluetoothAdapterState).thenReturn(false);

      JSONObject object = new JSONObject();
      JSONObject response = tabsintCha.getBluetoothAdapterStateAction.perform(object);

      assertEquals(response.optString("value"), "Bluetooth Off");
      mocked.verify(CHA::getBluetoothAdapterState);
    }
  }

  @Test
  public void testSetBluetoothAdapterStateActionReturnsValidResponse() throws Exception {
    try (MockedStatic<CHA> mocked = mockStatic(CHA.class)) {
      mocked.when(() -> CHA.setBluetoothAdapterState(anyBoolean())).thenAnswer(invocation -> null);
      mocked.when(() -> CHA.setApplicationContext(any())).thenAnswer(invocation -> null);

      JSONObject object = new JSONObject();
      object.put("newState", "on");
      JSONObject response = tabsintCha.setBluetoothAdapterStateAction.perform(object);

      assertEquals(response.optString("value"), "Bluetooth Enabled");
      mocked.verify(() -> CHA.setBluetoothAdapterState(true));
    }
  }

  @Test
  public void testSetBluetoothAdapterStateActionThrowsOnInvalidState() throws Exception {
    try (MockedStatic<CHA> mocked = mockStatic(CHA.class)) {
      mocked.when(() -> CHA.setBluetoothAdapterState(anyBoolean())).thenAnswer(invocation -> null);
      mocked.when(() -> CHA.setApplicationContext(any())).thenAnswer(invocation -> null);

      JSONObject object = new JSONObject();
      object.put("newState", "");

      assertThrows(TabsintCha.ActionException.class, () -> tabsintCha.setBluetoothAdapterStateAction.perform(object));
    }
  }

  @Test
  public void testGetBuiltVersionActionReturnsTimeStamp() throws Exception {
    JSONObject object = new JSONObject();
    JSONObject response = tabsintCha.getBuildVersionAction.perform(object);

    assertEquals(response.optString("value"), com.creare.cha.BuildVersion.tstamp);
  }

  @Test
  public void testStartChaSearchActionReturnsValidResponse() throws Exception {
    try (MockedStatic<CHA> mocked = mockStatic(CHA.class)) {
      mocked.when(() -> CHA.startChaSearch(any(CHA.Interface.class), any(com.creare.cha.SearchCallback.class))).thenAnswer(invocation -> null);
      mocked.when(() -> CHA.setApplicationContext(any())).thenAnswer(invocation -> null);

      JSONObject object = new JSONObject();
      object.put("infStr", "BLUETOOTH_LE");
      JSONObject response = tabsintCha.startChaSearchAction.perform(object);

      assertEquals(response.optString("value"), "Search callback started.");
      mocked.verify(() -> CHA.startChaSearch(any(CHA.Interface.class), any(com.creare.cha.SearchCallback.class)));
    }
  }

  @Test
  public void testStartChaSearchActionThrowsOnInvalidArgument() throws Exception {
    JSONObject object = new JSONObject();
    object.put("infStr", "Invalid");

    assertThrows(TabsintCha.ActionException.class, () -> tabsintCha.startChaSearchAction.perform(object));
  }

  @Test
  public void testCancelChaSearchActionReturnsValidResponse() throws Exception {
    try (MockedStatic<CHA> mocked = mockStatic(CHA.class)) {
      mocked.when(() -> CHA.cancelChaSearch()).thenAnswer(invocation -> null);

      JSONObject object = new JSONObject();
      JSONObject response = tabsintCha.cancelChaSearchAction.perform(object);

      assertEquals(response.optString("value"), "CHA search cancelled.");
      mocked.verify(() -> CHA.cancelChaSearch());
    }
  }

  @Test
  public void testConnectActionReturnsValidResponse() throws Exception {
    try (MockedStatic<CHA> mocked = mockStatic(CHA.class)) {
      mocked.when(() -> CHA.cancelChaSearch()).thenAnswer(invocation -> null);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

      JSONObject object = new JSONObject();
      object.put("name", "Mock");

      JSONObject response = tabsintCha.connectAction.perform(object);
      assertEquals(response.optString("value"), "Connected to Mock");
      mocked.verify(() -> CHA.cancelChaSearch());
      verify(cha).connect();
    }
  }

  @Test
  public void testConnectActionThrowsOnInvalidName() throws Exception {
    try (MockedStatic<CHA> mocked = mockStatic(CHA.class)) {
      mocked.when(() -> CHA.cancelChaSearch()).thenAnswer(invocation -> null);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

      JSONObject object = new JSONObject();
      object.put("name", "Invalid");

      assertThrows(java.lang.IllegalArgumentException.class, () -> tabsintCha.connectAction.perform(object));
    }
  }

  @Test
  public void testDisconnectActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.disconnectAction.perform(object);
    assertEquals(response.optString("value"), "Disconnected from Mock");
    verify(cha).disconnect();
  }

  @Test
  public void testDisconnectActionThrowsOnInvalidName() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Invalid");

    assertThrows(java.lang.IllegalArgumentException.class, () -> tabsintCha.disconnectAction.perform(object));
  }

  @Test
  public void testRequestAssociatedA2DPActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    when(cha.requestAssociatedA2DP()).thenReturn(a2dpCha);
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.requestAssociatedA2DPAction.perform(object);
    assertEquals(response.optString("value"), "Request associated A2DP processed");
    verify(cha).requestAssociatedA2DP();
  }

  @Test
  public void testStartListenerReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.startListenerAction.perform(object);
    assertEquals(response.optString("value"), "Mock");
    verify(cha).addListener(any(TabsintCha.WrappedChaListener.class));
  }

  @Test
  public void testStartListenerAddsListener() throws Exception {
    TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", chaState);

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    chaState.chaListener = null;
    assertEquals(chaState.chaListener, null);
    tabsintCha.startListenerAction.perform(object);
    assertNotNull(chaState.chaListener);
  }

  @Test
  public void testStopListenerReturnsValidResponse() throws Exception {
    TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
    chaState.chaListener = mock(TabsintCha.WrappedChaListener.class);
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", chaState);

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.stopListenerAction.perform(object);
    assertEquals(response.optString("value"), "Mock");
    verify(cha).removeListener(any(TabsintCha.WrappedChaListener.class));
  }

  @Test
  public void testStopListenerRemovesListener() throws Exception {
    TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", chaState);

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    chaState.chaListener = mock(TabsintCha.WrappedChaListener.class);
    assertNotNull(chaState.chaListener);
    tabsintCha.stopListenerAction.perform(object);
    assertEquals(chaState.chaListener, null);
  }

  @Test
  public void testRequestCalibrationListActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.requestCalibrationListAction.perform(object);
    assertEquals(response.optString("value"), "Cal. list request sent to Mock");
    verify(cha).requestCalibrationList();
  }

  @Test
  public void testRequestCalibrationEntryActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("index", "1");

    JSONObject response = tabsintCha.requestCalibrationEntryAction.perform(object);
    assertEquals(response.optString("value"), "Cal. entry request sent to Mock");
    verify(cha).requestCalibrationEntry(1);
  }

  @Test
  public void testRequestCalibrationEntryActionThrowsOnMissingIndex() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    assertThrows(JSONException.class, () -> tabsintCha.requestCalibrationEntryAction.perform(object));
  }

  @Test
  public void testStartCalibrationWriteActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("index", "1");

    JSONObject response = tabsintCha.startCalibrationWriteAction.perform(object);
    assertEquals(response.optString("value"), "Cal. write started with Mock");
    verify(cha).startCalibrationWrite(eq(1), any(com.creare.cha.CalibrationListEntry.class), any(com.creare.cha.CalibrationEntry.class));
  }

  @Test
  public void testStartCalibrationWriteActionReturnsValidResponseWithOptionalArguments() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("index", "1");
    object.put("entry", new JSONObject());
    object.put("dataArgs", new JSONObject());
    object.put("speakerArgs", new JSONObject());

    JSONObject response = tabsintCha.startCalibrationWriteAction.perform(object);
    assertEquals(response.optString("value"), "Cal. write started with Mock");
    verify(cha).startCalibrationWrite(eq(1), any(com.creare.cha.CalibrationListEntry.class), any(com.creare.cha.CalibrationEntry.class));
  }

  @Test
  public void testStartCalibrationWriteActionThrowsOnMissingIndex() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    assertThrows(JSONException.class, () -> tabsintCha.startCalibrationWriteAction.perform(object));
  }

  @Test
  public void testRequestIdActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.requestIdAction.perform(object);
    assertEquals(response.optString("value"), "ID request sent to Mock");
    verify(cha).requestId();
  }

  @Test
  public void testRequestProbeIdActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.requestProbeIdAction.perform(object);
    assertEquals(response.optString("value"), "Probe ID request sent to Mock");
    verify(cha).requestProbeId();
  }

  @Test
  public void testRequestStatusActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.requestStatusAction.perform(object);
    assertEquals(response.optString("value"), "Status request sent to Mock");
    verify(cha).requestStatus();
  }

  @Test
  public void testQueueExamActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("examName", "DichoticDigits");

    JSONObject response = tabsintCha.queueExamAction.perform(object);
    assertTrue(response.optString("value").contains("DichoticDigits"));
    verify(cha).queueExam(any(com.creare.cha.exams.DichoticDigits.class));
  }

  @Test
  public void testQueueExamActionThrowsOnUnknownExamType() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("examName", "Invalid");

    assertThrows(java.lang.ClassNotFoundException.class, () -> tabsintCha.queueExamAction.perform(object));
  }

  @Test
  public void testExamSubmissionActionReturnsValidResponse() throws Exception {
    TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
    chaState.activeExam = mock(com.creare.cha.Exam.class);
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", chaState);

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("submissionName", "DichoticDigits$Submission");

    JSONObject response = tabsintCha.examSubmissionAction.perform(object);
    assertEquals(response.optString("value"), "User data submitted to Mock");
    verify(cha).examSubmission(eq(chaState.activeExam), any(com.creare.cha.exams.DichoticDigits.Submission.class));
  }

  @Test
  public void testExamSubmissionActionThrowsOnUnknownExamType() throws Exception {
    TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
    chaState.activeExam = mock(com.creare.cha.Exam.class);
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", chaState);

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("submissionName", "Invalid");

    assertThrows(java.lang.ClassNotFoundException.class, () -> tabsintCha.examSubmissionAction.perform(object));
  }

  @Test
  public void testExamSubmissionActionThrowsOnNoActiveExam() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("submissionName", "DichoticDigits$Submission");

    assertThrows(TabsintCha.ActionException.class, () -> tabsintCha.examSubmissionAction.perform(object));
  }

  @Test
  public void testSetSoftwareButtonStateActionReturnsValidResponse() throws Exception {
    TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
    chaState.activeExam = mock(com.creare.cha.Exam.class);
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", chaState);

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("state", 0);

    JSONObject response = tabsintCha.setSoftwareButtonStateAction.perform(object);
    assertEquals(response.optString("value"), "Button state set.");
    verify(cha).examSubmission(eq(chaState.activeExam), any(com.creare.cha.exams.AudiometrySubmission.class));
  }

  @Test
  public void testSetSoftwareButtonStateActionThrowsOnInvalidState() throws Exception {
    TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
    chaState.activeExam = mock(com.creare.cha.Exam.class);
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", chaState);

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("state", "Invalid");

    assertThrows(JSONException.class, () -> tabsintCha.setSoftwareButtonStateAction.perform(object));
  }

  @Test
  public void testSetSoftwareButtonStateActionThrowsOnNoActiveExam() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("state", 0);

    assertThrows(TabsintCha.ActionException.class, () -> tabsintCha.setSoftwareButtonStateAction.perform(object));
  }

  @Test
  public void testAbortExamsActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.abortExamsAction.perform(object);
    assertEquals(response.optString("value"), "Exams aborted.");
    verify(cha).abortExams();
  }

  @Test
  public void testRequestResultsActionReturnsValidResponse() throws Exception {
    TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
    chaState.activeExam = mock(com.creare.cha.Exam.class);
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", chaState);

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.requestResultsAction.perform(object);
    assertEquals(response.optString("value"), "Results requested.");
    verify(cha).requestResults(eq(chaState.activeExam));
  }

  @Test
  public void testRequestResultsActionThrowsOnNoActiveExam() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    assertThrows(TabsintCha.ActionException.class, () -> tabsintCha.requestResultsAction.perform(object));
  }

  @Test
  public void testRequestSdBytesFreeActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.requestSdBytesFreeAction.perform(object);
    assertEquals(response.optString("value"), "SD space request sent to Mock");
    verify(cha).requestSdBytesFree();
  }

  @Test
  public void testReprogramActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("crc32", 1);

    JSONObject response = tabsintCha.reprogramAction.perform(object);
    assertEquals(response.optString("value"), "CHA reprogramming.");
    verify(cha).reprogram(1);
  }

  @Test
  public void testRequestResultsActionThrowsOnInvalidCrc() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("crc32", "Invalid");

    assertThrows(JSONException.class, () -> tabsintCha.reprogramAction.perform(object));
  }

  @Test
  public void testRebootActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.rebootAction.perform(object);
    assertEquals(response.optString("value"), "CHA rebooting.");
    verify(cha).reboot();
  }

  @Test
  public void testShutdownActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.shutdownAction.perform(object);
    assertEquals(response.optString("value"), "Shutdown command sent.");
    verify(cha).shutdown();
  }

  @Test
  public void testDeleteFileActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("remoteFile", "fileRemote");

    JSONObject response = tabsintCha.deleteFileAction.perform(object);
    assertTrue(response.optString("value").contains("CHA delete request sent."));
    verify(cha).deleteFile("fileRemote", 0);
  }

  @Test
  public void testDeleteFileActionThrowsOnMissingRemoteFile() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    assertThrows(JSONException.class, () -> tabsintCha.deleteFileAction.perform(object));
  }

  @Test
  public void testStartFileWriteActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("localFile", "fileLocal");
    object.put("remoteFile", "fileRemote");

    JSONObject response = tabsintCha.startFileWriteAction.perform(object);
    assertEquals(response.optString("value"), "CHA file write begun.");
    verify(cha).startFileWrite("fileLocal", "fileRemote", 0);
  }

  @Test
  public void testStartFileWriteActionThrowsOnMissingFiles() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    assertThrows(JSONException.class, () -> tabsintCha.startFileWriteAction.perform(object));
  }

  @Test
  public void testStartFileReadActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("localFile", "fileLocal");
    object.put("remoteFile", "fileRemote");

    JSONObject response = tabsintCha.startFileReadAction.perform(object);
    assertEquals(response.optString("value"), "CHA file read begun.");
    verify(cha).startFileRead("fileLocal", "fileRemote");
  }

  @Test
  public void testStartFileReadActionThrowsOnMissingFiles() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    assertThrows(JSONException.class, () -> tabsintCha.startFileReadAction.perform(object));
  }

  @Test
  public void testRequestDirectoryActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("remotePath", "pathRemote");

    JSONObject response = tabsintCha.requestDirectoryAction.perform(object);
    assertEquals(response.optString("value"), "CHA directory listing begun.");
    verify(cha).requestDirectory("pathRemote", 0);
  }

  @Test
  public void testRequestDirectoryActionThrowsOnMissingRemotePath() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    assertThrows(JSONException.class, () -> tabsintCha.requestDirectoryAction.perform(object));
  }

  @Test
  public void testGetLfnFromSfnActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    when(cha.getLfnFromSfn(anyString())).thenReturn("newPath");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("fullPath", "pathFull");

    JSONObject response = tabsintCha.getLfnFromSfnAction.perform(object);
    assertEquals(response.optString("value"), "newPath");
    verify(cha).getLfnFromSfn("pathFull");
  }

  @Test
  public void testGetLfnFromSfnActionThrowsOnMissingFullPath() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    assertThrows(JSONException.class, () -> tabsintCha.getLfnFromSfnAction.perform(object));
  }

  @Test
  public void testMakeDirectoryActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("remotePath", "pathRemote");

    JSONObject response = tabsintCha.makeDirectoryAction.perform(object);
    assertTrue(response.optString("value").contains("CHA creare directory command sent"));
    verify(cha).makeDirectory("pathRemote", 0);
  }

  @Test
  public void testMakeDirectoryActionThrowsOnMissingRemotePath() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    assertThrows(JSONException.class, () -> tabsintCha.makeDirectoryAction.perform(object));
  }

  @Test
  public void testCancelFileOperationActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.cancelFileOperationAction.perform(object);
    assertEquals(response.optString("value"), "File operation cancelled.");
    verify(cha).cancelFileOperation();
  }

  @Test
  public void testFormatActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.formatAction.perform(object);
    assertEquals(response.optString("value"), "Format operation started.");
    verify(cha).format();
  }

  @Test
  public void testA2dpIsPairedActionReturnsValidResponse() throws Exception {
    when(a2dpCha.isPaired()).thenReturn(true);
    tabsintCha.a2dpMap.put("Mock", a2dpCha);

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.a2dpIsPairedAction.perform(object);
    assertEquals(response.optString("value"), "true");
    verify(a2dpCha).isPaired();
  }

  @Test
  public void testA2dpIsConnectedActionReturnsValidResponse() throws Exception {
    when(a2dpCha.isConnected()).thenReturn(true);
    tabsintCha.a2dpMap.put("Mock", a2dpCha);

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.a2dpIsConnectedAction.perform(object);
    assertEquals(response.optString("value"), "true");
    verify(a2dpCha).isConnected();
  }

  @Test
  public void testA2dpBeginPairingActionReturnsValidResponse() throws Exception {
    tabsintCha.a2dpMap.put("Mock", a2dpCha);

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.a2dpBeginPairingAction.perform(object);
    assertEquals(response.optString("value"), "A2DP Pairing");
    verify(a2dpCha).beginPairing();
  }

  @Test
  public void testA2dpUnpairActionReturnsValidResponse() throws Exception {
    tabsintCha.a2dpMap.put("Mock", a2dpCha);

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.a2dpUnpairAction.perform(object);
    assertEquals(response.optString("value"), "A2DP Unpaired");
    verify(a2dpCha).unpair();
  }

  @Test
  public void testA2dpBeginConnectionActionReturnsValidResponse() throws Exception {
    tabsintCha.a2dpMap.put("Mock", a2dpCha);

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.a2dpBeginConnectionAction.perform(object);
    assertEquals(response.optString("value"), "A2DP Connecting");
    verify(a2dpCha).beginConnection();
  }

  @Test
  public void testA2dpDisconnectActionReturnsValidResponse() throws Exception {
    tabsintCha.a2dpMap.put("Mock", a2dpCha);

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.a2dpDisconnectAction.perform(object);
    assertEquals(response.optString("value"), "A2DP Disconnected");
    verify(a2dpCha).disconnect();
  }

  @Test
  public void testNoiseFeatureStartActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.noiseFeatureStartAction.perform(object);
    assertEquals(response.optString("value"), "CHA noise feature started.");
    verify(cha).noiseFeatureStart(any(com.creare.cha.NoiseFeature.class));
  }

  @Test
  public void testNoiseFeaturePauseActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.noiseFeaturePauseAction.perform(object);
    assertEquals(response.optString("value"), "CHA noise feature paused.");
    verify(cha).noiseFeaturePause();
  }

  @Test
  public void testNoiseFeatureResumeActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.noiseFeatureResumeAction.perform(object);
    assertEquals(response.optString("value"), "CHA noise feature resumed.");
    verify(cha).noiseFeatureResume();
  }

  @Test
  public void testNoiseFeatureStopActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.noiseFeatureStopAction.perform(object);
    assertEquals(response.optString("value"), "CHA noise feature stopped.");
    verify(cha).noiseFeatureStop();
  }

  @Test
  public void testNoiseFeatureChangeLevelActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    float[] levels = { 10.0f, 10.0f };
    object.put("levels", new JSONArray(Arrays.toString(levels)));

    JSONObject response = tabsintCha.noiseFeatureChangeLevelAction.perform(object);
    assertEquals(response.optString("value"), "CHA noise feature levels changed.");
    verify(cha).noiseFeatureChangeLevel(levels);
  }

  @Test
  public void testNoiseFeatureChangeLevelActionThrowsOnInvalidLevels() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    String[] levels = { "Invalid", "Invalid" };
    object.put("levels", new JSONArray(Arrays.toString(levels)));

    assertThrows(JSONException.class, () -> tabsintCha.noiseFeatureChangeLevelAction.perform(object));
  }

  @Test
  public void testRequestSettingActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("settingName", "Setting");

    JSONObject response = tabsintCha.requestSettingAction.perform(object);
    assertEquals(response.optString("value"), "Requested setting.");
    verify(cha).requestSetting("Setting");
  }

  @Test
  public void testWriteSettingActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("settingName", "Setting");
    object.put("value", 0.0);

    JSONObject response = tabsintCha.writeSettingAction.perform(object);
    assertEquals(response.optString("value"), "Wrote setting.");
    verify(cha).writeSetting("Setting", 0f);
  }

  @Test
  public void testWriteSettingActionThrowsOnInvalidSettingValue() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");
    object.put("settingName", "Setting");
    object.put("value", "Invalid");

    assertThrows(JSONException.class, () -> tabsintCha.writeSettingAction.perform(object));
  }

  @Test
  public void testRequestExamIdActionReturnsValidResponse() throws Exception {
    when(cha.toString()).thenReturn("Mock");
    tabsintCha.chaMap.put("Mock", new TabsintCha.ChaState(cha));

    JSONObject object = new JSONObject();
    object.put("name", "Mock");

    JSONObject response = tabsintCha.requestExamIdAction.perform(object);
    assertEquals(response.optString("value"), "Requested id.");
    verify(cha).requestExamId();
  }

  @Test
  public void testWrappedChaListenerCalibrationEntryReceivedCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);
      com.creare.cha.CalibrationEntry calibrationEntry = mock(com.creare.cha.CalibrationEntry.class);

      chaState.chaListener.calibrationEntryReceived(0, calibrationEntry);

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("CalibrationEntry #0");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerCalibrationListReceivedCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);
      com.creare.cha.CalibrationList calibrationList = mock(com.creare.cha.CalibrationList.class);

      chaState.chaListener.calibrationListReceived(calibrationList);

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("CalibrationList");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerIdReceivedCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);
      com.creare.cha.Id2 id2 = mock(com.creare.cha.Id2.class);

      chaState.chaListener.idReceived(id2);

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("Id");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerProbeIdReceivedCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);
      com.creare.cha.ProbeId probeId = mock(com.creare.cha.ProbeId.class);

      chaState.chaListener.probeIdReceived(probeId);

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("ProbeId");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerStatusReceivedCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);
      com.creare.cha.Status status = mock(com.creare.cha.Status.class);
      when(status.toString()).thenReturn("");

      chaState.chaListener.statusReceived(status);

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("Status");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerErrorReceivedCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);
      com.creare.cha.ChaError error = mock(com.creare.cha.ChaError.class);

      chaState.chaListener.errorReceived(error);

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("Error");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerResultsReceivedCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);
      com.creare.cha.Results results = mock(com.creare.cha.Results.class);

      chaState.chaListener.resultsReceived(results);

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("Result");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerSettingReceivedCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);

      chaState.chaListener.settingReceived(0, 1f);

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("Setting");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerDisconnectedCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);

      chaState.chaListener.disconnected();

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("Disconnected");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerFileProgressCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);

      chaState.chaListener.fileProgress(0, 0);

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("FileProgress");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerDirEntryReceivedCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);
      com.creare.cha.FileDesc fileDesc = mock(com.creare.cha.FileDesc.class);

      chaState.chaListener.dirEntryReceived(fileDesc);

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("DirEntry");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerFileOperationCompleteCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);

      chaState.chaListener.fileOperationComplete("Success");

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("FileOperationComplete");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerSdBytesFreeReceivedCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);

      chaState.chaListener.sdBytesFreeReceived(0);

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("SdBytesFreeReceived");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerFormatCompleteCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);

      chaState.chaListener.formatComplete(0);

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("FormatComplete");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerAssociatedA2dpDiscoveredCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);

      chaState.chaListener.associatedA2dpDiscovered(a2dpCha);

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("AssociatedA2dpDiscovered");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerExamCountReceivedCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);

      chaState.chaListener.examCountReceived(0);

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("ExamCountReceived");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }

  @Test
  public void testWrappedChaListenerCurrentExamReceivedCallsEventListener() throws Exception {
    try (MockedStatic<TabsintCha> mocked = mockStatic(TabsintCha.class)) {
      mocked.when(() -> TabsintCha.createJsonViaIntrospection(any())).thenReturn(new JSONObject());
      TabsintCha.ChaState chaState = new TabsintCha.ChaState(cha);
      when(cha.toString()).thenReturn("Mock");
      tabsintCha.chaMap.put("Mock", chaState);
      tabsintCha.setDeviceListenerCallback(deviceListenerCallback);
      chaState.chaListener = tabsintCha.new WrappedChaListener(chaState);
      com.creare.cha.Exam exam = mock(com.creare.cha.Exam.class);

      chaState.chaListener.currentExamReceived(exam);

      verify(deviceListenerCallback, atLeastOnce()).onEvent(
        argThat(json -> {
          try {
            if (!json.getString("name").equals("Mock")) {
              return false;
            }
            JSONArray array = json.getJSONArray("res");
            return array.getString(0).equals("ExamReceived");
          } catch (Exception e) {
            throw new RuntimeException(e);
          }
        })
      );
    }
  }
}
