package com.kdt.mcgui;

import android.content.Context;
import android.content.res.Resources;
import android.text.TextUtils;
import android.util.AttributeSet;
import android.util.TypedValue;
import android.view.Gravity;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.content.res.ResourcesCompat;

import com.shadowlauncher.R;

import fr.spse.extended_view.ExtendedButton;

public class LauncherMenuButton extends ExtendedButton {

    public LauncherMenuButton(@NonNull Context context) {
        super(context);
        setSettings();
    }
    public LauncherMenuButton(@NonNull Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        setSettings();
    }

    /** Set style stuff */
    private void setSettings(){
        Resources resources = getContext().getResources();

        int startPadding = resources.getDimensionPixelSize(R.dimen._12sdp);
        int endPadding = resources.getDimensionPixelSize(R.dimen._8sdp);
        int drawablePadding = resources.getDimensionPixelSize(R.dimen._10sdp);

        setCompoundDrawablePadding(drawablePadding);
        setPaddingRelative(startPadding, 0, endPadding, 0);
        setGravity(Gravity.CENTER_VERTICAL);
        setMaxLines(2);
        setEllipsize(TextUtils.TruncateAt.END);
        setTypeface(ResourcesCompat.getFont(getContext(), R.font.noto_sans_bold));

        setTextSize(TypedValue.COMPLEX_UNIT_PX, getResources().getDimensionPixelSize(R.dimen._11ssp));

        // Set drawable size
        int[] sizes = getExtendedViewData().getSizeCompounds();
        sizes[0] = resources.getDimensionPixelSize(R.dimen._24sdp);
        getExtendedViewData().setSizeCompounds(sizes);
        postProcessDrawables();
    }
}
