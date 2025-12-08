package com.creare.tabsintcha.android;

import static org.junit.Assert.*;

import android.content.Context;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;

/**
 * Instrumented test, which will execute on an Android device.
 *
 * @see <a href="http://d.android.com/tools/testing">Testing documentation</a>
 */
@RunWith(AndroidJUnit4.class)
public class TabsintChaInstrumentedTest {

  @Test
  public void useAppContext() throws Exception {
    Context appContext =
      InstrumentationRegistry.getInstrumentation().getTargetContext();
    assertEquals("com.creare.tabsintcha", appContext.getPackageName());
  }
}
