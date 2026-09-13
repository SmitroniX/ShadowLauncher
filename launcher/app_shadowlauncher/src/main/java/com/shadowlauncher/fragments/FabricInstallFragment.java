package com.shadowlauncher.fragments;

import com.shadowlauncher.modloaders.FabriclikeUtils;
import com.shadowlauncher.modloaders.ModloaderListenerProxy;

public class FabricInstallFragment extends FabriclikeInstallFragment {

    public static final String TAG = "FabricInstallFragment";

    public FabricInstallFragment() {
        super(FabriclikeUtils.FABRIC_UTILS, TAG);
    }
}
