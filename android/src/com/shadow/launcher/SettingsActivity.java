package com.shadow.launcher;

import android.app.Activity;
import android.os.Bundle;
import android.view.View;
import android.widget.ArrayAdapter;
import android.widget.EditText;
import android.widget.SeekBar;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

public class SettingsActivity extends Activity {
    private PojavConfig config;

    private TextView tvRamVal;
    private SeekBar sbRam;
    private Spinner spnJre;
    private Spinner spnRenderer;
    private Spinner spnFps;
    private EditText etJvmArgs;

    private final String[] jreList = {
        "Java 21 (LTS OpenJDK) - MC 1.20.5+",
        "Java 17 (LTS OpenJDK) - MC 1.17 to 1.20.4",
        "Java 8 (Legacy OpenJDK) - MC 1.12.2 and older"
    };

    private final String[] rendererList = {
        "VulkanMod 1.3 (Adreno/Mali Native Vulkan)",
        "Holy GL4ES 1.1.5 (OpenGL to GLES)",
        "ANGLE (Direct GLES)",
        "VirGL Zink"
    };

    private final String[] fpsList = {
        "60 FPS (Battery Saver)",
        "90 FPS (Smooth)",
        "120 FPS (Pro Gaming)",
        "144 FPS (Ultra)"
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_settings);

        config = PojavConfig.load(this);

        tvRamVal = (TextView) findViewById(R.id.tv_settings_ram_val);
        sbRam = (SeekBar) findViewById(R.id.sb_settings_ram);
        spnJre = (Spinner) findViewById(R.id.spn_settings_jre);
        spnRenderer = (Spinner) findViewById(R.id.spn_settings_renderer);
        spnFps = (Spinner) findViewById(R.id.spn_settings_fps);
        etJvmArgs = (EditText) findViewById(R.id.et_settings_jvm_args);

        // Populate Spinners
        spnJre.setAdapter(new ArrayAdapter<String>(this, android.R.layout.simple_spinner_dropdown_item, jreList));
        spnRenderer.setAdapter(new ArrayAdapter<String>(this, android.R.layout.simple_spinner_dropdown_item, rendererList));
        spnFps.setAdapter(new ArrayAdapter<String>(this, android.R.layout.simple_spinner_dropdown_item, fpsList));

        // Set current values
        sbRam.setProgress(config.ramMb);
        tvRamVal.setText(config.ramMb + " MB");
        etJvmArgs.setText(config.jvmArgs);

        sbRam.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                int rounded = Math.max(1024, (progress / 256) * 256);
                tvRamVal.setText(rounded + " MB");
                config.ramMb = rounded;
            }

            @Override
            public void onStartTrackingTouch(SeekBar seekBar) {}

            @Override
            public void onStopTrackingTouch(SeekBar seekBar) {}
        });

        findViewById(R.id.btn_settings_back).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });

        findViewById(R.id.btn_settings_save).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                config.jvmArgs = etJvmArgs.getText().toString();
                config.selectedJre = spnJre.getSelectedItem().toString();
                config.selectedRenderer = spnRenderer.getSelectedItem().toString();
                config.save(SettingsActivity.this);
                Toast.makeText(SettingsActivity.this, "Settings saved successfully!", Toast.LENGTH_SHORT).show();
                finish();
            }
        });
    }
}
