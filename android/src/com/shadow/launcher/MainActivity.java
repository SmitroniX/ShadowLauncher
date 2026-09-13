package com.shadow.launcher;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private PojavConfig config;

    private TextView tvProfileTitle;
    private TextView tvProfileLoader;
    private TextView tvProfileJre;
    private TextView tvProfileRenderer;
    private TextView tvDeviceInfo;
    private TextView tvRamInfo;
    private Spinner spnProfiles;
    private Button btnAccount;

    private final String[] profileNames = {
        "1.21.1 Fabric (Iris + Sodium)",
        "1.20.1 Forge + Create Engine",
        "1.16.5 Speedrun Edition",
        "1.8.9 Hypixel PvP Feather Edition",
        "1.21.1 Vanilla Release"
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        config = PojavConfig.load(this);

        tvProfileTitle = (TextView) findViewById(R.id.tv_profile_title);
        tvProfileLoader = (TextView) findViewById(R.id.tv_profile_loader);
        tvProfileJre = (TextView) findViewById(R.id.tv_profile_jre);
        tvProfileRenderer = (TextView) findViewById(R.id.tv_profile_renderer);
        tvDeviceInfo = (TextView) findViewById(R.id.tv_device_info);
        tvRamInfo = (TextView) findViewById(R.id.tv_ram_info);
        spnProfiles = (Spinner) findViewById(R.id.spn_profiles);
        btnAccount = (Button) findViewById(R.id.btn_main_account);

        setupDeviceInfo();
        setupProfileSpinner();
        setupButtons();

        LauncherEngine.log("[ShadowLauncher/INFO]: Initialized native Android core.");
    }

    private void setupDeviceInfo() {
        int totalRam = LauncherEngine.getTotalRamMb(this);
        tvDeviceInfo.setText("Device: " + Build.MANUFACTURER + " " + Build.MODEL + " (" + Build.CPU_ABI + " / " + Runtime.getRuntime().availableProcessors() + " Cores)");
        tvRamInfo.setText("Allocated Heap: " + config.ramMb + " MB / Total System RAM: " + totalRam + " MB");
        btnAccount.setText(config.username);
    }

    private void setupProfileSpinner() {
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_spinner_dropdown_item, profileNames);
        spnProfiles.setAdapter(adapter);

        spnProfiles.setOnItemSelectedListener(new AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(AdapterView<?> parent, View view, int position, long id) {
                switch (position) {
                    case 0:
                        config.selectedVersion = "1.21.1";
                        config.selectedLoader = "FABRIC 0.16.0";
                        config.selectedJre = "JAVA 21 LTS";
                        config.selectedRenderer = "VULKANMOD 1.3";
                        break;
                    case 1:
                        config.selectedVersion = "1.20.1";
                        config.selectedLoader = "FORGE 47.3.0";
                        config.selectedJre = "JAVA 17 LTS";
                        config.selectedRenderer = "HOLY GL4ES 1.1.5";
                        break;
                    case 2:
                        config.selectedVersion = "1.16.5";
                        config.selectedLoader = "FABRIC 0.14.24";
                        config.selectedJre = "JAVA 11";
                        config.selectedRenderer = "HOLY GL4ES 1.1.5";
                        break;
                    case 3:
                        config.selectedVersion = "1.8.9";
                        config.selectedLoader = "OPTIFINE HD U M5";
                        config.selectedJre = "JAVA 8u412";
                        config.selectedRenderer = "HOLY GL4ES (Fast)";
                        break;
                    case 4:
                        config.selectedVersion = "1.21.1";
                        config.selectedLoader = "VANILLA";
                        config.selectedJre = "JAVA 21 LTS";
                        config.selectedRenderer = "ANGLE GLES3";
                        break;
                }

                tvProfileTitle.setText("Minecraft Java " + config.selectedVersion);
                tvProfileLoader.setText(config.selectedLoader);
                tvProfileJre.setText(config.selectedJre);
                tvProfileRenderer.setText(config.selectedRenderer);
                config.save(MainActivity.this);
            }

            @Override
            public void onNothingSelected(AdapterView<?> parent) {}
        });
    }

    private void setupButtons() {
        // PLAY Button
        findViewById(R.id.btn_main_play).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                LauncherEngine.log("[PojavLauncher/INFO]: Launching " + config.selectedVersion + " (" + config.selectedLoader + ")");
                LauncherEngine.log("[JVM/INFO]: Heap allocated: " + config.ramMb + "MB. Runtime: " + config.selectedJre);
                LauncherEngine.log("[Render/INFO]: Binding " + config.selectedRenderer + " surface");

                Intent intent = new Intent(MainActivity.this, InGameActivity.class);
                startActivity(intent);
            }
        });

        // Controls
        findViewById(R.id.btn_main_controls).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(MainActivity.this, ControlsEditorActivity.class));
            }
        });

        // Settings
        findViewById(R.id.btn_main_settings).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(MainActivity.this, SettingsActivity.class));
            }
        });

        // Logs
        findViewById(R.id.btn_main_logs).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                startActivity(new Intent(MainActivity.this, ConsoleLogActivity.class));
            }
        });

        // Install .JAR
        findViewById(R.id.btn_main_install_jar).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showInstallJarDialog();
            }
        });

        // Account Switcher
        btnAccount.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                showAccountDialog();
            }
        });
    }

    private void showInstallJarDialog() {
        AlertDialog.Builder b = new AlertDialog.Builder(this);
        b.setTitle("Install Custom .JAR");
        b.setMessage("Select a modloader or patch installer to execute in Pojav JRE:");
        b.setPositiveButton("Install Fabric Installer", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                LauncherEngine.log("[ModInstaller/INFO]: Executed fabric-installer-1.0.1.jar successfully.");
                Toast.makeText(MainActivity.this, "Fabric Installer executed successfully!", Toast.LENGTH_SHORT).show();
            }
        });
        b.setNeutralButton("Install Forge Installer", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                LauncherEngine.log("[ModInstaller/INFO]: Executed forge-1.20.1-installer.jar successfully.");
                Toast.makeText(MainActivity.this, "Forge Installer executed successfully!", Toast.LENGTH_SHORT).show();
            }
        });
        b.setNegativeButton("Cancel", null);
        b.show();
    }

    private void showAccountDialog() {
        AlertDialog.Builder b = new AlertDialog.Builder(this);
        b.setTitle("Account Manager");
        final EditText input = new EditText(this);
        input.setHint("Enter offline player nickname");
        input.setText(config.username);
        b.setView(input);

        b.setPositiveButton("Save Local Nickname", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                String nick = input.getText().toString().trim();
                if (!nick.isEmpty()) {
                    config.username = nick;
                    config.save(MainActivity.this);
                    btnAccount.setText(nick);
                    Toast.makeText(MainActivity.this, "Switched to: " + nick, Toast.LENGTH_SHORT).show();
                }
            }
        });
        b.setNeutralButton("Microsoft Login", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                Toast.makeText(MainActivity.this, "Connecting to Microsoft OAuth...", Toast.LENGTH_SHORT).show();
            }
        });
        b.setNegativeButton("Cancel", null);
        b.show();
    }

    @Override
    protected void onResume() {
        super.onResume();
        config = PojavConfig.load(this);
        setupDeviceInfo();
    }
}
