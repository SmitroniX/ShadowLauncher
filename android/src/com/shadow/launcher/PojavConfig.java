package com.shadow.launcher;

import android.content.Context;
import android.content.SharedPreferences;

public class PojavConfig {
    private static final String PREF_NAME = "shadow_pojav_prefs";

    public String selectedVersion = "1.21.1";
    public String selectedLoader = "Fabric 0.16.0";
    public String selectedJre = "Java 21 (LTS OpenJDK)";
    public String selectedRenderer = "VulkanMod 1.3";
    public int ramMb = 4096;
    public int maxFps = 120;
    public String jvmArgs = "-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -Dshadow.renderer=VulkanMod";
    public String username = "ShadowPlayer_99";
    public boolean virtualMouseEnabled = false;

    public static PojavConfig load(Context context) {
        PojavConfig cfg = new PojavConfig();
        SharedPreferences p = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        cfg.selectedVersion = p.getString("version", "1.21.1");
        cfg.selectedLoader = p.getString("loader", "Fabric 0.16.0");
        cfg.selectedJre = p.getString("jre", "Java 21 (LTS OpenJDK)");
        cfg.selectedRenderer = p.getString("renderer", "VulkanMod 1.3");
        cfg.ramMb = p.getInt("ram_mb", 4096);
        cfg.maxFps = p.getInt("max_fps", 120);
        cfg.jvmArgs = p.getString("jvm_args", cfg.jvmArgs);
        cfg.username = p.getString("username", "ShadowPlayer_99");
        return cfg;
    }

    public void save(Context context) {
        SharedPreferences.Editor e = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE).edit();
        e.putString("version", selectedVersion);
        e.putString("loader", selectedLoader);
        e.putString("jre", selectedJre);
        e.putString("renderer", selectedRenderer);
        e.putInt("ram_mb", ramMb);
        e.putInt("max_fps", maxFps);
        e.putString("jvm_args", jvmArgs);
        e.putString("username", username);
        e.apply();
    }
}
