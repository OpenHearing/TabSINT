package com.creare.tabsintcha;

import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

import com.creare.tabsintcha.TabsintCha;
import com.creare.tabsintcha.TabsintChaPlugin;
import com.getcapacitor.JSObject;
import com.getcapacitor.PluginCall;
import org.json.JSONException;
import org.json.JSONObject;
import org.junit.Before;
import org.junit.Test;

/**
 * Unit testing for TabsintChaPlugin.
 */
public class TabsintChaPluginUnitTest {

  TabsintChaPlugin tabsintChaPlugin;
  PluginCall mockCall;

  @Before
  public void initialize() {
    tabsintChaPlugin = new TabsintChaPlugin();
    mockCall = mock(PluginCall.class);
  }

  @Test
  public void testExecuteResolvesOnSuccess() {
    TabsintCha.Action action = new TabsintCha.Action() {
      public JSONObject perform(JSONObject inputData) throws Exception {
        return new JSONObject();
      }
    };
    when(mockCall.getData()).thenReturn(new JSObject());

    tabsintChaPlugin.execute(mockCall, action);

    verify(mockCall).resolve(any(JSObject.class));
  }

  @Test
  public void testExecuteRejectsOnError() {
    TabsintCha.Action action = new TabsintCha.Action() {
      public JSONObject perform(JSONObject inputData) throws Exception {
        throw new IllegalArgumentException("Rejected");
      }
    };
    when(mockCall.getData()).thenReturn(new JSObject());

    tabsintChaPlugin.execute(mockCall, action);

    verify(mockCall).reject("Rejected");
  }

  @Test
  public void testGetDeviceDiscoveryEventNameReturnsExpectedString() {
    when(mockCall.getData()).thenReturn(new JSObject());

    tabsintChaPlugin.getDeviceDiscoveryEventName(mockCall);

    verify(mockCall).resolve(argThat(json -> "TabsintChaDiscovery".equals(json.getString("value"))));
  }

  @Test
  public void testGetDeviceResponseEventNameReturnsExpectedString() {
    when(mockCall.getData()).thenReturn(new JSObject());

    tabsintChaPlugin.getDeviceResponseEventName(mockCall);

    verify(mockCall).resolve(argThat(json -> "TabsintChaDevice".equals(json.getString("value"))));
  }
}
