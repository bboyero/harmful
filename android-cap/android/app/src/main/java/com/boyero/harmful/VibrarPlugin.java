package com.boyero.harmful;

import android.content.Context;
import android.os.Build;
import android.os.VibrationEffect;
import android.os.Vibrator;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import android.util.Log;

import org.json.JSONArray;

import java.util.ArrayList;
import java.util.List;

// Vibración nativa: el WebView de algunos móviles no implementa
// navigator.vibrate — este plugin usa el Vibrator de Android directamente
// (funciona en CUALQUIER dispositivo Android con vibrador).
// OJO: la clase debe ser PUBLIC — Capacitor la instancia por reflexión desde
// su propio paquete y una clase package-private da IllegalAccessException.
@CapacitorPlugin(name = "Vibrar")
public class VibrarPlugin extends Plugin {

    private Vibrator vibrator() {
        return (Vibrator) getContext().getSystemService(Context.VIBRATOR_SERVICE);
    }

    @PluginMethod
    public void vibrar(PluginCall call) {
        long ms = call.getLong("duracion", 50L);
        Vibrator v = vibrator();
        Log.i("HARMFUL", "vibrar(" + ms + ") hasVibrator=" + (v != null && v.hasVibrator()));
        if (v != null && v.hasVibrator()) {
            if (Build.VERSION.SDK_INT >= 26) {
                v.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
            } else {
                v.vibrate(ms);
            }
        }
        call.resolve();
    }

    // Patrón [vibrar, pausa, vibrar...] en ms (alternando vibración y silencio)
    @PluginMethod
    public void patron(PluginCall call) {
        try {
            JSONArray arr = call.getArray("milis");
            List<Long> tiempos = new ArrayList<>();
            for (int i = 0; i < arr.length(); i++) tiempos.add(arr.getLong(i));
            Vibrator v = vibrator();
            if (v != null && v.hasVibrator()) {
                long[] pat = new long[tiempos.size()];
                for (int i = 0; i < pat.length; i++) pat[i] = tiempos.get(i);
                if (Build.VERSION.SDK_INT >= 26) {
                    v.vibrate(VibrationEffect.createWaveform(pat, -1));
                } else {
                    v.vibrate(pat, -1);
                }
            }
        } catch (Exception e) {
            // patrón inválido: al menos un golpe simple
            call.reject("patrón inválido", e);
            return;
        }
        call.resolve();
    }
}
