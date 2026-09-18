package com.boyero.harmful;

import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        try {
            registerPlugin(VibrarPlugin.class);
        } catch (Exception e) {
            Log.e("HARMFUL", "No se pudo registrar VibrarPlugin", e);
        }
        super.onCreate(savedInstanceState);
    }
}
