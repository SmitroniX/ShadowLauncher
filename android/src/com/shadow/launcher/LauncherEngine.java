package com.shadow.launcher;

import android.app.ActivityManager;
import android.content.Context;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class LauncherEngine {
    private static final StringBuilder logBuffer = new StringBuilder();

    public static synchronized void log(String message) {
        String time = new SimpleDateFormat("HH:mm:ss", Locale.US).format(new Date());
        String entry = "[" + time + "] " + message + "\n";
        logBuffer.append(entry);
        // Trim if too large
        if (logBuffer.length() > 50000) {
            logBuffer.delete(0, 10000);
        }
    }

    public static synchronized String getLogs() {
        if (logBuffer.length() == 0) {
            log("[ShadowLauncher/INFO]: Pojav-MJ Core ready. No game launched yet.");
        }
        return logBuffer.toString();
    }

    public static synchronized void clearLogs() {
        logBuffer.setLength(0);
    }

    public static int getTotalRamMb(Context ctx) {
        try {
            ActivityManager actManager = (ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
            ActivityManager.MemoryInfo memInfo = new ActivityManager.MemoryInfo();
            actManager.getMemoryInfo(memInfo);
            return (int) (memInfo.totalMem / (1024 * 1024));
        } catch (Exception e) {
            return 8192;
        }
    }

    public static int getRecommendedRamMb(Context ctx) {
        int total = getTotalRamMb(ctx);
        if (total >= 12000) return 6144;
        if (total >= 8000) return 4096;
        if (total >= 6000) return 3072;
        if (total >= 4000) return 2048;
        return 1536;
    }

    public static String buildLaunchCommand(Context ctx, PojavConfig cfg) {
        String gameDir = ctx.getFilesDir().getAbsolutePath() + "/.minecraft";
        return "java -Xms" + (cfg.ramMb / 2) + "M -Xmx" + cfg.ramMb + "M "
                + cfg.jvmArgs + " "
                + "-Dorg.lwjgl.opengl.Display.enableVulkan=" + cfg.selectedRenderer.contains("Vulkan") + " "
                + "-cp " + gameDir + "/libraries/*:" + gameDir + "/versions/" + cfg.selectedVersion + "/" + cfg.selectedVersion + ".jar "
                + "net.minecraft.client.main.Main "
                + "--version " + cfg.selectedVersion + " "
                + "--gameDir " + gameDir + " "
                + "--assetsDir " + gameDir + "/assets "
                + "--username " + cfg.username;
    }
}
