package com.shadow.launcher;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.opengl.GLSurfaceView;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Vibrator;
import android.view.MotionEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

public class InGameActivity extends Activity {
    private GLSurfaceView glSurfaceView;
    private MinecraftGLRenderer glRenderer;
    private PojavConfig config;
    private Vibrator vibrator;

    private TextView tvF3;
    private View layoutControls;
    private ImageView ivVirtualMouse;

    private boolean virtualMouseActive = false;
    private boolean guiHidden = false;
    private boolean f3Visible = true;

    private float mouseX = 300f, mouseY = 300f;
    private float lastTouchX = 0f, lastTouchY = 0f;

    private Handler updateHandler = new Handler();
    private Runnable hudUpdateRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN);

        setContentView(R.layout.activity_game);
        setupImmersiveMode();

        config = PojavConfig.load(this);
        vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);

        glSurfaceView = (GLSurfaceView) findViewById(R.id.gl_game_surface);
        glSurfaceView.setEGLContextClientVersion(2);
        glRenderer = new MinecraftGLRenderer();
        glSurfaceView.setRenderer(glRenderer);

        tvF3 = (TextView) findViewById(R.id.tv_ingame_f3);
        layoutControls = findViewById(R.id.layout_pojav_controls);
        ivVirtualMouse = (ImageView) findViewById(R.id.iv_virtual_mouse);

        setupTouchLook();
        setupPojavButtons();
        startTelemetryLoop();

        LauncherEngine.log("[PojavCore]: Surface initialized. Minecraft " + config.selectedVersion + " running at " + config.maxFps + " FPS lock.");
    }

    private void setupImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            );
        }
    }

    private void triggerHaptic(int ms) {
        if (vibrator != null && vibrator.hasVibrator()) {
            try { vibrator.vibrate(ms); } catch (Exception ignored) {}
        }
    }

    private void setupTouchLook() {
        glSurfaceView.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                float x = event.getX();
                float y = event.getY();

                if (virtualMouseActive) {
                    if (event.getAction() == MotionEvent.ACTION_MOVE) {
                        float dx = x - lastTouchX;
                        float dy = y - lastTouchY;
                        mouseX = Math.max(0, Math.min(v.getWidth() - 24, mouseX + dx));
                        mouseY = Math.max(0, Math.min(v.getHeight() - 24, mouseY + dy));
                        ivVirtualMouse.setX(mouseX);
                        ivVirtualMouse.setY(mouseY);
                    }
                    lastTouchX = x;
                    lastTouchY = y;
                    return true;
                }

                // Normal camera look
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        lastTouchX = x;
                        lastTouchY = y;
                        break;
                    case MotionEvent.ACTION_MOVE:
                        float dx = x - lastTouchX;
                        float dy = y - lastTouchY;
                        glRenderer.playerYaw += dx * 0.005f;
                        glRenderer.playerPitch = Math.max(-1.4f, Math.min(1.4f, glRenderer.playerPitch - dy * 0.005f));
                        lastTouchX = x;
                        lastTouchY = y;
                        break;
                }
                return true;
            }
        });
    }

    private void setupPojavButtons() {
        // ESC -> Pause Dialog
        findViewById(R.id.btn_game_esc).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                triggerHaptic(20);
                showPauseDialog();
            }
        });

        // MOUSE -> Toggle Virtual Mouse Cursor
        final Button btnMouse = (Button) findViewById(R.id.btn_game_mouse);
        btnMouse.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                triggerHaptic(25);
                virtualMouseActive = !virtualMouseActive;
                ivVirtualMouse.setVisibility(virtualMouseActive ? View.VISIBLE : View.GONE);
                btnMouse.setBackgroundColor(virtualMouseActive ? 0xff06b6d4 : 0xcc121624);
                btnMouse.setTextColor(virtualMouseActive ? 0xff000000 : 0xffffffff);
            }
        });

        // GUI -> Hide/Show Touch Buttons
        findViewById(R.id.btn_game_gui).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                triggerHaptic(20);
                guiHidden = !guiHidden;
                findViewById(R.id.btn_game_esc).setVisibility(View.VISIBLE);
                findViewById(R.id.btn_game_gui).setVisibility(View.VISIBLE);
            }
        });

        // F3 -> Toggle Debug HUD
        findViewById(R.id.btn_game_f3).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                triggerHaptic(20);
                f3Visible = !f3Visible;
                tvF3.setVisibility(f3Visible ? View.VISIBLE : View.GONE);
            }
        });

        // F5 -> Flip Camera
        findViewById(R.id.btn_game_f5).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                triggerHaptic(20);
                glRenderer.playerYaw += Math.PI;
            }
        });

        // D-PAD Movement
        setupHoldAction(R.id.btn_dpad_up, 0f, 0.15f);
        setupHoldAction(R.id.btn_dpad_down, 0f, -0.15f);
        setupHoldAction(R.id.btn_dpad_left, -0.15f, 0f);
        setupHoldAction(R.id.btn_dpad_right, 0.15f, 0f);

        // Actions: PRI (Attack), SEC (Place), JUMP
        findViewById(R.id.btn_action_pri).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                triggerHaptic(35);
                LauncherEngine.log("[Player/INFO]: Mined block at targeted voxel.");
            }
        });

        findViewById(R.id.btn_action_sec).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                triggerHaptic(25);
                LauncherEngine.log("[Player/INFO]: Placed block from hotbar.");
            }
        });

        findViewById(R.id.btn_action_jump).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                triggerHaptic(20);
                glRenderer.playerY += 0.4f;
                new Handler().postDelayed(new Runnable() {
                    @Override
                    public void run() { glRenderer.playerY = 2f; }
                }, 250);
            }
        });
    }

    private void setupHoldAction(int viewId, final float strafe, final float forward) {
        View view = findViewById(viewId);
        view.setOnTouchListener(new View.OnTouchListener() {
            private Handler moveHandler = new Handler();
            private Runnable moveRunnable = new Runnable() {
                @Override
                public void run() {
                    float moveAngle = glRenderer.playerYaw + (float) Math.atan2(strafe, forward);
                    float speed = (float) Math.hypot(strafe, forward);
                    glRenderer.playerX += - (float) Math.sin(moveAngle) * speed;
                    glRenderer.playerZ += (float) Math.cos(moveAngle) * speed;
                    moveHandler.postDelayed(this, 30);
                }
            };

            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        triggerHaptic(15);
                        moveHandler.post(moveRunnable);
                        break;
                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        moveHandler.removeCallbacks(moveRunnable);
                        break;
                }
                return false;
            }
        });
    }

    private void showPauseDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Game Paused");
        builder.setMessage("Minecraft Java " + config.selectedVersion + " (" + config.selectedLoader + ")\nRenderer: " + config.selectedRenderer);
        builder.setPositiveButton("Resume", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                setupImmersiveMode();
            }
        });
        builder.setNegativeButton("Exit to Launcher", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                finish();
            }
        });
        builder.setCancelable(false);
        builder.show();
    }

    private void startTelemetryLoop() {
        hudUpdateRunnable = new Runnable() {
            @Override
            public void run() {
                if (tvF3 != null && f3Visible) {
                    int ramUsed = (int) (config.ramMb * 0.34);
                    tvF3.setText(String.format(
                        "Minecraft %s (%s) [Pojav/MJ Core]\n%d fps @ %s\nJava: %s\nMem: 34%% %d/%dMB\nXYZ: %.3f / %.3f / %.3f\nFacing: Yaw %.1f° / Pitch %.1f°",
                        config.selectedVersion, config.selectedLoader,
                        glRenderer.fps, config.selectedRenderer,
                        config.selectedJre,
                        ramUsed, config.ramMb,
                        glRenderer.playerX, glRenderer.playerY, glRenderer.playerZ,
                        (float) Math.toDegrees(glRenderer.playerYaw), (float) Math.toDegrees(glRenderer.playerPitch)
                    ));
                }
                updateHandler.postDelayed(this, 100);
            }
        };
        updateHandler.post(hudUpdateRunnable);
    }

    @Override
    protected void onResume() {
        super.onResume();
        glSurfaceView.onResume();
        setupImmersiveMode();
    }

    @Override
    protected void onPause() {
        super.onPause();
        glSurfaceView.onPause();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        updateHandler.removeCallbacks(hudUpdateRunnable);
    }
}
