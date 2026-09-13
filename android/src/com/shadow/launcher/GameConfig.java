package com.shadow.launcher;

import org.json.JSONObject;

public class GameConfig {
    private String version = "1.21.1";
    private String loader = "Fabric";
    private int memoryMb = 4096;
    private String renderer = "VulkanMod"; // VulkanMod, Holy GL4ES, ANGLE
    private String jvmFlags = "-XX:+UseG1GC -XX:+UnlockExperimentalVMOptions -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M";
    private boolean lowMemoryMode = false;
    private int renderDistance = 8;
    private int maxFps = 120;
    private String username = "ShadowPlayer";

    public GameConfig() {}

    public static GameConfig fromJson(String jsonStr) {
        GameConfig cfg = new GameConfig();
        try {
            JSONObject obj = new JSONObject(jsonStr);
            if (obj.has("version")) cfg.version = obj.getString("version");
            if (obj.has("loader")) cfg.loader = obj.getString("loader");
            if (obj.has("memoryMb")) cfg.memoryMb = obj.getInt("memoryMb");
            if (obj.has("renderer")) cfg.renderer = obj.getString("renderer");
            if (obj.has("jvmFlags")) cfg.jvmFlags = obj.getString("jvmFlags");
            if (obj.has("lowMemoryMode")) cfg.lowMemoryMode = obj.getBoolean("lowMemoryMode");
            if (obj.has("renderDistance")) cfg.renderDistance = obj.getInt("renderDistance");
            if (obj.has("maxFps")) cfg.maxFps = obj.getInt("maxFps");
            if (obj.has("username")) cfg.username = obj.getString("username");
        } catch (Exception e) {
            // fallback to defaults
        }
        return cfg;
    }

    public String toJson() {
        try {
            JSONObject obj = new JSONObject();
            obj.put("version", version);
            obj.put("loader", loader);
            obj.put("memoryMb", memoryMb);
            obj.put("renderer", renderer);
            obj.put("jvmFlags", jvmFlags);
            obj.put("lowMemoryMode", lowMemoryMode);
            obj.put("renderDistance", renderDistance);
            obj.put("maxFps", maxFps);
            obj.put("username", username);
            return obj.toString();
        } catch (Exception e) {
            return "{}";
        }
    }

    public String getVersion() { return version; }
    public String getLoader() { return loader; }
    public int getMemoryMb() { return memoryMb; }
    public String getRenderer() { return renderer; }
    public String getJvmFlags() { return jvmFlags; }
    public boolean isLowMemoryMode() { return lowMemoryMode; }
    public int getRenderDistance() { return renderDistance; }
    public int getMaxFps() { return maxFps; }
    public String getUsername() { return username; }
}
