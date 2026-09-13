package com.shadowlauncher.fragments;

import static com.shadowlauncher.Tools.openPath;
import static com.shadowlauncher.Tools.shareLog;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.ImageButton;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;

import com.kdt.mcgui.mcVersionSpinner;

import com.shadowlauncher.CustomControlsActivity;
import com.shadowlauncher.R;
import com.shadowlauncher.Tools;
import com.shadowlauncher.extra.ExtraConstants;
import com.shadowlauncher.extra.ExtraCore;
import com.shadowlauncher.prefs.LauncherPreferences;
import com.shadowlauncher.progresskeeper.ProgressKeeper;
import com.shadowlauncher.value.launcherprofiles.LauncherProfiles;
import com.shadowlauncher.value.launcherprofiles.MinecraftProfile;

import java.io.File;

public class MainMenuFragment extends Fragment {
    public static final String TAG = "MainMenuFragment";

    private mcVersionSpinner mVersionSpinner;

    public MainMenuFragment(){
        super(R.layout.fragment_launcher);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        Button mNewsButton = view.findViewById(R.id.news_button);
        Button mDiscordButton = view.findViewById(R.id.discord_button);
        Button mCustomControlButton = view.findViewById(R.id.custom_control_button);
        Button mInstallJarButton = view.findViewById(R.id.install_jar_button);
        Button mShareLogsButton = view.findViewById(R.id.share_logs_button);
        Button mOpenDirectoryButton = view.findViewById(R.id.open_files_button);

        ImageButton mEditProfileButton = view.findViewById(R.id.edit_profile_button);
        Button mPlayButton = view.findViewById(R.id.play_button);
        mVersionSpinner = view.findViewById(R.id.mc_version_spinner);

        mNewsButton.setOnClickListener(v -> Tools.openURL(requireActivity(), Tools.URL_HOME));
        mDiscordButton.setOnClickListener(v -> Tools.openURL(requireActivity(), getString(R.string.discord_invite)));
        mCustomControlButton.setOnClickListener(v -> startActivity(new Intent(requireContext(), CustomControlsActivity.class)));
        mInstallJarButton.setOnClickListener(v -> runInstallerWithConfirmation(false));
        mInstallJarButton.setOnLongClickListener(v->{
            runInstallerWithConfirmation(true);
            return true;
        });
        mEditProfileButton.setOnClickListener(v -> mVersionSpinner.openProfileEditor(requireActivity()));

        mPlayButton.setOnClickListener(v -> ExtraCore.setValue(ExtraConstants.LAUNCH_GAME, true));

        mShareLogsButton.setOnClickListener((v) -> shareLog(requireContext()));

        mOpenDirectoryButton.setOnClickListener((v)-> {
            showInstanceDirectoryDialog(v.getContext());
        });

        mOpenDirectoryButton.setOnLongClickListener((v) -> {
            openPath(v.getContext(), getCurrentProfileDirectory(), false);
            return true;
        });


        mNewsButton.setOnLongClickListener((v)->{
            Tools.swapFragment(requireActivity(), GamepadMapperFragment.class, GamepadMapperFragment.TAG, null);
            return true;
        });
    }

    private void showInstanceDirectoryDialog(Context context) {
        String currentProfile = LauncherPreferences.DEFAULT_PREF.getString(LauncherPreferences.PREF_KEY_CURRENT_PROFILE, null);
        LauncherProfiles.load();
        MinecraftProfile profileObject = null;
        if (Tools.isValidString(currentProfile) && LauncherProfiles.mainProfileJson != null && LauncherProfiles.mainProfileJson.profiles != null) {
            profileObject = LauncherProfiles.mainProfileJson.profiles.get(currentProfile);
        }
        if (profileObject == null) {
            try {
                profileObject = LauncherProfiles.getCurrentProfile();
            } catch (Exception ignored) {
                profileObject = MinecraftProfile.getDefaultProfile();
            }
        }

        final File instanceDir = Tools.ensureInstanceDirectoryStructure(profileObject);
        final String displayName = (Tools.isValidString(profileObject.name) && !"New".equalsIgnoreCase(profileObject.name))
                ? profileObject.name : (profileObject.lastVersionId != null ? profileObject.lastVersionId : "Default");
        final boolean isInstance = Tools.isIsolatedInstance(profileObject);

        final CharSequence[] items = new CharSequence[] {
            "📁  " + getString(R.string.instance_open_root) + " (" + instanceDir.getName() + ")",
            "🧩  " + getString(R.string.instance_open_mods),
            "🎨  " + getString(R.string.instance_open_resourcepacks),
            "🌍  " + getString(R.string.instance_open_saves),
            "💡  " + getString(R.string.instance_open_shaders),
            "⚙️  " + getString(R.string.instance_open_config),
            "📦  Global Root (.minecraft)"
        };

        AlertDialog.Builder builder = new AlertDialog.Builder(context);
        builder.setTitle((isInstance ? "⚡ " : "") + getString(R.string.instance_select_directory_title) + " - " + displayName);
        builder.setItems(items, (dialog, which) -> {
            File target;
            switch(which) {
                case 1: target = new File(instanceDir, "mods"); break;
                case 2: target = new File(instanceDir, "resourcepacks"); break;
                case 3: target = new File(instanceDir, "saves"); break;
                case 4: target = new File(instanceDir, "shaderpacks"); break;
                case 5: target = new File(instanceDir, "config"); break;
                case 6: target = new File(Tools.DIR_GAME_NEW); break;
                case 0:
                default:
                    target = instanceDir;
                    break;
            }
            if(!target.exists()) target.mkdirs();
            openPath(context, target, false);
        });
        builder.setNegativeButton(android.R.string.cancel, null);
        builder.show();
    }

    private File getCurrentProfileDirectory() {
        String currentProfile = LauncherPreferences.DEFAULT_PREF.getString(LauncherPreferences.PREF_KEY_CURRENT_PROFILE, null);
        if(!Tools.isValidString(currentProfile)) return new File(Tools.DIR_GAME_NEW);
        LauncherProfiles.load();
        MinecraftProfile profileObject = LauncherProfiles.mainProfileJson.profiles.get(currentProfile);
        if(profileObject == null) return new File(Tools.DIR_GAME_NEW);
        return Tools.getGameDirPath(profileObject);
    }

    @Override
    public void onResume() {
        super.onResume();
        mVersionSpinner.reloadProfiles();
    }

    private void runInstallerWithConfirmation(boolean isCustomArgs) {
        if (ProgressKeeper.getTaskCount() == 0)
            Tools.installMod(requireActivity(), isCustomArgs);
        else
            Toast.makeText(requireContext(), R.string.tasks_ongoing, Toast.LENGTH_LONG).show();
    }
}
