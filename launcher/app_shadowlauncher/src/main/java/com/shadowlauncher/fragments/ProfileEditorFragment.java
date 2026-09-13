package com.shadowlauncher.fragments;

import android.content.Context;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.util.Base64OutputStream;
import android.util.Log;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageView;
import android.widget.Spinner;
import android.widget.TextView;

import android.text.Editable;
import android.text.TextWatcher;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.widget.SwitchCompat;
import androidx.fragment.app.Fragment;

import com.shadowlauncher.R;
import com.shadowlauncher.Tools;
import com.shadowlauncher.extra.ExtraConstants;
import com.shadowlauncher.extra.ExtraCore;
import com.shadowlauncher.multirt.MultiRTUtils;
import com.shadowlauncher.multirt.RTSpinnerAdapter;
import com.shadowlauncher.multirt.Runtime;
import com.shadowlauncher.prefs.LauncherPreferences;
import com.shadowlauncher.profiles.ProfileIconCache;
import com.shadowlauncher.profiles.VersionSelectorDialog;
import com.shadowlauncher.utils.CropperUtils;
import com.shadowlauncher.value.launcherprofiles.LauncherProfiles;
import com.shadowlauncher.value.launcherprofiles.MinecraftProfile;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class ProfileEditorFragment extends Fragment implements CropperUtils.CropperListener{
    public static final String TAG = "ProfileEditorFragment";
    public static final String DELETED_PROFILE = "deleted_profile";

    private String mProfileKey;
    private MinecraftProfile mTempProfile = null;
    private String mValueToConsume = "";
    private Button mSaveButton, mDeleteButton, mControlSelectButton, mGameDirButton, mVersionSelectButton;
    private Spinner mDefaultRuntime, mDefaultRenderer;
    private EditText mDefaultName, mDefaultJvmArgument;
    private TextView mDefaultPath, mDefaultVersion, mDefaultControl;
    private ImageView mProfileIcon;
    private SwitchCompat mInstanceSwitch;
    private View mInstanceShortcutsContainer;
    private Button mInstanceModsBtn, mInstancePacksBtn, mInstanceSavesBtn, mInstanceShadersBtn, mInstanceRootBtn;
    private final ActivityResultLauncher<?> mCropperLauncher = CropperUtils.registerCropper(this, this);

    private List<String> mRenderNames;

    public ProfileEditorFragment(){
        super(R.layout.fragment_profile_editor);
    }

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        // Paths, which can be changed
        String value = (String) ExtraCore.consumeValue(ExtraConstants.FILE_SELECTOR);
        if(value != null){
            if(mValueToConsume.equals(FileSelectorFragment.BUNDLE_SELECT_FOLDER)){
                mTempProfile.gameDir = value;
            }else{
                mTempProfile.controlFile = value;
            }
        }
        return super.onCreateView(inflater, container, savedInstanceState);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        bindViews(view);

        Tools.RenderersList renderersList = Tools.getCompatibleRenderers(view.getContext());
        mRenderNames = renderersList.rendererIds;
        List<String> renderList = new ArrayList<>(renderersList.rendererDisplayNames.length + 1);
        renderList.addAll(Arrays.asList(renderersList.rendererDisplayNames));
        renderList.add(view.getContext().getString(R.string.global_default));
        mDefaultRenderer.setAdapter(new ArrayAdapter<>(getContext(), R.layout.item_simple_list_1, renderList));

        // Set up behaviors
        mSaveButton.setOnClickListener(v -> {
            ProfileIconCache.dropIcon(mProfileKey);
            save();
            Tools.backToMainMenu(requireActivity());
        });

        mDeleteButton.setOnClickListener(v -> {
            if(LauncherProfiles.mainProfileJson.profiles.size() > 1){
                ProfileIconCache.dropIcon(mProfileKey);
                LauncherProfiles.mainProfileJson.profiles.remove(mProfileKey);
                LauncherProfiles.write();
                ExtraCore.setValue(ExtraConstants.REFRESH_VERSION_SPINNER, DELETED_PROFILE);
            }

            Tools.removeCurrentFragment(requireActivity());
        });


        View.OnClickListener gameDirListener = getGameDirListener();
        mGameDirButton.setOnClickListener(gameDirListener);
        mDefaultPath.setOnClickListener(gameDirListener);

        View.OnClickListener controlSelectListener = getControlSelectListener();
        mControlSelectButton.setOnClickListener(controlSelectListener);
        mDefaultControl.setOnClickListener(controlSelectListener);

        // Setup the expendable list behavior
        View.OnClickListener versionSelectListener = getVersionSelectListener();
        mVersionSelectButton.setOnClickListener(versionSelectListener);
        mDefaultVersion.setOnClickListener(versionSelectListener);

        // Set up the icon change click listener
        mProfileIcon.setOnClickListener(v -> CropperUtils.startCropper(mCropperLauncher));

        // Instance switch behavior
        mInstanceSwitch.setOnCheckedChangeListener((buttonView, isChecked) -> {
            mInstanceShortcutsContainer.setVisibility(isChecked ? View.VISIBLE : View.GONE);
            if(isChecked) {
                String cur = mDefaultPath.getText().toString().trim();
                if(cur.isEmpty() || cur.equals(".minecraft")) {
                    String instancePath = Tools.generateInstancePath(mDefaultName.getText().toString());
                    mDefaultPath.setText(instancePath);
                    if(mTempProfile != null) mTempProfile.gameDir = instancePath;
                }
            } else {
                mDefaultPath.setText("");
                if(mTempProfile != null) mTempProfile.gameDir = null;
            }
        });

        // Sync instance path with instance name when typing
        mDefaultName.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if(mInstanceSwitch != null && mInstanceSwitch.isChecked()) {
                    String curPath = mDefaultPath.getText().toString().trim();
                    if(curPath.isEmpty() || curPath.startsWith("./instances/") || curPath.startsWith("instances/")) {
                        String newPath = Tools.generateInstancePath(s.toString());
                        mDefaultPath.setText(newPath);
                        if(mTempProfile != null) mTempProfile.gameDir = newPath;
                    }
                }
            }
            @Override
            public void afterTextChanged(Editable s) {}
        });

        // Instance folder quick action buttons
        mInstanceModsBtn.setOnClickListener(v -> openInstanceSubdir("mods"));
        mInstancePacksBtn.setOnClickListener(v -> openInstanceSubdir("resourcepacks"));
        mInstanceSavesBtn.setOnClickListener(v -> openInstanceSubdir("saves"));
        mInstanceShadersBtn.setOnClickListener(v -> openInstanceSubdir("shaderpacks"));
        mInstanceRootBtn.setOnClickListener(v -> openInstanceSubdir(null));

        loadValues(LauncherPreferences.DEFAULT_PREF.getString(LauncherPreferences.PREF_KEY_CURRENT_PROFILE, ""), view.getContext());
    }

    private View.OnClickListener getGameDirListener() {
        return v -> {
            Bundle bundle = new Bundle(2);
            bundle.putBoolean(FileSelectorFragment.BUNDLE_SELECT_FOLDER, true);
            bundle.putString(FileSelectorFragment.BUNDLE_ROOT_PATH, Tools.DIR_GAME_HOME);
            bundle.putBoolean(FileSelectorFragment.BUNDLE_SHOW_FILE, false);
            mValueToConsume = FileSelectorFragment.BUNDLE_SELECT_FOLDER;

            Tools.swapFragment(requireActivity(),
                    FileSelectorFragment.class, FileSelectorFragment.TAG, bundle);
        };
    }

    private View.OnClickListener getControlSelectListener() {
        return v -> {
            Bundle bundle = new Bundle(3);
            bundle.putBoolean(FileSelectorFragment.BUNDLE_SELECT_FOLDER, false);
            bundle.putString(FileSelectorFragment.BUNDLE_ROOT_PATH, Tools.CTRLMAP_PATH);
            mValueToConsume = FileSelectorFragment.BUNDLE_SELECT_FILE;

            Tools.swapFragment(requireActivity(),
                    FileSelectorFragment.class, FileSelectorFragment.TAG, bundle);
        };
    }

    private View.OnClickListener getVersionSelectListener() {
        return v -> VersionSelectorDialog.open(v.getContext(), false, (id, snapshot)-> {
            mTempProfile.lastVersionId = id;
            mDefaultVersion.setText(id);
        });
    }


    private void loadValues(@NonNull String profile, @NonNull Context context){
        if(mTempProfile == null){
            mTempProfile = getProfile(profile);
        }
        mProfileIcon.setImageDrawable(
                ProfileIconCache.fetchIcon(getResources(), mProfileKey, mTempProfile.icon)
        );

        // Runtime spinner
        List<Runtime> runtimes = MultiRTUtils.getRuntimes();
        int jvmIndex = runtimes.indexOf(new Runtime("<Default>"));
        if (mTempProfile.javaDir != null) {
            String selectedRuntime = mTempProfile.javaDir.substring(Tools.LAUNCHERPROFILES_RTPREFIX.length());
            int nindex = runtimes.indexOf(new Runtime(selectedRuntime));
            if (nindex != -1) jvmIndex = nindex;
        }
        mDefaultRuntime.setAdapter(new RTSpinnerAdapter(context, runtimes));
        if(jvmIndex == -1) jvmIndex = runtimes.size() - 1;
        mDefaultRuntime.setSelection(jvmIndex);

        // Renderer spinner
        int rendererIndex = mDefaultRenderer.getAdapter().getCount() - 1;
        if(mTempProfile.pojavRendererName != null) {
            int nindex = mRenderNames.indexOf(mTempProfile.pojavRendererName);
            if(nindex != -1) rendererIndex = nindex;
        }
        mDefaultRenderer.setSelection(rendererIndex);

        mDefaultVersion.setText(mTempProfile.lastVersionId);
        mDefaultJvmArgument.setText(mTempProfile.javaArgs == null ? "" : mTempProfile.javaArgs);
        mDefaultName.setText(mTempProfile.name);
        mDefaultControl.setText(mTempProfile.controlFile == null ? "" : mTempProfile.controlFile);

        boolean isInstance = Tools.isIsolatedInstance(mTempProfile) || (getArguments() != null);
        mInstanceSwitch.setChecked(isInstance);
        mInstanceShortcutsContainer.setVisibility(isInstance ? View.VISIBLE : View.GONE);
        if (isInstance && (mTempProfile.gameDir == null || mTempProfile.gameDir.trim().isEmpty())) {
            mTempProfile.gameDir = Tools.generateInstancePath(mTempProfile.name);
        }
        mDefaultPath.setText(mTempProfile.gameDir == null ? "" : mTempProfile.gameDir);
    }

    private MinecraftProfile getProfile(@NonNull String profile){
        MinecraftProfile minecraftProfile;
        if(getArguments() == null) {
            LauncherProfiles.load();
            MinecraftProfile originalProfile = LauncherProfiles.mainProfileJson.profiles.get(profile);
            if(originalProfile != null) minecraftProfile = new MinecraftProfile(originalProfile);
            else minecraftProfile = MinecraftProfile.createTemplate();
            mProfileKey = profile;
        }else{
            minecraftProfile = MinecraftProfile.createTemplate();
            minecraftProfile.gameDir = Tools.generateInstancePath(minecraftProfile.name);
            mProfileKey = LauncherProfiles.getFreeProfileKey();
        }
        return minecraftProfile;
    }


    private void bindViews(@NonNull View view){
        mDefaultControl = view.findViewById(R.id.vprof_editor_ctrl_spinner);
        mDefaultRuntime = view.findViewById(R.id.vprof_editor_spinner_runtime);
        mDefaultRenderer = view.findViewById(R.id.vprof_editor_profile_renderer);
        mDefaultVersion = view.findViewById(R.id.vprof_editor_version_spinner);

        mDefaultPath = view.findViewById(R.id.vprof_editor_path);
        mDefaultName = view.findViewById(R.id.vprof_editor_profile_name);
        mDefaultJvmArgument = view.findViewById(R.id.vprof_editor_jre_args);

        mSaveButton = view.findViewById(R.id.vprof_editor_save_button);
        mDeleteButton = view.findViewById(R.id.vprof_editor_delete_button);
        mControlSelectButton = view.findViewById(R.id.vprof_editor_ctrl_button);
        mVersionSelectButton = view.findViewById(R.id.vprof_editor_version_button);
        mGameDirButton = view.findViewById(R.id.vprof_editor_path_button);
        mProfileIcon = view.findViewById(R.id.vprof_editor_profile_icon);

        mInstanceSwitch = view.findViewById(R.id.vprof_editor_instance_switch);
        mInstanceShortcutsContainer = view.findViewById(R.id.vprof_editor_instance_shortcuts_container);
        mInstanceModsBtn = view.findViewById(R.id.vprof_editor_instance_mods_btn);
        mInstancePacksBtn = view.findViewById(R.id.vprof_editor_instance_packs_btn);
        mInstanceSavesBtn = view.findViewById(R.id.vprof_editor_instance_saves_btn);
        mInstanceShadersBtn = view.findViewById(R.id.vprof_editor_instance_shaders_btn);
        mInstanceRootBtn = view.findViewById(R.id.vprof_editor_instance_root_btn);
    }

    private void updateTempProfilePaths() {
        if(mTempProfile == null) return;
        mTempProfile.name = mDefaultName.getText().toString();
        String path = mDefaultPath.getText().toString().trim();
        if(mInstanceSwitch != null && mInstanceSwitch.isChecked()) {
            if(path.isEmpty() || path.equals(".minecraft")) {
                path = Tools.generateInstancePath(mTempProfile.name);
                mDefaultPath.setText(path);
            }
            mTempProfile.gameDir = path;
        } else {
            mTempProfile.gameDir = path.isEmpty() ? null : path;
        }
    }

    private void openInstanceSubdir(@Nullable String subfolder) {
        updateTempProfilePaths();
        File root = Tools.ensureInstanceDirectoryStructure(mTempProfile);
        File target = (subfolder != null) ? new File(root, subfolder) : root;
        if(!target.exists()) target.mkdirs();
        try {
            Tools.openPath(requireContext(), target, false);
            Toast.makeText(requireContext(), getString(R.string.instance_folder_toast, target.getName()), Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Toast.makeText(requireContext(), target.getAbsolutePath(), Toast.LENGTH_LONG).show();
        }
    }

    private void save(){
        //First, check for potential issues in the inputs
        updateTempProfilePaths();
        if(mInstanceSwitch != null && mInstanceSwitch.isChecked()) {
            Tools.ensureInstanceDirectoryStructure(mTempProfile);
        }

        mTempProfile.lastVersionId = mDefaultVersion.getText().toString();
        mTempProfile.controlFile = mDefaultControl.getText().toString();
        mTempProfile.javaArgs = mDefaultJvmArgument.getText().toString();

        if(mTempProfile.controlFile.isEmpty()) mTempProfile.controlFile = null;
        if(mTempProfile.javaArgs.isEmpty()) mTempProfile.javaArgs = null;

        Runtime selectedRuntime = (Runtime) mDefaultRuntime.getSelectedItem();
        mTempProfile.javaDir = (selectedRuntime.name.equals("<Default>") || selectedRuntime.versionString == null)
                ? null : Tools.LAUNCHERPROFILES_RTPREFIX + selectedRuntime.name;

        if(mDefaultRenderer.getSelectedItemPosition() == mRenderNames.size()) mTempProfile.pojavRendererName = null;
        else mTempProfile.pojavRendererName = mRenderNames.get(mDefaultRenderer.getSelectedItemPosition());

        LauncherProfiles.mainProfileJson.profiles.put(mProfileKey, mTempProfile);
        LauncherProfiles.write();
        ExtraCore.setValue(ExtraConstants.REFRESH_VERSION_SPINNER, mProfileKey);
    }

    @Override
    public void onCropped(Bitmap contentBitmap) {
        mProfileIcon.setImageBitmap(contentBitmap);
        Log.i("bitmap", "w="+contentBitmap.getWidth() +" h="+contentBitmap.getHeight());
        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        try (Base64OutputStream base64OutputStream = new Base64OutputStream(byteArrayOutputStream, Base64.NO_WRAP)) {
            contentBitmap.compress(
                Build.VERSION.SDK_INT < Build.VERSION_CODES.R ?
                    // On Android < 30, there was no distinction between "lossy" and "lossless",
                    // and the type is picked by the quality parameter. We set the quality to 60.
                    // so it should be lossy,
                    Bitmap.CompressFormat.WEBP:
                    // On Android >= 30, we can explicitly specify that we want lossy compression
                    // with the visual quality of 60.
                    Bitmap.CompressFormat.WEBP_LOSSY,
                60,
                base64OutputStream
            );
            base64OutputStream.flush();
            byteArrayOutputStream.flush();
        }catch (IOException e) {
            Tools.showErrorRemote(e);
            return;
        }
        String iconLine = new String(byteArrayOutputStream.toByteArray(), StandardCharsets.UTF_8);
        mTempProfile.icon = "data:image/webp;base64," + iconLine;
    }

    @Override
    public void onFailed(Exception exception) {
        Tools.showErrorRemote(exception);
    }
}
