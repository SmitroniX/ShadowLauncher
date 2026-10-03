package com.shadowlauncher.utils;

import android.content.Context;
import android.os.Build;
import android.util.Log;
import android.view.Display;
import android.view.Surface;
import android.view.SurfaceView;
import android.view.Window;
import android.view.WindowManager;

import java.lang.reflect.Field;
import java.lang.reflect.Method;

/**
 * Utility for detecting and unlocking high refresh rates (up to 144Hz / 120Hz / 90Hz)
 * on modern Android mobile displays, setting Window display modes and Surface frame rates.
 */
public final class DisplayUtils {
    private static final String TAG = "DisplayUtils";
    public static final float MAX_TARGET_FPS = 144.0f;

    private DisplayUtils() {}

    /**
     * Get the maximum supported display refresh rate on this device, clamped up to 144Hz.
     */
    public static float getMaxSupportedRefreshRate(Context context) {
        if (context == null) return 60.0f;
        float maxRate = 60.0f;
        try {
            WindowManager wm = (WindowManager) context.getSystemService(Context.WINDOW_SERVICE);
            if (wm != null) {
                Display display = null;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    try {
                        display = context.getDisplay();
                    } catch (Throwable ignored) {}
                }
                if (display == null) {
                    display = wm.getDefaultDisplay();
                }
                if (display != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        Display.Mode[] modes = display.getSupportedModes();
                        if (modes != null) {
                            for (Display.Mode mode : modes) {
                                float rate = mode.getRefreshRate();
                                if (rate > maxRate) {
                                    maxRate = rate;
                                }
                            }
                        }
                    } else {
                        float rate = display.getRefreshRate();
                        if (rate > maxRate) maxRate = rate;
                    }
                }
            }
        } catch (Throwable t) {
            Log.w(TAG, "Failed to inspect supported display modes", t);
        }

        // Clamp to 144Hz max target if screen supports it or beyond
        if (maxRate > MAX_TARGET_FPS) {
            maxRate = MAX_TARGET_FPS;
        }
        return maxRate;
    }

    /**
     * Apply maximum refresh rate to the window attributes (preferredDisplayModeId and refresh rate limits).
     */
    public static void applyHighRefreshRate(Window window) {
        if (window == null) return;
        try {
            Context ctx = window.getContext();
            WindowManager.LayoutParams params = window.getAttributes();
            float maxRate = 60.0f;
            Display display = null;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                try {
                    display = ctx.getDisplay();
                } catch (Throwable ignored) {}
            }
            if (display == null && ctx != null) {
                WindowManager wm = (WindowManager) ctx.getSystemService(Context.WINDOW_SERVICE);
                if (wm != null) display = wm.getDefaultDisplay();
            }

            if (display != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Display.Mode[] modes = display.getSupportedModes();
                Display.Mode bestMode = null;
                if (modes != null) {
                    for (Display.Mode mode : modes) {
                        float rate = mode.getRefreshRate();
                        if (rate > maxRate && rate <= (MAX_TARGET_FPS + 1.0f)) {
                            maxRate = rate;
                            bestMode = mode;
                        }
                    }
                }
                if (bestMode != null) {
                    params.preferredDisplayModeId = bestMode.getModeId();
                    Log.i(TAG, "Configured preferredDisplayModeId=" + bestMode.getModeId() + " (" + maxRate + " Hz)");
                }
                // Also set legacy preferredRefreshRate on API 23+
                try {
                    params.preferredRefreshRate = maxRate;
                } catch (Throwable ignored) {}
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R && maxRate > 60.0f) {
                try {
                    Field minField = WindowManager.LayoutParams.class.getField("preferredMinDisplayRefreshRate");
                    minField.setFloat(params, maxRate);
                    Field maxField = WindowManager.LayoutParams.class.getField("preferredMaxDisplayRefreshRate");
                    maxField.setFloat(params, maxRate);
                    Log.i(TAG, "Configured preferred display refresh rate: " + maxRate + " Hz");
                } catch (Throwable ignored) {}
            }

            window.setAttributes(params);
        } catch (Throwable t) {
            Log.w(TAG, "Failed to apply high refresh rate to window", t);
        }
    }

    /**
     * Set frame rate on a SurfaceView for Android 11+ (API 30+)
     */
    public static void applySurfaceViewFrameRate(SurfaceView surfaceView, float fps) {
        if (surfaceView == null || fps <= 60.0f) return;
        try {
            Method setFrameRateMethod = surfaceView.getClass().getMethod("setFrameRate", float.class, int.class);
            setFrameRateMethod.invoke(surfaceView, fps, 0);
            Log.i(TAG, "Set SurfaceView frame rate to " + fps + " FPS");
        } catch (Throwable ignored) {
            // Handled on Surface level
        }
    }

    /**
     * Set frame rate on a Surface for Android 11+ (API 30+) and Android 12+ (API 31+)
     */
    public static void applySurfaceFrameRate(Surface surface, float fps) {
        if (surface == null || fps <= 60.0f) return;
        try {
            // Try Android 12+ 3-arg setFrameRate(float, int, int)
            Method setFrameRate3 = Surface.class.getMethod("setFrameRate", float.class, int.class, int.class);
            setFrameRate3.invoke(surface, fps, 0, 1); // 0 = FRAME_RATE_COMPATIBILITY_DEFAULT, 1 = CHANGE_FRAME_RATE_ALWAYS
            Log.i(TAG, "Set Surface frame rate to " + fps + " FPS (Android 12+)");
            return;
        } catch (Throwable ignored) {}

        try {
            // Fallback to Android 11 2-arg setFrameRate(float, int)
            Method setFrameRate2 = Surface.class.getMethod("setFrameRate", float.class, int.class);
            setFrameRate2.invoke(surface, fps, 0);
            Log.i(TAG, "Set Surface frame rate to " + fps + " FPS (Android 11)");
        } catch (Throwable t) {
            Log.w(TAG, "Failed to set Surface frame rate", t);
        }
    }
}
