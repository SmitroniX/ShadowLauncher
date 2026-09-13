package com.shadowlauncher;

import static com.shadowlauncher.Architecture.archAsString;

import android.app.Activity;
import android.content.res.AssetManager;
import android.util.Log;

import com.shadowlauncher.multirt.MultiRTUtils;
import com.shadowlauncher.multirt.Runtime;
import com.shadowlauncher.utils.MathUtils;
import com.shadowlauncher.value.launcherprofiles.LauncherProfiles;
import com.shadowlauncher.value.launcherprofiles.MinecraftProfile;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class NewJREUtil {
    private static final Pattern SNAPSHOT_PATTERN =
            Pattern.compile("\\b([12][0-9])w([0-9]{2})[a-z]\\b", Pattern.CASE_INSENSITIVE);
    private static final Pattern VERSION_PATTERN =
            Pattern.compile("1\\.(\\d+)(?:\\.(\\d+))?");

    public static int parseMinecraftVersionToJava(String versionStr) {
        if (versionStr == null || versionStr.trim().isEmpty()) return 8;

        Matcher snapMatcher = SNAPSHOT_PATTERN.matcher(versionStr);
        if (snapMatcher.find()) {
            try {
                int year = Integer.parseInt(snapMatcher.group(1));
                if (year >= 24) return 21;
                if (year >= 21) return 17;
                return 8;
            } catch (Exception ignored) {}
        }

        Matcher verMatcher = VERSION_PATTERN.matcher(versionStr);
        int lastMinor = -1;
        int lastPatch = 0;
        while (verMatcher.find()) {
            try {
                lastMinor = Integer.parseInt(verMatcher.group(1));
                lastPatch = verMatcher.group(2) != null ? Integer.parseInt(verMatcher.group(2)) : 0;
            } catch (Exception ignored) {}
        }

        if (lastMinor != -1) {
            if (lastMinor >= 21) return 21;
            if (lastMinor == 20 && lastPatch >= 5) return 21;
            if (lastMinor >= 17) return 17;
            return 8;
        }

        return 8;
    }

    public static int detectRequiredJavaVersion(JMinecraftVersionList.Version versionInfo, String versionId) {
        if (versionInfo != null && versionInfo.javaVersion != null && versionInfo.javaVersion.majorVersion > 0) {
            int major = versionInfo.javaVersion.majorVersion;
            if (major >= 21) return 21;
            if (major >= 16) return 17;
            return 8;
        }

        if (versionInfo != null && versionInfo.inheritsFrom != null && !versionInfo.inheritsFrom.trim().isEmpty()) {
            int fromInherits = parseMinecraftVersionToJava(versionInfo.inheritsFrom);
            if (fromInherits > 0) return fromInherits;
        }

        if (versionId != null && !versionId.trim().isEmpty()) {
            int fromId = parseMinecraftVersionToJava(versionId);
            if (fromId > 0) return fromId;
        }

        if (versionInfo != null && versionInfo.id != null && !versionInfo.id.trim().isEmpty()) {
            int fromInfoId = parseMinecraftVersionToJava(versionInfo.id);
            if (fromInfoId > 0) return fromInfoId;
        }

        return 8;
    }

    public static InternalRuntime getInternalRuntimeForVersion(int majorVersion) {
        if (majorVersion >= 21) return InternalRuntime.JRE_21;
        if (majorVersion >= 17) return InternalRuntime.JRE_17;
        return InternalRuntime.JRE_8;
    }

    public static boolean unpackInternalRuntimeSync(AssetManager assetManager, int targetMajorVersion) {
        if (assetManager == null) return false;
        InternalRuntime internalRuntime = getInternalRuntimeForVersion(targetMajorVersion);
        return checkInternalRuntime(assetManager, internalRuntime);
    }

    public static boolean checkInternalRuntime(AssetManager assetManager, InternalRuntime internalRuntime) {
        String launcher_runtime_version;
        String installed_runtime_version = MultiRTUtils.readInternalRuntimeVersion(internalRuntime.name);
        try {
            launcher_runtime_version = Tools.read(assetManager.open(internalRuntime.path + "/version"));
        } catch (IOException exc) {
            // We don't have a runtime included in assets
            return installed_runtime_version != null;
        }
        if (!launcher_runtime_version.equals(installed_runtime_version)) {
            return unpackInternalRuntime(assetManager, internalRuntime, launcher_runtime_version);
        } else {
            return true;
        }
    }

    private static boolean unpackInternalRuntime(AssetManager assetManager, InternalRuntime internalRuntime, String version) {
        try {
            MultiRTUtils.installRuntimeNamedBinpack(
                    assetManager.open(internalRuntime.path + "/universal.tar.xz"),
                    assetManager.open(internalRuntime.path + "/bin-" + archAsString(Tools.DEVICE_ARCHITECTURE) + ".tar.xz"),
                    internalRuntime.name, version);
            MultiRTUtils.postPrepare(internalRuntime.name);
            return true;
        } catch (IOException e) {
            Log.e("NewJREAuto", "Internal JRE unpack failed", e);
            return false;
        }
    }

    public static InternalRuntime getInternalRuntime(Runtime runtime) {
        for (InternalRuntime internalRuntime : InternalRuntime.values()) {
            if (internalRuntime.name.equals(runtime.name)) return internalRuntime;
        }
        return null;
    }

    private static MathUtils.RankedValue<Runtime> getNearestInstalledRuntime(int targetVersion) {
        List<Runtime> runtimes = MultiRTUtils.getRuntimes();
        return MathUtils.findNearestPositive(targetVersion, runtimes, (runtime) -> runtime.javaVersion);
    }

    private static MathUtils.RankedValue<InternalRuntime> getNearestInternalRuntime(int targetVersion) {
        List<InternalRuntime> runtimeList = Arrays.asList(InternalRuntime.values());
        return MathUtils.findNearestPositive(targetVersion, runtimeList, (runtime) -> runtime.majorVersion);
    }

    /** @return true if everything is good, false otherwise. */
    public static boolean installNewJreIfNeeded(Activity activity, JMinecraftVersionList.Version versionInfo) {
        int gameRequiredVersion = detectRequiredJavaVersion(versionInfo, versionInfo != null ? versionInfo.id : null);

        LauncherProfiles.load();
        AssetManager assetManager = activity.getAssets();
        MinecraftProfile minecraftProfile = LauncherProfiles.getCurrentProfile();
        String profileRuntime = Tools.getSelectedRuntime(minecraftProfile);
        Runtime runtime = MultiRTUtils.read(profileRuntime);

        // Check if user-selected runtime is sufficient
        if (runtime != null && runtime.javaVersion >= gameRequiredVersion) {
            InternalRuntime internalRuntime = getInternalRuntime(runtime);
            if (internalRuntime != null) {
                return checkInternalRuntime(assetManager, internalRuntime);
            }
            return true;
        }

        // Pick nearest runtime
        MathUtils.RankedValue<?> nearestInstalledRuntime = getNearestInstalledRuntime(gameRequiredVersion);
        MathUtils.RankedValue<?> nearestInternalRuntime = getNearestInternalRuntime(gameRequiredVersion);

        MathUtils.RankedValue<?> selectedRankedRuntime = MathUtils.objectMin(
                nearestInternalRuntime, nearestInstalledRuntime, (value) -> value.rank
        );

        if (selectedRankedRuntime == null) {
            showRuntimeFail(activity, gameRequiredVersion);
            return false;
        }

        Object selected = selectedRankedRuntime.value;
        String appropriateRuntime;
        InternalRuntime internalRuntime;

        if (selected instanceof Runtime) {
            Runtime selectedRuntime = (Runtime) selected;
            appropriateRuntime = selectedRuntime.name;
            internalRuntime = getInternalRuntime(selectedRuntime);
        } else if (selected instanceof InternalRuntime) {
            internalRuntime = (InternalRuntime) selected;
            appropriateRuntime = internalRuntime.name;
        } else {
            throw new RuntimeException("Unexpected type of selected: " + selected.getClass().getName());
        }

        if (internalRuntime != null && !checkInternalRuntime(assetManager, internalRuntime)) {
            return false;
        }

        minecraftProfile.javaDir = Tools.LAUNCHERPROFILES_RTPREFIX + appropriateRuntime;
        LauncherProfiles.write();
        return true;
    }

    private static void showRuntimeFail(Activity activity, int requiredJavaVersion) {
        Tools.dialogOnUiThread(activity, activity.getString(R.string.global_error),
                activity.getString(R.string.multirt_nocompatiblert, requiredJavaVersion));
    }

    public enum InternalRuntime {
        JRE_8(8, "Internal", "components/jre"),
        JRE_17(17, "Internal-17", "components/jre-new"),
        JRE_21(21, "Internal-21", "components/jre-21");

        public final int majorVersion;
        public final String name;
        public final String path;

        InternalRuntime(int majorVersion, String name, String path) {
            this.majorVersion = majorVersion;
            this.name = name;
            this.path = path;
        }
    }
}