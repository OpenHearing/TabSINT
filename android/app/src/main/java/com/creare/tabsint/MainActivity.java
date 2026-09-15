package com.creare.tabsint;

import android.os.Bundle;
import com.creare.tabsintfs.TabsintFsPlugin;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    registerPlugin(TabsintFsPlugin.class);
  }
}
