// Shadow Launcher — PojavLauncher & MJ Launcher Architecture Engine

(function() {
    'use strict';

    // 1. Core State
    const state = {
        profile: {
            id: 'fabric-1.21.1',
            name: '1.21.1 Fabric (Iris + Sodium)',
            version: '1.21.1',
            loader: 'Fabric 0.16.0',
            jre: 'Java 21 (LTS OpenJDK)',
            renderer: 'VulkanMod 1.3 (Adreno/Mali)',
            expectedFps: 120
        },
        optimizer: {
            ramMb: 4096,
            systemRamMb: 8192,
            gcMode: 'aikar',
            renderer: 'vulkan',
            jreVersion: '21',
            resScale: 100,
            maxFps: 120,
            lowMemMode: false,
            chunkThreads: 4,
            aggressiveCulling: true,
            customJvmArgs: ''
        },
        controls: {
            opacity: 80,
            scale: 100,
            mouseSpeed: 50,
            virtualMouseActive: false,
            guiHidden: false,
            haptics: true,
            activeSlot: 0,
            selectedEditorBtn: null
        },
        account: {
            username: 'ShadowPlayer_99',
            mode: 'Microsoft Online',
            skin: 'shadow_samurai',
            cape: 'shadow_wings'
        },
        // Pojav Custom Controls Layout
        buttonLayout: [
            { id: 'esc', text: 'ESC', x: 12, y: 12, w: 50, h: 36, key: 'ESCAPE', type: 'momentary' },
            { id: 'mouse', text: 'MOUSE', x: 68, y: 12, w: 60, h: 36, key: 'MOUSE_TOGGLE', type: 'toggle' },
            { id: 'gui', text: 'GUI', x: 134, y: 12, w: 50, h: 36, key: 'GUI_TOGGLE', type: 'toggle' },
            { id: 'f3', text: 'F3', x: 200, y: 12, w: 46, h: 36, key: 'F3', type: 'toggle' },
            { id: 'f5', text: 'F5', x: 252, y: 12, w: 46, h: 36, key: 'F5', type: 'momentary' },
            { id: 'chat', text: 'CHAT', x: 304, y: 12, w: 54, h: 36, key: 'CHAT', type: 'momentary' },
            { id: 'tab', text: 'TAB', x: 364, y: 12, w: 48, h: 36, key: 'TAB', type: 'momentary' },
            { id: 'pri', text: 'PRI', x: 86, y: 70, w: 54, h: 54, key: 'ATTACK', type: 'momentary' },
            { id: 'sec', text: 'SEC', x: 146, y: 70, w: 54, h: 54, key: 'USE', type: 'momentary' },
            { id: 'inv', text: 'INV', x: 50, y: 88, w: 60, h: 36, key: 'INVENTORY', type: 'momentary' },
            { id: 'jump', text: 'JUMP', x: 86, y: 82, w: 54, h: 54, key: 'JUMP', type: 'momentary' },
            { id: 'sneak', text: 'SHIFT', x: 86, y: 92, w: 54, h: 54, key: 'SNEAK', type: 'toggle' }
        ],
        mods: [
            { id: 'sodium', name: 'Sodium', ver: '0.6.2', author: 'CaffeineMC', desc: 'Modern graphics engine (+300% FPS, shader cache)', enabled: true, icon: '⚡' },
            { id: 'iris', name: 'Iris Shaders', ver: '1.8.0', author: 'Iris Team', desc: 'Hardware-accelerated shaderpack support', enabled: true, icon: '✨' },
            { id: 'lithium', name: 'Lithium', ver: '0.13.0', author: 'CaffeineMC', desc: 'Physics, mob AI, and chunk tick optimizations', enabled: true, icon: '🍃' },
            { id: 'ferritecore', name: 'FerriteCore', ver: '7.0.0', author: 'malte0811', desc: 'Reduces Java heap memory consumption by up to 50%', enabled: true, icon: '💾' },
            { id: 'immediatelyfast', name: 'ImmediatelyFast', ver: '1.3.1', author: 'Raphiiko', desc: 'Instant HUD and entity model batching', enabled: true, icon: '🚀' },
            { id: 'entityculling', name: 'Entity Culling', ver: '1.6.6', author: 'tr7zw', desc: 'Skips tile & entity drawing blocked by opaque walls', enabled: true, icon: '🛡️' },
            { id: 'vulkanmod', name: 'VulkanMod', ver: '0.4.4', author: 'xCollateral', desc: 'Native Vulkan 1.3 mobile pipeline for Adreno & Mali', enabled: true, icon: '🌋' },
            { id: 'modernfix', name: 'ModernFix', ver: '5.18.0', author: 'embeddedt', desc: 'Fixes memory leaks and cuts game boot time in half', enabled: true, icon: '🔧' }
        ],
        mousePos: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
        gameRunning: false,
        gamePaused: false,
        f3Visible: true
    };

    // 2. Hardware / Native Bridge
    function initHardwareInfo() {
        if (window.ShadowNative) {
            try {
                const infoStr = window.ShadowNative.getDeviceInfo();
                const info = JSON.parse(infoStr);
                if (info.totalRamMb) {
                    state.optimizer.systemRamMb = info.totalRamMb;
                    state.optimizer.ramMb = window.ShadowNative.getRecommendedRamMb();
                }
            } catch (e) {
                console.warn('Bridge error:', e);
            }
        }
        updateRamDisplays();
        generateJvmArgs();
    }

    function triggerHaptic(duration = 20) {
        if (!state.controls.haptics) return;
        if (window.ShadowNative && typeof window.ShadowNative.vibrate === 'function') {
            window.ShadowNative.vibrate(duration);
        } else if (navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    // 3. JVM Arguments Generator (Pojav / MJ style)
    function generateJvmArgs() {
        let gcArgs = '';
        if (state.optimizer.gcMode === 'aikar') {
            gcArgs = '-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1ReservePercent=20';
        } else if (state.optimizer.gcMode === 'shenandoah') {
            gcArgs = '-XX:+UseShenandoahGC -XX:ShenandoahGCHeuristics=compact -XX:ShenandoahAllocationThreshold=70 -XX:+AlwaysPreTouch';
        } else if (state.optimizer.gcMode === 'zgc') {
            gcArgs = '-XX:+UseZGC -XX:+ZGenerational -XX:+UnlockExperimentalVMOptions';
        } else {
            gcArgs = '-XX:+UseParallelGC -XX:ParallelGCThreads=4';
        }

        const memArg = `-Xms${Math.floor(state.optimizer.ramMb * 0.5)}M -Xmx${state.optimizer.ramMb}M`;
        const renderArg = state.optimizer.renderer === 'vulkan' 
            ? '-Dorg.lwjgl.opengl.Display.enableVulkan=true -Dshadow.renderer=VulkanMod' 
            : '-Dshadow.renderer=HolyGL4ES -Dgl4es.allow=true';

        state.optimizer.customJvmArgs = `${memArg} ${gcArgs} ${renderArg} -XX:+OptimizeStringConcat -Dfml.ignoreInvalidMinecraftCertificates=true`;
        
        const area = document.getElementById('jvm-args-textarea');
        if (area) area.value = state.optimizer.customJvmArgs;
    }

    function updateRamDisplays() {
        const slider = document.getElementById('ram-slider');
        const display = document.getElementById('ram-val-display');
        const quickFill = document.getElementById('sidebar-ram-fill');
        const quickText = document.getElementById('sidebar-ram-text');

        if (slider) slider.value = state.optimizer.ramMb;
        if (display) display.textContent = `${state.optimizer.ramMb} MB`;

        const pct = Math.min(100, Math.round((state.optimizer.ramMb / state.optimizer.systemRamMb) * 100));
        if (quickFill) quickFill.style.width = `${pct}%`;
        if (quickText) quickText.textContent = `${state.optimizer.ramMb} / ${state.optimizer.systemRamMb} MB`;
    }

    // 4. Tab Navigation
    function setupTabs() {
        const buttons = document.querySelectorAll('.nav-btn');
        const panes = document.querySelectorAll('.tab-pane');

        buttons.forEach(btn => {
            btn.addEventListener('click', () => {
                const target = btn.getAttribute('data-tab');
                if (!target) return;

                if (window.shadowAudio) window.shadowAudio.playSelect();

                buttons.forEach(b => b.classList.remove('active'));
                panes.forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                const targetPane = document.getElementById(`tab-${target}`);
                if (targetPane) targetPane.classList.add('active');

                if (target === 'controls') {
                    renderControlsEditor();
                } else if (target === 'skins') {
                    renderSkinViewer();
                }
            });
        });
    }

    // 5. Version Profile Manager (Pojav / MJ style)
    function setupProfiles() {
        const selector = document.getElementById('pojav-version-select');
        if (!selector) return;

        const profiles = {
            'fabric-1.21.1': { 
                name: '1.21.1 Fabric (Iris + Sodium)', 
                version: '1.21.1', 
                loader: 'Fabric 0.16.0', 
                jre: 'Java 21 (LTS OpenJDK)', 
                renderer: 'VulkanMod 1.3', 
                expectedFps: 120 
            },
            'forge-1.20.1': { 
                name: '1.20.1 Forge + Create Engine', 
                version: '1.20.1', 
                loader: 'Forge 47.3.0', 
                jre: 'Java 17 (LTS OpenJDK)', 
                renderer: 'Holy GL4ES 1.1.5', 
                expectedFps: 90 
            },
            'speedrun-1.16.5': { 
                name: '1.16.5 Speedrun Edition', 
                version: '1.16.5', 
                loader: 'Fabric 0.14.24', 
                jre: 'Java 11 (OpenJDK)', 
                renderer: 'Holy GL4ES 1.1.5', 
                expectedFps: 110 
            },
            'pvp-1.8.9': { 
                name: '1.8.9 Hypixel PvP Feather', 
                version: '1.8.9', 
                loader: 'OptiFine HD U M5', 
                jre: 'Java 8u412 (Legacy)', 
                renderer: 'Holy GL4ES (Fast)', 
                expectedFps: 144 
            },
            'vanilla-1.21.1': { 
                name: '1.21.1 Vanilla Release', 
                version: '1.21.1', 
                loader: 'Vanilla Mojang', 
                jre: 'Java 21 (LTS OpenJDK)', 
                renderer: 'ANGLE GLES3', 
                expectedFps: 75 
            }
        };

        selector.addEventListener('change', (e) => {
            const chosen = profiles[e.target.value];
            if (chosen) {
                state.profile = chosen;
                document.getElementById('pojav-version-title').textContent = `Minecraft Java ${chosen.version}`;
                document.getElementById('badge-loader-text').textContent = chosen.loader;
                document.getElementById('badge-jre-text').textContent = chosen.jre;
                document.getElementById('badge-renderer-text').textContent = chosen.renderer;
                if (window.shadowAudio) window.shadowAudio.playClick();
            }
        });
    }

    // 6. Pojav Controls Layout Customizer Editor
    function renderControlsEditor() {
        const canvas = document.getElementById('editor-grid-canvas');
        if (!canvas) return;

        canvas.innerHTML = '';

        state.buttonLayout.forEach((btnConfig, index) => {
            const btnElem = document.createElement('div');
            btnElem.className = 'pojav-btn-node';
            btnElem.textContent = btnConfig.text;
            btnElem.id = `editor-btn-${btnConfig.id}`;
            btnElem.style.left = `${btnConfig.x}px`;
            btnElem.style.top = `${btnConfig.y}px`;
            btnElem.style.width = `${btnConfig.w}px`;
            btnElem.style.height = `${btnConfig.h}px`;

            // Dragging logic inside editor
            let isDragging = false;
            let startX = 0, startY = 0;
            let origX = btnConfig.x, origY = btnConfig.y;

            btnElem.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                selectEditorButton(btnConfig, btnElem);
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                origX = btnConfig.x;
                origY = btnConfig.y;
            });

            window.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                btnConfig.x = Math.max(0, Math.min(canvas.clientWidth - btnConfig.w, origX + dx));
                btnConfig.y = Math.max(0, Math.min(canvas.clientHeight - btnConfig.h, origY + dy));
                btnElem.style.left = `${btnConfig.x}px`;
                btnElem.style.top = `${btnConfig.y}px`;
                updateInspectorValues(btnConfig);
            });

            window.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    saveLayoutToStorage();
                }
            });

            // Touch drag support
            btnElem.addEventListener('touchstart', (e) => {
                e.stopPropagation();
                selectEditorButton(btnConfig, btnElem);
                isDragging = true;
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                origX = btnConfig.x;
                origY = btnConfig.y;
            }, { passive: false });

            window.addEventListener('touchmove', (e) => {
                if (!isDragging || !e.touches[0]) return;
                const dx = e.touches[0].clientX - startX;
                const dy = e.touches[0].clientY - startY;
                btnConfig.x = Math.max(0, Math.min(canvas.clientWidth - btnConfig.w, origX + dx));
                btnConfig.y = Math.max(0, Math.min(canvas.clientHeight - btnConfig.h, origY + dy));
                btnElem.style.left = `${btnConfig.x}px`;
                btnElem.style.top = `${btnConfig.y}px`;
                updateInspectorValues(btnConfig);
            });

            window.addEventListener('touchend', () => {
                if (isDragging) {
                    isDragging = false;
                    saveLayoutToStorage();
                }
            });

            canvas.appendChild(btnElem);
        });

        if (state.buttonLayout.length > 0) {
            selectEditorButton(state.buttonLayout[0], canvas.children[0]);
        }
    }

    function selectEditorButton(btnConfig, btnElem) {
        state.controls.selectedEditorBtn = btnConfig;
        document.querySelectorAll('.pojav-btn-node').forEach(n => n.classList.remove('selected'));
        if (btnElem) btnElem.classList.add('selected');
        updateInspectorValues(btnConfig);
        if (window.shadowAudio) window.shadowAudio.playClick();
    }

    function updateInspectorValues(btnConfig) {
        const nameInput = document.getElementById('inspector-btn-name');
        const keyInput = document.getElementById('inspector-btn-key');
        const widthInput = document.getElementById('inspector-btn-width');
        const heightInput = document.getElementById('inspector-btn-height');

        if (nameInput) nameInput.value = btnConfig.text;
        if (keyInput) keyInput.value = btnConfig.key;
        if (widthInput) widthInput.value = btnConfig.w;
        if (heightInput) heightInput.value = btnConfig.h;
    }

    function setupEditorInspector() {
        const nameInput = document.getElementById('inspector-btn-name');
        const widthInput = document.getElementById('inspector-btn-width');
        const heightInput = document.getElementById('inspector-btn-height');

        if (nameInput) {
            nameInput.addEventListener('input', (e) => {
                if (!state.controls.selectedEditorBtn) return;
                state.controls.selectedEditorBtn.text = e.target.value;
                const elem = document.getElementById(`editor-btn-${state.controls.selectedEditorBtn.id}`);
                if (elem) elem.textContent = e.target.value;
                saveLayoutToStorage();
            });
        }

        if (widthInput) {
            widthInput.addEventListener('input', (e) => {
                if (!state.controls.selectedEditorBtn) return;
                state.controls.selectedEditorBtn.w = parseInt(e.target.value, 10) || 40;
                const elem = document.getElementById(`editor-btn-${state.controls.selectedEditorBtn.id}`);
                if (elem) elem.style.width = `${state.controls.selectedEditorBtn.w}px`;
                saveLayoutToStorage();
            });
        }

        if (heightInput) {
            heightInput.addEventListener('input', (e) => {
                if (!state.controls.selectedEditorBtn) return;
                state.controls.selectedEditorBtn.h = parseInt(e.target.value, 10) || 36;
                const elem = document.getElementById(`editor-btn-${state.controls.selectedEditorBtn.id}`);
                if (elem) elem.style.height = `${state.controls.selectedEditorBtn.h}px`;
                saveLayoutToStorage();
            });
        }

        const btnReset = document.getElementById('btn-reset-layout');
        if (btnReset) {
            btnReset.addEventListener('click', () => {
                localStorage.removeItem('shadow_pojav_layout');
                renderControlsEditor();
                if (window.shadowAudio) window.shadowAudio.playSelect();
            });
        }
    }

    function saveLayoutToStorage() {
        try {
            localStorage.setItem('shadow_pojav_layout', JSON.stringify(state.buttonLayout));
        } catch (e) {}
    }

    // 7. Signature Virtual Mouse Pointer Controller (Pojav style)
    function setupVirtualMouse() {
        const mouseCursor = document.getElementById('virtual-mouse-cursor');
        const btnMouseToggle = document.getElementById('p-btn-mouse');

        function updateMousePos(x, y) {
            state.mousePos.x = Math.max(0, Math.min(window.innerWidth - 10, x));
            state.mousePos.y = Math.max(0, Math.min(window.innerHeight - 10, y));
            if (mouseCursor) {
                mouseCursor.style.left = `${state.mousePos.x}px`;
                mouseCursor.style.top = `${state.mousePos.y}px`;
            }
        }

        window.addEventListener('mousemove', (e) => {
            if (state.controls.virtualMouseActive && state.gameRunning) {
                updateMousePos(e.clientX, e.clientY);
            }
        });

        // Touch virtual touchpad
        let lastTouchX = 0, lastTouchY = 0;
        window.addEventListener('touchstart', (e) => {
            if (state.controls.virtualMouseActive && state.gameRunning && e.touches[0]) {
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
            }
        }, { passive: true });

        window.addEventListener('touchmove', (e) => {
            if (state.controls.virtualMouseActive && state.gameRunning && e.touches[0]) {
                const dx = (e.touches[0].clientX - lastTouchX) * (state.controls.mouseSpeed / 50);
                const dy = (e.touches[0].clientY - lastTouchY) * (state.controls.mouseSpeed / 50);
                updateMousePos(state.mousePos.x + dx, state.mousePos.y + dy);
                lastTouchX = e.touches[0].clientX;
                lastTouchY = e.touches[0].clientY;
            }
        }, { passive: true });
    }

    function toggleVirtualMouse() {
        state.controls.virtualMouseActive = !state.controls.virtualMouseActive;
        const cursor = document.getElementById('virtual-mouse-cursor');
        const btnMouse = document.getElementById('p-btn-mouse');

        if (cursor) {
            if (state.controls.virtualMouseActive) cursor.classList.add('active');
            else cursor.classList.remove('active');
        }

        if (btnMouse) {
            if (state.controls.virtualMouseActive) btnMouse.classList.add('active-toggle');
            else btnMouse.classList.remove('active-toggle');
        }

        if (window.shadowAudio) window.shadowAudio.playSelect();
        triggerHaptic(25);
    }

    function toggleGuiVisibility() {
        state.controls.guiHidden = !state.controls.guiHidden;
        const overlay = document.getElementById('ingame-pojav-overlay');
        const btnGui = document.getElementById('p-btn-gui');

        if (overlay) {
            if (state.controls.guiHidden) {
                overlay.classList.add('gui-hidden');
            } else {
                overlay.classList.remove('gui-hidden');
            }
        }
        if (window.shadowAudio) window.shadowAudio.playSelect();
    }

    // 8. 3D Minecraft Skin Canvas Viewer
    function renderSkinViewer() {
        const canvas = document.getElementById('skin-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let rotation = 0.35;
        let isDragging = false;
        let startX = 0;
        let animTime = 0;

        function drawModel() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const cx = canvas.width / 2;
            const cy = canvas.height / 2 + 10;
            const scale = 3.6;

            ctx.save();
            ctx.translate(cx, cy);

            const walkAngle = Math.sin(animTime) * 0.45;

            let bodyColor = '#1f1b2e';
            let trimColor = '#8b5cf6';
            let cyanColor = '#06b6d4';
            let headColor = '#c79c7b';
            let hairColor = '#2d1b4e';

            if (state.account.skin === 'steve') {
                bodyColor = '#00a8a8';
                trimColor = '#2b3990';
                headColor = '#b88359';
                hairColor = '#4a3219';
            }

            // Cape
            if (state.account.cape) {
                ctx.save();
                ctx.rotate(rotation + Math.sin(animTime * 0.8) * 0.08);
                ctx.fillStyle = '#6d28d9';
                ctx.fillRect(-12 * scale, -28 * scale, 24 * scale, 42 * scale);
                ctx.fillStyle = '#06b6d4';
                ctx.fillRect(-6 * scale, -15 * scale, 12 * scale, 16 * scale);
                ctx.restore();
            }

            // Legs
            ctx.save();
            ctx.translate(-6 * scale, 18 * scale);
            ctx.rotate(-walkAngle);
            ctx.fillStyle = trimColor;
            ctx.fillRect(-4 * scale, 0, 8 * scale, 24 * scale);
            ctx.restore();

            ctx.save();
            ctx.translate(6 * scale, 18 * scale);
            ctx.rotate(walkAngle);
            ctx.fillStyle = trimColor;
            ctx.fillRect(-4 * scale, 0, 8 * scale, 24 * scale);
            ctx.restore();

            // Torso
            ctx.save();
            ctx.rotate(rotation * 0.2);
            ctx.fillStyle = bodyColor;
            ctx.fillRect(-10 * scale, -18 * scale, 20 * scale, 36 * scale);
            ctx.fillStyle = cyanColor;
            ctx.fillRect(-8 * scale, -10 * scale, 16 * scale, 4 * scale);
            ctx.restore();

            // Arms
            ctx.save();
            ctx.translate(-14 * scale, -14 * scale);
            ctx.rotate(walkAngle);
            ctx.fillStyle = bodyColor;
            ctx.fillRect(-4 * scale, 0, 8 * scale, 24 * scale);
            ctx.restore();

            ctx.save();
            ctx.translate(14 * scale, -14 * scale);
            ctx.rotate(-walkAngle);
            ctx.fillStyle = bodyColor;
            ctx.fillRect(-4 * scale, 0, 8 * scale, 24 * scale);
            ctx.restore();

            // Head
            ctx.save();
            ctx.translate(0, -32 * scale);
            ctx.rotate(rotation);
            ctx.fillStyle = headColor;
            ctx.fillRect(-10 * scale, -12 * scale, 20 * scale, 20 * scale);
            ctx.fillStyle = hairColor;
            ctx.fillRect(-10 * scale, -12 * scale, 20 * scale, 7 * scale);
            ctx.fillStyle = '#06b6d4';
            ctx.fillRect(-6 * scale, -2 * scale, 3 * scale, 3 * scale);
            ctx.fillRect(3 * scale, -2 * scale, 3 * scale, 3 * scale);
            ctx.restore();

            ctx.restore();
        }

        function animate() {
            animTime += 0.04;
            drawModel();
            if (!isDragging) {
                rotation = Math.sin(animTime * 0.5) * 0.25;
            }
            requestAnimationFrame(animate);
        }

        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
        });
        window.addEventListener('mouseup', () => isDragging = false);
        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                rotation += (e.clientX - startX) * 0.015;
                startX = e.clientX;
            }
        });

        animate();

        document.querySelectorAll('.btn-skin-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                state.account.skin = btn.getAttribute('data-skin');
                document.getElementById('player-skin-name').textContent = btn.textContent;
                if (window.shadowAudio) window.shadowAudio.playClick();
            });
        });
    }

    // 9. Playable Minecraft Simulation Engine with Pojav Controls
    class PojavGameEngine {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.running = false;
            this.lastFrame = performance.now();

            this.player = {
                x: 0, y: 2, z: -5,
                yaw: 0, pitch: 0,
                vx: 0, vy: 0, vz: 0,
                isGrounded: true
            };

            this.inputs = {
                forward: false, backward: false, left: false, right: false,
                jump: false, sneak: false
            };

            this.blocks = [];
            this.activeBlockType = 0;
            this.blockPalette = [
                { name: 'Grass Block', topColor: '#5c9e31', sideColor: '#7a5a3a' },
                { name: 'Diamond Ore', topColor: '#4deeea', sideColor: '#5a6268' },
                { name: 'Oak Wood', topColor: '#b8945f', sideColor: '#6e5130' },
                { name: 'Stone Brick', topColor: '#828282', sideColor: '#616161' }
            ];

            this.initWorld();
            this.setupListeners();
        }

        initWorld() {
            this.blocks = [];
            for (let x = -6; x <= 6; x++) {
                for (let z = -2; z <= 14; z++) {
                    const height = Math.floor(Math.sin(x * 0.5) * Math.cos(z * 0.4) * 1.5);
                    this.blocks.push({
                        x: x, y: height, z: z,
                        type: (x === 0 && z === 5) ? 1 : (Math.abs(x) > 4 ? 2 : 0)
                    });
                }
            }
        }

        setupListeners() {
            let isMouseDown = false;
            let lastX = 0, lastY = 0;

            this.canvas.addEventListener('mousedown', (e) => {
                isMouseDown = true;
                lastX = e.clientX;
                lastY = e.clientY;
            });

            window.addEventListener('mouseup', () => isMouseDown = false);

            window.addEventListener('mousemove', (e) => {
                if (!isMouseDown || !this.running || state.gamePaused) return;
                const dx = e.clientX - lastX;
                const dy = e.clientY - lastY;
                lastX = e.clientX;
                lastY = e.clientY;

                this.player.yaw += dx * 0.005;
                this.player.pitch = Math.max(-1.4, Math.min(1.4, this.player.pitch - dy * 0.005));
            });

            window.addEventListener('keydown', (e) => {
                if (!this.running || state.gamePaused) return;
                if (e.key === 'w' || e.key === 'W') this.inputs.forward = true;
                if (e.key === 's' || e.key === 'S') this.inputs.backward = true;
                if (e.key === 'a' || e.key === 'A') this.inputs.left = true;
                if (e.key === 'd' || e.key === 'D') this.inputs.right = true;
                if (e.key === ' ') this.jump();
                if (e.key === 'Escape') toggleGamePause();
                if (e.key === 'F3' || e.key === 'f3') toggleF3();
            });

            window.addEventListener('keyup', (e) => {
                if (e.key === 'w' || e.key === 'W') this.inputs.forward = false;
                if (e.key === 's' || e.key === 'S') this.inputs.backward = false;
                if (e.key === 'a' || e.key === 'A') this.inputs.left = false;
                if (e.key === 'd' || e.key === 'D') this.inputs.right = false;
            });

            this.canvas.addEventListener('click', () => {
                if (!this.running || state.gamePaused) return;
                this.breakBlock();
            });

            this.canvas.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                if (!this.running || state.gamePaused) return;
                this.placeBlock();
            });
        }

        jump() {
            if (this.player.isGrounded) {
                this.player.vy = 0.22;
                this.player.isGrounded = false;
                if (window.shadowAudio) window.shadowAudio.playClick();
                triggerHaptic(20);
            }
        }

        breakBlock() {
            if (this.blocks.length > 0) {
                this.blocks.splice(Math.floor(this.blocks.length / 2), 1);
                if (window.shadowAudio) window.shadowAudio.playBlockBreak();
                triggerHaptic(30);
            }
        }

        placeBlock() {
            const forwardX = -Math.sin(this.player.yaw) * 2;
            const forwardZ = Math.cos(this.player.yaw) * 2;
            this.blocks.push({
                x: Math.round(this.player.x + forwardX),
                y: Math.round(this.player.y),
                z: Math.round(this.player.z + forwardZ),
                type: this.activeBlockType
            });
            if (window.shadowAudio) window.shadowAudio.playBlockPlace();
            triggerHaptic(25);
        }

        start() {
            this.running = true;
            this.resize();
            window.addEventListener('resize', () => this.resize());
            this.loop();
        }

        stop() {
            this.running = false;
        }

        resize() {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
        }

        update(dt) {
            if (state.gamePaused) return;

            const speed = 4.5 * dt;
            const forward = (this.inputs.forward ? 1 : 0) - (this.inputs.backward ? 1 : 0);
            const side = (this.inputs.right ? 1 : 0) - (this.inputs.left ? 1 : 0);

            if (forward !== 0 || side !== 0) {
                const moveAngle = this.player.yaw + Math.atan2(side, forward);
                this.player.x += -Math.sin(moveAngle) * speed;
                this.player.z += Math.cos(moveAngle) * speed;
            }

            this.player.vy -= 0.6 * dt;
            this.player.y += this.player.vy;
            if (this.player.y <= 2.0) {
                this.player.y = 2.0;
                this.player.vy = 0;
                this.player.isGrounded = true;
            }
        }

        render() {
            const ctx = this.ctx;
            const w = this.canvas.width;
            const h = this.canvas.height;

            const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
            skyGradient.addColorStop(0, '#5389d4');
            skyGradient.addColorStop(0.65, '#99bceb');
            skyGradient.addColorStop(1, '#658d57');
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, w, h);

            // Sun with bloom
            const sunX = w * 0.75 - Math.sin(this.player.yaw) * 120;
            const sunY = h * 0.25 + Math.sin(this.player.pitch) * 80;
            const sunGlow = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 70);
            sunGlow.addColorStop(0, 'rgba(255, 255, 220, 1)');
            sunGlow.addColorStop(0.3, 'rgba(255, 240, 160, 0.6)');
            sunGlow.addColorStop(1, 'rgba(255, 200, 100, 0)');
            ctx.fillStyle = sunGlow;
            ctx.beginPath();
            ctx.arc(sunX, sunY, 70, 0, Math.PI * 2);
            ctx.fill();

            // Perspective voxels
            const fov = 400;
            const cx = w / 2;
            const cy = h / 2;

            const sortedBlocks = this.blocks.map(b => {
                const dx = b.x - this.player.x;
                const dy = b.y - this.player.y;
                const dz = b.z - this.player.z;

                const rx = dx * Math.cos(-this.player.yaw) - dz * Math.sin(-this.player.yaw);
                const rz = dx * Math.sin(-this.player.yaw) + dz * Math.cos(-this.player.yaw);
                const ry = dy * Math.cos(-this.player.pitch) - rz * Math.sin(-this.player.pitch);
                const finalZ = dy * Math.sin(-this.player.pitch) + rz * Math.cos(-this.player.pitch);

                return { ...b, rx, ry, rz: finalZ };
            }).filter(b => b.rz > 0.8)
              .sort((a, b) => b.rz - a.rz);

            sortedBlocks.forEach(b => {
                const bSize = (fov / b.rz) * 0.85;
                const sx = cx + (b.rx * fov) / b.rz;
                const sy = cy - (b.ry * fov) / b.rz;
                const p = this.blockPalette[b.type] || this.blockPalette[0];

                // Top Face
                ctx.fillStyle = p.topColor;
                ctx.beginPath();
                ctx.moveTo(sx, sy - bSize);
                ctx.lineTo(sx + bSize * 0.7, sy - bSize * 0.6);
                ctx.lineTo(sx, sy - bSize * 0.2);
                ctx.lineTo(sx - bSize * 0.7, sy - bSize * 0.6);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.stroke();

                // Left Face
                ctx.fillStyle = p.sideColor;
                ctx.beginPath();
                ctx.moveTo(sx - bSize * 0.7, sy - bSize * 0.6);
                ctx.lineTo(sx, sy - bSize * 0.2);
                ctx.lineTo(sx, sy + bSize * 0.6);
                ctx.lineTo(sx - bSize * 0.7, sy + bSize * 0.2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Right Face
                ctx.fillStyle = p.sideColor;
                ctx.beginPath();
                ctx.moveTo(sx, sy - bSize * 0.2);
                ctx.lineTo(sx + bSize * 0.7, sy - bSize * 0.6);
                ctx.lineTo(sx + bSize * 0.7, sy + bSize * 0.2);
                ctx.lineTo(sx, sy + bSize * 0.6);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            });

            // F3 Telemetry Overlay
            const hudElem = document.getElementById('ingame-f3-hud');
            if (hudElem && state.f3Visible) {
                const ramUsed = Math.round(state.optimizer.ramMb * 0.32);
                hudElem.style.display = 'block';
                hudElem.innerHTML = `
                    <b>Minecraft ${state.profile.version} (${state.profile.loader}) [Pojav/MJ Core]</b><br>
                    ${state.optimizer.maxFps} fps (${(1000 / state.optimizer.maxFps).toFixed(1)}ms) T: ${state.optimizer.maxFps}<br>
                    Java: ${state.profile.jre} · Renderer: ${state.profile.renderer}<br>
                    Mem: 32% ${ramUsed}/${state.optimizer.ramMb}MB (Alloc: 40%)<br>
                    XYZ: ${this.player.x.toFixed(3)} / ${this.player.y.toFixed(3)} / ${this.player.z.toFixed(3)}<br>
                    Facing: Yaw ${(this.player.yaw * 180 / Math.PI).toFixed(1)}° / Pitch ${(this.player.pitch * 180 / Math.PI).toFixed(1)}°<br>
                    Selected: ${this.blockPalette[this.activeBlockType].name}
                `;
            } else if (hudElem) {
                hudElem.style.display = 'none';
            }
        }

        loop() {
            if (!this.running) return;
            const now = performance.now();
            const dt = Math.min(0.1, (now - this.lastFrame) / 1000);
            this.lastFrame = now;

            this.update(dt);
            this.render();

            requestAnimationFrame(() => this.loop());
        }
    }

    function toggleF3() {
        state.f3Visible = !state.f3Visible;
        if (window.shadowAudio) window.shadowAudio.playSelect();
    }

    function toggleGamePause() {
        const pauseModal = document.getElementById('game-pause-modal');
        state.gamePaused = !state.gamePaused;
        if (pauseModal) {
            if (state.gamePaused) pauseModal.classList.add('active');
            else pauseModal.classList.remove('active');
        }
        if (window.shadowAudio) window.shadowAudio.playSelect();
    }

    // 10. Pojav / MJ Ingame Overlay Controls Handler
    function setupPojavControlsListeners() {
        // D-Pad buttons
        const attachAction = (id, onDown, onUp) => {
            const elem = document.getElementById(id);
            if (!elem) return;
            const press = (e) => {
                e.preventDefault();
                elem.classList.add('pressed');
                triggerHaptic(20);
                if (window.shadowAudio) window.shadowAudio.playClick();
                if (onDown) onDown();
            };
            const release = (e) => {
                e.preventDefault();
                elem.classList.remove('pressed');
                if (onUp) onUp();
            };
            elem.addEventListener('mousedown', press);
            elem.addEventListener('mouseup', release);
            elem.addEventListener('mouseleave', release);
            elem.addEventListener('touchstart', press, { passive: false });
            elem.addEventListener('touchend', release, { passive: false });
            elem.addEventListener('touchcancel', release, { passive: false });
        };

        // Movement
        attachAction('p-dpad-up', () => { if (window.activePojavGame) window.activePojavGame.inputs.forward = true; }, () => { if (window.activePojavGame) window.activePojavGame.inputs.forward = false; });
        attachAction('p-dpad-down', () => { if (window.activePojavGame) window.activePojavGame.inputs.backward = true; }, () => { if (window.activePojavGame) window.activePojavGame.inputs.backward = false; });
        attachAction('p-dpad-left', () => { if (window.activePojavGame) window.activePojavGame.inputs.left = true; }, () => { if (window.activePojavGame) window.activePojavGame.inputs.left = false; });
        attachAction('p-dpad-right', () => { if (window.activePojavGame) window.activePojavGame.inputs.right = true; }, () => { if (window.activePojavGame) window.activePojavGame.inputs.right = false; });

        // Action Buttons (PRI, SEC, JUMP, SNEAK)
        attachAction('p-btn-pri', () => { if (window.activePojavGame) window.activePojavGame.breakBlock(); });
        attachAction('p-btn-sec', () => { if (window.activePojavGame) window.activePojavGame.placeBlock(); });
        attachAction('p-btn-jump', () => { if (window.activePojavGame) window.activePojavGame.jump(); });
        attachAction('p-btn-sneak', () => { if (window.activePojavGame) window.activePojavGame.inputs.sneak = !window.activePojavGame.inputs.sneak; });

        // Top bar buttons (ESC, MOUSE, GUI, F3, F5, CHAT)
        const btnEsc = document.getElementById('p-btn-esc');
        if (btnEsc) btnEsc.addEventListener('click', toggleGamePause);

        const btnMouse = document.getElementById('p-btn-mouse');
        if (btnMouse) btnMouse.addEventListener('click', toggleVirtualMouse);

        const btnGui = document.getElementById('p-btn-gui');
        if (btnGui) btnGui.addEventListener('click', toggleGuiVisibility);

        const btnF3 = document.getElementById('p-btn-f3');
        if (btnF3) btnF3.addEventListener('click', toggleF3);

        const btnF5 = document.getElementById('p-btn-f5');
        if (btnF5) btnF5.addEventListener('click', () => {
            if (window.activePojavGame) {
                window.activePojavGame.player.yaw += Math.PI;
                if (window.shadowAudio) window.shadowAudio.playSelect();
            }
        });

        // Hotbar selection
        document.querySelectorAll('.hotbar-slot').forEach((slot, index) => {
            slot.addEventListener('click', () => {
                document.querySelectorAll('.hotbar-slot').forEach(s => s.classList.remove('active'));
                slot.classList.add('active');
                if (window.activePojavGame) {
                    window.activePojavGame.activeBlockType = index % window.activePojavGame.blockPalette.length;
                }
                if (window.shadowAudio) window.shadowAudio.playSelect();
            });
        });
    }

    // 11. Launch Sequence
    function setupLaunchSequence() {
        const btnPlay = document.getElementById('btn-pojav-play');
        const overlay = document.getElementById('game-simulator-overlay');
        const progressScreen = document.getElementById('launch-progress-screen');
        const progressFill = document.getElementById('launch-progress-fill');
        const progressTitle = document.getElementById('progress-status-title');
        const terminal = document.getElementById('launch-terminal-console');

        if (!btnPlay) return;

        btnPlay.addEventListener('click', () => {
            if (window.shadowAudio) window.shadowAudio.playLaunch();
            triggerHaptic(60);

            // Native Android APK Bridge
            if (window.ShadowNative && typeof window.ShadowNative.launchGame === 'function') {
                const configPayload = {
                    version: state.profile.version,
                    loader: state.profile.loader,
                    jre: state.profile.jre,
                    memoryMb: state.optimizer.ramMb,
                    renderer: state.optimizer.renderer,
                    jvmFlags: state.optimizer.customJvmArgs,
                    maxFps: state.optimizer.maxFps,
                    username: state.account.username
                };
                window.ShadowNative.launchGame(JSON.stringify(configPayload));
            }

            overlay.classList.add('active');
            progressScreen.style.display = 'flex';
            terminal.innerHTML = '';
            state.gameRunning = true;

            const logs = [
                { t: `[ShadowLauncher/INFO]: Launching Pojav-MJ Core engine for ${state.profile.name}...`, p: 15 },
                { t: `[JavaRuntime/INFO]: Binding ${state.profile.jre} with ${state.optimizer.ramMb}MB allocated heap`, p: 35 },
                { t: `[GraphicsPipeline/INFO]: Initializing ${state.profile.renderer} surface`, p: 55 },
                { t: `[LWJGL3/INFO]: Loaded Android LWJGL native bindings & OpenAL audio engine`, p: 75 },
                { t: `[Minecraft/INFO]: Resolution scaled to ${state.optimizer.resScale}%. Display lock: ${state.optimizer.maxFps} FPS`, p: 90 },
                { t: `[ShadowTouch/INFO]: Pojav virtual touch map initialized. Starting game loop!`, p: 100 }
            ];

            let step = 0;
            function nextStep() {
                if (step < logs.length) {
                    const item = logs[step];
                    terminal.innerHTML += `<div>${item.t}</div>`;
                    terminal.scrollTop = terminal.scrollHeight;
                    progressFill.style.width = `${item.p}%`;
                    progressTitle.textContent = `Booting ${state.profile.name}... (${item.p}%)`;
                    step++;
                    setTimeout(nextStep, 280);
                } else {
                    setTimeout(() => {
                        progressScreen.style.display = 'none';
                        const canvas = document.getElementById('mc-game-canvas');
                        if (canvas) {
                            window.activePojavGame = new PojavGameEngine(canvas);
                            window.activePojavGame.start();
                        }
                    }, 400);
                }
            }
            nextStep();
        });

        // Pause Menu
        const btnResume = document.getElementById('btn-pause-resume');
        const btnExit = document.getElementById('btn-pause-exit');
        const pauseModal = document.getElementById('game-pause-modal');

        if (btnResume) btnResume.addEventListener('click', toggleGamePause);
        if (btnExit) {
            btnExit.addEventListener('click', () => {
                if (window.activePojavGame) {
                    window.activePojavGame.stop();
                    window.activePojavGame = null;
                }
                overlay.classList.remove('active');
                pauseModal.classList.remove('active');
                state.gameRunning = false;
                state.gamePaused = false;
                if (window.shadowAudio) window.shadowAudio.playClick();
            });
        }
    }

    // 12. Mod Manager & Custom JAR Installer Modal
    function setupJarInstaller() {
        const btnInstallJar = document.getElementById('btn-install-jar');
        if (btnInstallJar) {
            btnInstallJar.addEventListener('click', () => {
                alert('Pojav / MJ .JAR Installer: Select Fabric-installer.jar, Forge-installer.jar, or OptiFine.jar to install custom modloaders directly into Shadow Launcher.');
            });
        }
    }

    // Document Ready
    document.addEventListener('DOMContentLoaded', () => {
        initHardwareInfo();
        setupTabs();
        setupProfiles();
        setupEditorInspector();
        setupVirtualMouse();
        setupPojavControlsListeners();
        setupLaunchSequence();
        setupJarInstaller();
    });

})();
