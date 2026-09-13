package com.shadowlauncher.multirt;

import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.BaseAdapter;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.shadowlauncher.R;

import java.util.ArrayList;
import java.util.List;

public class RTSpinnerAdapter extends BaseAdapter {
    private final Context mContext;
    private final List<Runtime> mRuntimes;
    private String mAutoText = "<Default>";

    public RTSpinnerAdapter(@NonNull Context context, List<Runtime> runtimes) {
        this(context, runtimes, "<Default>");
    }

    public RTSpinnerAdapter(@NonNull Context context, List<Runtime> runtimes, String autoText) {
        mContext = context;
        if (autoText != null) mAutoText = autoText;
        mRuntimes = new ArrayList<>();
        // Position 0 is Auto / Default
        Runtime defaultRuntime = new Runtime("<Default>", "", null, 0);
        mRuntimes.add(defaultRuntime);
        if (runtimes != null) {
            mRuntimes.addAll(runtimes);
        }
    }

    public void setAutoText(String autoText) {
        if (autoText != null) {
            this.mAutoText = autoText;
            notifyDataSetChanged();
        }
    }

    @Override
    public int getCount() {
        return mRuntimes.size();
    }

    @Override
    public Object getItem(int position) {
        return mRuntimes.get(position);
    }

    @Override
    public long getItemId(int position) {
        return mRuntimes.get(position).name.hashCode();
    }

    @Override
    public boolean hasStableIds() {
        return true;
    }

    @NonNull
    @Override
    public View getView(int position, @Nullable View convertView, @NonNull ViewGroup parent) {
        View view = convertView != null ?
                convertView :
                LayoutInflater.from(mContext).inflate(R.layout.item_simple_list_1, parent, false);

        Runtime runtime = mRuntimes.get(position);
        if (position == 0) {
            ((TextView) view).setText(mAutoText);
        } else {
            ((TextView) view).setText(String.format("%s - %s",
                    runtime.name.replace(".tar.xz", ""),
                    runtime.versionString == null ? view.getResources().getString(R.string.multirt_runtime_corrupt) : runtime.versionString));
        }

        return view;
    }

    @Override
    public View getDropDownView(int position, View convertView, ViewGroup parent) {
        return getView(position, convertView, parent);
    }
}
