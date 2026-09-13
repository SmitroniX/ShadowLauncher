package com.shadow.launcher;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.graphics.Color;
import android.os.Bundle;
import android.view.MotionEvent;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.Toast;

public class ControlsEditorActivity extends Activity {
    private FrameLayout canvasContainer;

    private static class PojavButtonDef {
        String id;
        String name;
        int x, y, w, h;

        PojavButtonDef(String id, String name, int x, int y, int w, int h) {
            this.id = id;
            this.name = name;
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
        }
    }

    private final PojavButtonDef[] defaultButtons = {
        new PojavButtonDef("esc", "ESC", 20, 20, 140, 100),
        new PojavButtonDef("mouse", "MOUSE", 180, 20, 160, 100),
        new PojavButtonDef("gui", "GUI", 360, 20, 140, 100),
        new PojavButtonDef("f3", "F3", 520, 20, 120, 100),
        new PojavButtonDef("f5", "F5", 660, 20, 120, 100),
        new PojavButtonDef("chat", "CHAT", 800, 20, 140, 100),
        new PojavButtonDef("tab", "TAB", 960, 20, 130, 100),
        new PojavButtonDef("dpad", "D-PAD", 40, 400, 300, 300),
        new PojavButtonDef("pri", "PRI", 1000, 380, 150, 150),
        new PojavButtonDef("sec", "SEC", 1180, 380, 150, 150),
        new PojavButtonDef("jump", "JUMP", 1090, 560, 150, 150),
        new PojavButtonDef("inv", "INV", 550, 600, 160, 100)
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_controls_editor);

        canvasContainer = (FrameLayout) findViewById(R.id.editor_canvas_container);

        renderButtonNodes();

        findViewById(R.id.btn_editor_back).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                finish();
            }
        });

        findViewById(R.id.btn_editor_save).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                Toast.makeText(ControlsEditorActivity.this, "Pojav touch layout saved successfully!", Toast.LENGTH_SHORT).show();
                finish();
            }
        });

        findViewById(R.id.btn_editor_reset).setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                renderButtonNodes();
                Toast.makeText(ControlsEditorActivity.this, "Layout reset to defaults.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void renderButtonNodes() {
        canvasContainer.removeAllViews();

        for (final PojavButtonDef btnDef : defaultButtons) {
            final Button btn = new Button(this);
            btn.setText(btnDef.name);
            btn.setTextColor(Color.WHITE);
            btn.setTextSize(12);
            btn.setBackgroundResource(R.drawable.btn_pojav_normal);

            FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(btnDef.w, btnDef.h);
            lp.leftMargin = btnDef.x;
            lp.topMargin = btnDef.y;
            btn.setLayoutParams(lp);

            btn.setOnTouchListener(new View.OnTouchListener() {
                private float dX, dY;
                private long touchStartTime;

                @Override
                public boolean onTouch(View view, MotionEvent event) {
                    switch (event.getAction()) {
                        case MotionEvent.ACTION_DOWN:
                            dX = view.getX() - event.getRawX();
                            dY = view.getY() - event.getRawY();
                            touchStartTime = System.currentTimeMillis();
                            btn.setBackgroundColor(0xff8b5cf6);
                            return true;

                        case MotionEvent.ACTION_MOVE:
                            float newX = Math.max(0, event.getRawX() + dX);
                            float newY = Math.max(0, event.getRawY() + dY);
                            view.setX(newX);
                            view.setY(newY);
                            btnDef.x = (int) newX;
                            btnDef.y = (int) newY;
                            return true;

                        case MotionEvent.ACTION_UP:
                            btn.setBackgroundResource(R.drawable.btn_pojav_normal);
                            if (System.currentTimeMillis() - touchStartTime < 200) {
                                showEditDialog(btnDef, btn);
                            }
                            return true;
                    }
                    return false;
                }
            });

            canvasContainer.addView(btn);
        }
    }

    private void showEditDialog(final PojavButtonDef btnDef, final Button btn) {
        AlertDialog.Builder b = new AlertDialog.Builder(this);
        b.setTitle("Edit Button: " + btnDef.name);
        final EditText input = new EditText(this);
        input.setText(btnDef.name);
        b.setView(input);

        b.setPositiveButton("Save Name", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                String newName = input.getText().toString().trim();
                if (!newName.isEmpty()) {
                    btnDef.name = newName;
                    btn.setText(newName);
                }
            }
        });
        b.setNegativeButton("Cancel", null);
        b.show();
    }
}
