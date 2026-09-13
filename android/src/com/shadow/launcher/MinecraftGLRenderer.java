package com.shadow.launcher;

import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.opengl.Matrix;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

public class MinecraftGLRenderer implements GLSurfaceView.Renderer {
    private final float[] vPMatrix = new float[16];
    private final float[] projectionMatrix = new float[16];
    private final float[] viewMatrix = new float[16];
    private final float[] modelMatrix = new float[16];
    private final float[] mvpMatrix = new float[16];

    public float playerX = 0f;
    public float playerY = 2f;
    public float playerZ = -5f;
    public float playerYaw = 0f;
    public float playerPitch = 0f;

    public int fps = 120;
    private long lastFpsTime = System.currentTimeMillis();
    private int frameCount = 0;

    private int program;
    private int positionHandle;
    private int colorHandle;
    private int mvpMatrixHandle;

    private FloatBuffer vertexBuffer;
    private FloatBuffer colorBuffer;

    private static final String VERTEX_SHADER =
            "uniform mat4 uMVPMatrix;" +
            "attribute vec4 vPosition;" +
            "attribute vec4 aColor;" +
            "varying vec4 vColor;" +
            "void main() {" +
            "  gl_Position = uMVPMatrix * vPosition;" +
            "  vColor = aColor;" +
            "}";

    private static final String FRAGMENT_SHADER =
            "precision mediump float;" +
            "varying vec4 vColor;" +
            "void main() {" +
            "  gl_FragColor = vColor;" +
            "}";

    // 36 vertices for cube
    private static final float[] CUBE_VERTICES = {
        // Front
        -0.5f, -0.5f,  0.5f,   0.5f, -0.5f,  0.5f,   0.5f,  0.5f,  0.5f,
        -0.5f, -0.5f,  0.5f,   0.5f,  0.5f,  0.5f,  -0.5f,  0.5f,  0.5f,
        // Back
        -0.5f, -0.5f, -0.5f,  -0.5f,  0.5f, -0.5f,   0.5f,  0.5f, -0.5f,
        -0.5f, -0.5f, -0.5f,   0.5f,  0.5f, -0.5f,   0.5f, -0.5f, -0.5f,
        // Top
        -0.5f,  0.5f, -0.5f,  -0.5f,  0.5f,  0.5f,   0.5f,  0.5f,  0.5f,
        -0.5f,  0.5f, -0.5f,   0.5f,  0.5f,  0.5f,   0.5f,  0.5f, -0.5f,
        // Bottom
        -0.5f, -0.5f, -0.5f,   0.5f, -0.5f, -0.5f,   0.5f, -0.5f,  0.5f,
        -0.5f, -0.5f, -0.5f,   0.5f, -0.5f,  0.5f,  -0.5f, -0.5f,  0.5f,
        // Left
        -0.5f, -0.5f, -0.5f,  -0.5f, -0.5f,  0.5f,  -0.5f,  0.5f,  0.5f,
        -0.5f, -0.5f, -0.5f,  -0.5f,  0.5f,  0.5f,  -0.5f,  0.5f, -0.5f,
        // Right
         0.5f, -0.5f, -0.5f,   0.5f,  0.5f, -0.5f,   0.5f,  0.5f,  0.5f,
         0.5f, -0.5f, -0.5f,   0.5f,  0.5f,  0.5f,   0.5f, -0.5f,  0.5f
    };

    public MinecraftGLRenderer() {
        ByteBuffer bb = ByteBuffer.allocateDirect(CUBE_VERTICES.length * 4);
        bb.order(ByteOrder.nativeOrder());
        vertexBuffer = bb.asFloatBuffer();
        vertexBuffer.put(CUBE_VERTICES);
        vertexBuffer.position(0);

        // Pre-fill colors
        float[] colors = new float[36 * 4];
        for (int i = 0; i < 36; i++) {
            if (i >= 12 && i < 18) {
                // Top: Grass green
                colors[i*4] = 0.36f; colors[i*4+1] = 0.62f; colors[i*4+2] = 0.19f; colors[i*4+3] = 1f;
            } else {
                // Sides: Dirt brown
                colors[i*4] = 0.48f; colors[i*4+1] = 0.35f; colors[i*4+2] = 0.23f; colors[i*4+3] = 1f;
            }
        }
        ByteBuffer cb = ByteBuffer.allocateDirect(colors.length * 4);
        cb.order(ByteOrder.nativeOrder());
        colorBuffer = cb.asFloatBuffer();
        colorBuffer.put(colors);
        colorBuffer.position(0);
    }

    @Override
    public void onSurfaceCreated(GL10 gl, EGLConfig config) {
        GLES20.glClearColor(0.33f, 0.54f, 0.83f, 1.0f); // Minecraft sky blue
        GLES20.glEnable(GLES20.GL_DEPTH_TEST);

        int vertexShader = loadShader(GLES20.GL_VERTEX_SHADER, VERTEX_SHADER);
        int fragmentShader = loadShader(GLES20.GL_FRAGMENT_SHADER, FRAGMENT_SHADER);

        program = GLES20.glCreateProgram();
        GLES20.glAttachShader(program, vertexShader);
        GLES20.glAttachShader(program, fragmentShader);
        GLES20.glLinkProgram(program);

        positionHandle = GLES20.glGetAttribLocation(program, "vPosition");
        colorHandle = GLES20.glGetAttribLocation(program, "aColor");
        mvpMatrixHandle = GLES20.glGetUniformLocation(program, "uMVPMatrix");
    }

    @Override
    public void onSurfaceChanged(GL10 gl, int width, int height) {
        GLES20.glViewport(0, 0, width, height);
        float ratio = (float) width / height;
        Matrix.frustumM(projectionMatrix, 0, -ratio, ratio, -1, 1, 1f, 100.0f);
    }

    @Override
    public void onDrawFrame(GL10 gl) {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT | GLES20.GL_DEPTH_BUFFER_BIT);

        // Frame rate calculation
        frameCount++;
        long now = System.currentTimeMillis();
        if (now - lastFpsTime >= 1000) {
            fps = frameCount;
            frameCount = 0;
            lastFpsTime = now;
        }

        // Setup camera
        float targetX = playerX - (float) Math.sin(playerYaw);
        float targetY = playerY + (float) Math.sin(playerPitch);
        float targetZ = playerZ + (float) Math.cos(playerYaw);

        Matrix.setLookAtM(viewMatrix, 0,
                playerX, playerY, playerZ,
                targetX, targetY, targetZ,
                0f, 1.0f, 0f);

        Matrix.multiplyMM(vPMatrix, 0, projectionMatrix, 0, viewMatrix, 0);

        GLES20.glUseProgram(program);
        GLES20.glEnableVertexAttribArray(positionHandle);
        GLES20.glVertexAttribPointer(positionHandle, 3, GLES20.GL_FLOAT, false, 12, vertexBuffer);

        GLES20.glEnableVertexAttribArray(colorHandle);
        GLES20.glVertexAttribPointer(colorHandle, 4, GLES20.GL_FLOAT, false, 16, colorBuffer);

        // Draw landscape of voxels
        for (int x = -5; x <= 5; x++) {
            for (int z = 0; z <= 10; z++) {
                Matrix.setIdentityM(modelMatrix, 0);
                Matrix.translateM(modelMatrix, 0, x, 0f, z);
                Matrix.multiplyMM(mvpMatrix, 0, vPMatrix, 0, modelMatrix, 0);
                GLES20.glUniformMatrix4fv(mvpMatrixHandle, 1, false, mvpMatrix, 0);
                GLES20.glDrawArrays(GLES20.GL_TRIANGLES, 0, 36);
            }
        }

        GLES20.glDisableVertexAttribArray(positionHandle);
        GLES20.glDisableVertexAttribArray(colorHandle);
    }

    private static int loadShader(int type, String shaderCode) {
        int shader = GLES20.glCreateShader(type);
        GLES20.glShaderSource(shader, shaderCode);
        GLES20.glCompileShader(shader);
        return shader;
    }
}
