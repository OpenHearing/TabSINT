package com.creare.tabsint;
 
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import java.util.ArrayList;
import com.creare.tabsintfs.TabsintFsPlugin;
 
public class MainActivity extends BridgeActivity {
    @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    registerPlugin(TabsintFsPlugin.class);
  }
}