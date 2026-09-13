package com.shadow.launcher;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Vibrator;
import android.webkit.JavascriptInterface;
import android.widget.Toast;
import org.json.JSONObject;

public class ShadowNativeBridge {
    private final MainActivity activity;
    private final Vibrator vibrator;

    public ShadowNativeBridge(MainActivity activity) {
        this.activity = activity;
        this.vibrator = (Vibrator) activity.getSystemService(Context.VIBRATOR_SERVICE);
    }

    @JavascriptInterface
    public boolean isNativeApp() {
        return true;
    }

    @JavascriptInterface
    public String getDeviceInfo() {
        try {
            JSONObject obj = new JSONObject();
            obj.put("brand", Build.BRAND);
            obj.put("model", Build.MODEL);
            obj.put("device", Build.DEVICE);
            obj.put("androidVersion", Build.VERSION.RELEASE);
            obj.put("sdkInt", Build.VERSION.SDK_INT);
            obj.put("cpuArch", Build.CPU_ABI);
            obj.put("cpuCores", Runtime.getRuntime().availableProcessors());
            obj.put("totalRamMb", getTotalRamMb());
            obj.put("availRamMb", getAvailableRamMb());
            obj.put("recommendedRamMb", getRecommendedRamMb());
            return obj.toString();
        } catch (Exception e) {
            return "{}";
        }
    }

    @JavascriptInterface
    public int getTotalRamMb() {
        try {
            ActivityManager actManager = (ActivityManager) activity.getSystemService(Context.ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo memInfo = new ActivityManager.MemoryInfo();
            actManager.getMemoryInfo(memInfo);
            return (int) (memInfo.totalMem / (1024 * 1024));
        } catch (Exception e) {
            return 4096;
        }
    }

    @JavascriptInterface
    public int getAvailableRamMb() {
        try {
            ActivityManager actManager = (ActivityManager) activity.getSystemService(Context.ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo memInfo = new ActivityManager.MemoryInfo();
            actManager.getMemoryInfo(memInfo);
            return (int) (memInfo.availMem / (1024 * 1024));
        } catch (Exception e) {
            return 2048;
        }
    }

    @JavascriptInterface
    public int getRecommendedRamMb() {
        int total = getTotalRamMb();
        if (total >= 12000) return 6144;
        if (total >= 8000) return 4096;
        if (total >= 6000) return 3072;
        if (total >= 4000) return 2048;
        return 1536;
    }

    @JavascriptInterface
    public void vibrate(int durationMs) {
        if (vibrator != null && vibrator.hasVibrator()) {
            try {
                vibrator.vibrate(Math.min(durationMs, 250));
            } catch (Exception ignored) {}
        }
    }

    @JavascriptInterface
    public void showToast(final String message) {
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Toast.makeText(activity, message, Toast.LENGTH_SHORT).show();
            }
        });
    }

    @JavascriptInterface
    public void openUrl(String url) {
        try {
            Intent browserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            activity.startActivity(browserIntent);
        } catch (Exception e) {
            showToast("Cannot open link: " + e.getMessage());
        }
    }

    @JavascriptInterface
    public void launchGame(String configJson) {
        final GameConfig config = GameConfig.fromJson(configJson);
        activity.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                activity.onGameLaunched(config);
            }
        });
    }

    @JavascriptInterface
    public String getBatteryInfo() {
        try {
            BatteryManager bm = (BatteryManager) activity.getSystemService(Context.BATTERY_SERVICE);
            int level = bm.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY);
            JSONObject obj = new JSONObject();
            obj.put("level", level);
            return obj.toString();
        } catch (Exception e) {
            return "{\"level\": 100}";
        }
    }
}
