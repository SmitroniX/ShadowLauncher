package com.shadow.launcher;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.os.Bundle;
import android.view.View;
import android.widget.ScrollView;
import android.widget.TextView;
import android.widget.Toast;

public class ConsoleLogActivity extends Activity {
    private TextView tvLogs;
    private ScrollView scrollLog;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_console_log);

        tvLogs = (TextView) findViewById(R.id.tv_console_output);
        scrollLog = (ScrollView) findViewById(R.id.scroll_log);

        tvLogs.setText(LauncherEngine.getLogs());
        scrollLog.post(new Runnable() {
            @Override
            public void run() {
                scrollLog.fullScroll(View.FOCUS_DOWN);
            }
        });

        findViewById(R.id.btn_log_back).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });

        findViewById(R.id.btn_log_clear).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                LauncherEngine.clearLogs();
                tvLogs.setText(LauncherEngine.getLogs());
            }
        });

        findViewById(R.id.btn_log_copy).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                ClipboardManager clipboard = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
                ClipData clip = ClipData.newPlainText("ShadowLogs", tvLogs.getText().toString());
                clipboard.setPrimaryClip(clip);
                Toast.makeText(ConsoleLogActivity.this, "Console logs copied to clipboard!", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
