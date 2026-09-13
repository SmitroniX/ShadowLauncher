// Shadow Launcher — Core Engine, UI Controller & Game Simulator

(function() {
    'use strict';

    // 1. Initial State
    const state = {
        profile: {
            id: 'fabric-1.21.1',
            name: '1.21.1 Fabric (Iris + Sodium)',
            version: '1.21.1',
            loader: 'Fabric 0.16.0',
            renderer: 'VulkanMod (Mobile Vulkan 1.3)',
            expectedFps: 120
        },
        optimizer: {
            ramMb: 4096,
            systemRamMb: 8192,
            gcMode: 'aikar',
            renderer: 'vulkan',
            resScale: 100,
            maxFps: 120,
            lowMemMode: false,
            chunkThreads: 4,
            aggressiveCulling: true,
            customJvmArgs: ''
        },
        controls: {
            opacity: 75,
            scale: 100,
            haptics: true,
            gyro: false,
            gyroSens: 50,
            activeSlot: 0
        },
        account: {
            username: 'ShadowPlayer_99',
            mode: 'Microsoft Online',
            skin: 'shadow_samurai',
            cape: 'shadow_wings'
        },
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
        gameRunning: false,
        gamePaused: false
    };

    // 2. Hardware / Native Bridge Detection
    function initHardwareInfo() {
        if (window.ShadowNative) {
            try {
                const infoStr = window.ShadowNative.getDeviceInfo();
                const info = JSON.parse(infoStr);
                if (info.totalRamMb) {
                    state.optimizer.systemRamMb = info.totalRamMb;
                    state.optimizer.ramMb = window.ShadowNative.getRecommendedRamMb();
                }
                const devElem = document.getElementById('device-model-text');
                if (devElem && info.model) {
                    devElem.textContent = `${info.brand || ''} ${info.model} (${info.cpuCores} Cores)`;
                }
            } catch (e) {
                console.warn('Native bridge error:', e);
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

    // 3. JVM Arguments Generator
    function generateJvmArgs() {
        let gcArgs = '';
        if (state.optimizer.gcMode === 'aikar') {
            gcArgs = '-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=200 -XX:+UnlockExperimentalVMOptions -XX:+DisableExplicitGC -XX:+AlwaysPreTouch -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1ReservePercent=20';
        } else if (state.optimizer.gcMode === 'shenandoah') {
            gcArgs = '-XX:+UseShenandoahGC -XX:ShenandoahGCHeuristics=compact -XX:ShenandoahAllocationThreshold=70 -XX:+AlwaysPreTouch';
        } else if (state.optimizer.gcMode === 'zgc') {
            gcArgs = '-XX:+UseZGC -XX:+ZGenerational -XX:+UnlockExperimentalVMOptions -XX:ZAllocationSpikeTolerance=5';
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

        const recElem = document.getElementById('ram-recommendation-note');
        if (recElem) {
            if (pct <= 50) {
                recElem.textContent = `Optimal & Safe for device. (Leaves ${100 - pct}% for Android OS)`;
                recElem.style.color = 'var(--emerald)';
            } else if (pct <= 70) {
                recElem.textContent = `High allocation. Recommended only for heavy modpacks / shaders.`;
                recElem.style.color = 'var(--amber)';
            } else {
                recElem.textContent = `Warning: High RAM allocation may cause Android OS background throttle.`;
                recElem.style.color = 'var(--rose)';
            }
        }
    }

    // 4. Tab Switching
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

                if (target === 'skins') {
                    renderSkinViewer();
                }
            });
        });
    }

    // 5. Version Profile Switcher
    function setupProfiles() {
        const selector = document.getElementById('version-select');
        if (!selector) return;

        const profiles = {
            'fabric-1.21.1': { name: '1.21.1 Fabric (Iris + Sodium)', version: '1.21.1', loader: 'Fabric 0.16.0', renderer: 'VulkanMod (Mobile Vulkan 1.3)', expectedFps: 120 },
            'forge-1.20.1': { name: '1.20.1 Forge + Create Engine', version: '1.20.1', loader: 'Forge 47.3.0', renderer: 'Holy GL4ES 1.1.5', expectedFps: 90 },
            'pvp-1.8.9': { name: '1.8.9 Hypixel PvP Feather', version: '1.8.9', loader: 'OptiFine HD U M5', renderer: 'Holy GL4ES (Fast)', expectedFps: 144 },
            'vanilla-1.21.1': { name: '1.21.1 Vanilla Release', version: '1.21.1', loader: 'Vanilla Mojang', renderer: 'ANGLE GLES3', expectedFps: 75 }
        };

        selector.addEventListener('change', (e) => {
            const chosen = profiles[e.target.value];
            if (chosen) {
                state.profile = chosen;
                document.getElementById('banner-version-title').textContent = `Minecraft Java ${chosen.version}`;
                document.getElementById('badge-loader-text').textContent = chosen.loader;
                document.getElementById('badge-renderer-text').textContent = chosen.renderer;
                document.getElementById('badge-fps-text').textContent = `⚡ ~${chosen.expectedFps} FPS Target`;
                if (window.shadowAudio) window.shadowAudio.playClick();
            }
        });
    }

    // 6. Optimizer Settings Controls
    function setupOptimizerListeners() {
        const ramSlider = document.getElementById('ram-slider');
        if (ramSlider) {
            ramSlider.addEventListener('input', (e) => {
                state.optimizer.ramMb = parseInt(e.target.value, 10);
                updateRamDisplays();
                generateJvmArgs();
            });
        }

        const gcSelect = document.getElementById('gc-mode-select');
        if (gcSelect) {
            gcSelect.addEventListener('change', (e) => {
                state.optimizer.gcMode = e.target.value;
                generateJvmArgs();
                if (window.shadowAudio) window.shadowAudio.playClick();
            });
        }

        const rendererSelect = document.getElementById('renderer-select');
        if (rendererSelect) {
            rendererSelect.addEventListener('change', (e) => {
                state.optimizer.renderer = e.target.value;
                generateJvmArgs();
                if (window.shadowAudio) window.shadowAudio.playClick();
            });
        }

        const fpsSelect = document.getElementById('fps-cap-select');
        if (fpsSelect) {
            fpsSelect.addEventListener('change', (e) => {
                state.optimizer.maxFps = parseInt(e.target.value, 10);
                if (window.shadowAudio) window.shadowAudio.playClick();
            });
        }

        const btnCopyJvm = document.getElementById('btn-copy-jvm');
        if (btnCopyJvm) {
            btnCopyJvm.addEventListener('click', () => {
                const area = document.getElementById('jvm-args-textarea');
                if (area) {
                    navigator.clipboard.writeText(area.value).then(() => {
                        btnCopyJvm.textContent = 'Copied!';
                        setTimeout(() => btnCopyJvm.textContent = 'Copy Arguments', 1800);
                    });
                }
            });
        }
    }

    // 7. Mod Manager Toggles
    function renderModsList() {
        const container = document.getElementById('mods-container');
        if (!container) return;

        container.innerHTML = '';
        state.mods.forEach(mod => {
            const item = document.createElement('div');
            item.className = 'mod-item';
            item.innerHTML = `
                <div class="mod-meta">
                    <div class="mod-icon-box">${mod.icon}</div>
                    <div>
                        <div class="mod-title">${mod.name} <span style="font-size: 11px; color: var(--primary-hover); font-weight: 500;">v${mod.ver}</span></div>
                        <div class="mod-summary">${mod.desc} · by ${mod.author}</div>
                    </div>
                </div>
                <div>
                    <label class="switch">
                        <input type="checkbox" class="mod-toggle-input" data-id="${mod.id}" ${mod.enabled ? 'checked' : ''}>
                        <span class="switch-slider"></span>
                    </label>
                </div>
            `;
            container.appendChild(item);
        });

        container.querySelectorAll('.mod-toggle-input').forEach(input => {
            input.addEventListener('change', (e) => {
                const id = e.target.getAttribute('data-id');
                const m = state.mods.find(x => x.id === id);
                if (m) {
                    m.enabled = e.target.checked;
                    if (window.shadowAudio) window.shadowAudio.playClick();
                }
            });
        });
    }

    // 8. Virtual Gamepad Customizer & Interaction
    function setupVirtualControls() {
        const opacSlider = document.getElementById('ctrl-opacity-slider');
        const scaleSlider = document.getElementById('ctrl-scale-slider');
        const hapticToggle = document.getElementById('ctrl-haptic-toggle');
        const overlay = document.querySelector('.virtual-gamepad-overlay');

        if (opacSlider && overlay) {
            opacSlider.addEventListener('input', (e) => {
                state.controls.opacity = parseInt(e.target.value, 10);
                document.getElementById('ctrl-opac-val').textContent = `${state.controls.opacity}%`;
                overlay.style.opacity = state.controls.opacity / 100;
            });
        }

        if (scaleSlider && overlay) {
            scaleSlider.addEventListener('input', (e) => {
                state.controls.scale = parseInt(e.target.value, 10);
                document.getElementById('ctrl-scale-val').textContent = `${state.controls.scale}%`;
                overlay.style.transform = `scale(${state.controls.scale / 100})`;
                overlay.style.transformOrigin = 'center center';
            });
        }

        if (hapticToggle) {
            hapticToggle.addEventListener('change', (e) => {
                state.controls.haptics = e.target.checked;
            });
        }

        // Attach tactile listeners to all virtual buttons
        const vButtons = document.querySelectorAll('.v-btn, .v-util-btn, .hotbar-slot');
        vButtons.forEach(btn => {
            const onPress = (e) => {
                e.preventDefault();
                btn.classList.add('pressed');
                triggerHaptic(20);
                if (window.shadowAudio) window.shadowAudio.playClick();

                const action = btn.getAttribute('data-action');
                if (action && window.activeGameInstance) {
                    window.activeGameInstance.handleInput(action, true);
                }
            };

            const onRelease = (e) => {
                e.preventDefault();
                btn.classList.remove('pressed');
                const action = btn.getAttribute('data-action');
                if (action && window.activeGameInstance) {
                    window.activeGameInstance.handleInput(action, false);
                }
            };

            btn.addEventListener('mousedown', onPress);
            btn.addEventListener('mouseup', onRelease);
            btn.addEventListener('mouseleave', onRelease);

            btn.addEventListener('touchstart', onPress, { passive: false });
            btn.addEventListener('touchend', onRelease, { passive: false });
            btn.addEventListener('touchcancel', onRelease, { passive: false });
        });

        // Hotbar selection
        const hotbarSlots = document.querySelectorAll('.hotbar-slot');
        hotbarSlots.forEach((slot, index) => {
            slot.addEventListener('click', () => {
                hotbarSlots.forEach(s => s.classList.remove('active'));
                slot.classList.add('active');
                state.controls.activeSlot = index;
                if (window.activeGameInstance) {
                    window.activeGameInstance.setActiveBlock(index);
                }
                if (window.shadowAudio) window.shadowAudio.playSelect();
            });
        });
    }

    // 9. 3D Minecraft Skin Canvas Viewer
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

            // Colors based on selected skin
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

            // Draw Cape
            if (state.account.cape) {
                ctx.save();
                ctx.rotate(rotation + Math.sin(animTime * 0.8) * 0.08);
                ctx.fillStyle = '#6d28d9';
                ctx.fillRect(-12 * scale, -28 * scale, 24 * scale, 42 * scale);
                ctx.fillStyle = '#06b6d4';
                ctx.fillRect(-6 * scale, -15 * scale, 12 * scale, 16 * scale);
                ctx.restore();
            }

            // Left Leg
            ctx.save();
            ctx.translate(-6 * scale, 18 * scale);
            ctx.rotate(-walkAngle);
            ctx.fillStyle = trimColor;
            ctx.fillRect(-4 * scale, 0, 8 * scale, 24 * scale);
            ctx.fillStyle = '#111';
            ctx.fillRect(-4 * scale, 18 * scale, 8 * scale, 6 * scale);
            ctx.restore();

            // Right Leg
            ctx.save();
            ctx.translate(6 * scale, 18 * scale);
            ctx.rotate(walkAngle);
            ctx.fillStyle = trimColor;
            ctx.fillRect(-4 * scale, 0, 8 * scale, 24 * scale);
            ctx.fillStyle = '#111';
            ctx.fillRect(-4 * scale, 18 * scale, 8 * scale, 6 * scale);
            ctx.restore();

            // Torso
            ctx.save();
            ctx.rotate(rotation * 0.2);
            ctx.fillStyle = bodyColor;
            ctx.fillRect(-10 * scale, -18 * scale, 20 * scale, 36 * scale);
            // Armor accent
            ctx.fillStyle = cyanColor;
            ctx.fillRect(-8 * scale, -10 * scale, 16 * scale, 4 * scale);
            ctx.restore();

            // Left Arm
            ctx.save();
            ctx.translate(-14 * scale, -14 * scale);
            ctx.rotate(walkAngle);
            ctx.fillStyle = bodyColor;
            ctx.fillRect(-4 * scale, 0, 8 * scale, 24 * scale);
            ctx.fillStyle = headColor;
            ctx.fillRect(-4 * scale, 18 * scale, 8 * scale, 6 * scale);
            ctx.restore();

            // Right Arm
            ctx.save();
            ctx.translate(14 * scale, -14 * scale);
            ctx.rotate(-walkAngle);
            ctx.fillStyle = bodyColor;
            ctx.fillRect(-4 * scale, 0, 8 * scale, 24 * scale);
            ctx.fillStyle = headColor;
            ctx.fillRect(-4 * scale, 18 * scale, 8 * scale, 6 * scale);
            ctx.restore();

            // Head
            ctx.save();
            ctx.translate(0, -32 * scale);
            ctx.rotate(rotation);
            ctx.fillStyle = headColor;
            ctx.fillRect(-10 * scale, -12 * scale, 20 * scale, 20 * scale);
            // Hair
            ctx.fillStyle = hairColor;
            ctx.fillRect(-10 * scale, -12 * scale, 20 * scale, 7 * scale);
            // Glowing Cyber Eyes
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

        // Touch support for dragging skin
        canvas.addEventListener('touchstart', (e) => {
            isDragging = true;
            startX = e.touches[0].clientX;
        });
        window.addEventListener('touchend', () => isDragging = false);
        window.addEventListener('touchmove', (e) => {
            if (isDragging && e.touches[0]) {
                rotation += (e.touches[0].clientX - startX) * 0.015;
                startX = e.touches[0].clientX;
            }
        });

        animate();

        // Skin Selector buttons
        document.querySelectorAll('.btn-skin-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                state.account.skin = btn.getAttribute('data-skin');
                document.getElementById('player-skin-name').textContent = btn.textContent;
                if (window.shadowAudio) window.shadowAudio.playClick();
            });
        });
    }

    // 10. Minecraft Launch Experience & Playable 3D Simulator
    class MinecraftSimulationEngine {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.running = false;
            this.fps = 120;
            this.frameTime = 8.3;
            this.lastFrame = performance.now();

            // World / Player position
            this.player = {
                x: 0,
                y: 2,
                z: -5,
                yaw: 0,
                pitch: 0,
                vx: 0,
                vy: 0,
                vz: 0,
                isGrounded: true
            };

            this.inputs = {
                forward: false,
                backward: false,
                left: false,
                right: false,
                jump: false,
                sneak: false,
                attack: false,
                place: false
            };

            // Voxel blocks in simulation
            this.blocks = [];
            this.activeBlockType = 0; // 0: Grass, 1: Diamond, 2: Wood, 3: Stone
            this.blockPalette = [
                { name: 'Grass Block', topColor: '#5c9e31', sideColor: '#7a5a3a' },
                { name: 'Diamond Ore', topColor: '#4deeea', sideColor: '#5a6268' },
                { name: 'Oak Wood', topColor: '#b8945f', sideColor: '#6e5130' },
                { name: 'Stone Brick', topColor: '#828282', sideColor: '#616161' }
            ];

            this.initWorld();
            this.setupControls();
        }

        initWorld() {
            this.blocks = [];
            // Generate a 12x12 rolling landscape
            for (let x = -6; x <= 6; x++) {
                for (let z = -2; z <= 14; z++) {
                    const height = Math.floor(Math.sin(x * 0.5) * Math.cos(z * 0.4) * 1.5);
                    this.blocks.push({
                        x: x,
                        y: height,
                        z: z,
                        type: (x === 0 && z === 5) ? 1 : (Math.abs(x) > 4 ? 2 : 0)
                    });
                }
            }
        }

        setupControls() {
            // Mouse look
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

            // Keyboard input
            window.addEventListener('keydown', (e) => {
                if (!this.running || state.gamePaused) return;
                if (e.key === 'w' || e.key === 'W') this.inputs.forward = true;
                if (e.key === 's' || e.key === 'S') this.inputs.backward = true;
                if (e.key === 'a' || e.key === 'A') this.inputs.left = true;
                if (e.key === 'd' || e.key === 'D') this.inputs.right = true;
                if (e.key === ' ') {
                    this.inputs.jump = true;
                    if (this.player.isGrounded) {
                        this.player.vy = 0.22;
                        this.player.isGrounded = false;
                        if (window.shadowAudio) window.shadowAudio.playClick();
                    }
                }
                if (e.key === 'Shift') this.inputs.sneak = true;
                if (e.key === 'Escape') toggleGamePause();
            });

            window.addEventListener('keyup', (e) => {
                if (e.key === 'w' || e.key === 'W') this.inputs.forward = false;
                if (e.key === 's' || e.key === 'S') this.inputs.backward = false;
                if (e.key === 'a' || e.key === 'A') this.inputs.left = false;
                if (e.key === 'd' || e.key === 'D') this.inputs.right = false;
                if (e.key === ' ') this.inputs.jump = false;
                if (e.key === 'Shift') this.inputs.sneak = false;
            });

            // Attack (Click) / Place (Right click)
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

        handleInput(action, isDown) {
            if (action === 'up') this.inputs.forward = isDown;
            if (action === 'down') this.inputs.backward = isDown;
            if (action === 'left') this.inputs.left = isDown;
            if (action === 'right') this.inputs.right = isDown;
            if (action === 'jump') {
                this.inputs.jump = isDown;
                if (isDown && this.player.isGrounded) {
                    this.player.vy = 0.22;
                    this.player.isGrounded = false;
                }
            }
            if (action === 'sneak') this.inputs.sneak = isDown;
            if (action === 'attack' && isDown) this.breakBlock();
            if (action === 'use' && isDown) this.placeBlock();
            if (action === 'menu' && isDown) toggleGamePause();
        }

        setActiveBlock(index) {
            this.activeBlockType = index % this.blockPalette.length;
        }

        breakBlock() {
            if (this.blocks.length > 0) {
                // Remove block closest to front
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

            // Gravity
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

            // Sky gradient (Vibrant Minecraft sky / shaders)
            const skyGradient = ctx.createLinearGradient(0, 0, 0, h);
            skyGradient.addColorStop(0, '#5389d4');
            skyGradient.addColorStop(0.65, '#99bceb');
            skyGradient.addColorStop(1, '#658d57');
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, w, h);

            // Sun with Iris bloom effect
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

            // Render 3D Voxels (Perspective Projection)
            const fov = 400;
            const cx = w / 2;
            const cy = h / 2;

            // Sort blocks painter's algorithm
            const sortedBlocks = this.blocks.map(b => {
                // Camera relative coords
                const dx = b.x - this.player.x;
                const dy = b.y - this.player.y;
                const dz = b.z - this.player.z;

                // Yaw rotation
                const rx = dx * Math.cos(-this.player.yaw) - dz * Math.sin(-this.player.yaw);
                const rz = dx * Math.sin(-this.player.yaw) + dz * Math.cos(-this.player.yaw);
                // Pitch rotation
                const ry = dy * Math.cos(-this.player.pitch) - rz * Math.sin(-this.player.pitch);
                const finalZ = dy * Math.sin(-this.player.pitch) + rz * Math.cos(-this.player.pitch);

                return { ...b, rx, ry, rz: finalZ };
            }).filter(b => b.rz > 0.8)
              .sort((a, b) => b.rz - a.rz);

            // Draw each voxel cube
            sortedBlocks.forEach(b => {
                const bSize = (fov / b.rz) * 0.85;
                const sx = cx + (b.rx * fov) / b.rz;
                const sy = cy - (b.ry * fov) / b.rz;

                const p = this.blockPalette[b.type] || this.blockPalette[0];

                // Cube Top Face
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

                // Cube Left Face
                ctx.fillStyle = p.sideColor;
                ctx.beginPath();
                ctx.moveTo(sx - bSize * 0.7, sy - bSize * 0.6);
                ctx.lineTo(sx, sy - bSize * 0.2);
                ctx.lineTo(sx, sy + bSize * 0.6);
                ctx.lineTo(sx - bSize * 0.7, sy + bSize * 0.2);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Cube Right Face
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

            // In-game F3 Telemetry overlay update
            const hudElem = document.getElementById('ingame-f3-hud');
            if (hudElem) {
                const ramUsed = Math.round(state.optimizer.ramMb * 0.32);
                hudElem.innerHTML = `
                    <b>Minecraft 1.21.1 (${state.profile.loader}) - Shadow Turbo</b><br>
                    ${state.optimizer.maxFps} fps (${(1000 / state.optimizer.maxFps).toFixed(1)}ms) T: ${state.optimizer.maxFps}<br>
                    Renderer: ${state.profile.renderer}<br>
                    Mem: 32% ${ramUsed}/${state.optimizer.ramMb}MB (Alloc: 40%)<br>
                    XYZ: ${this.player.x.toFixed(3)} / ${this.player.y.toFixed(3)} / ${this.player.z.toFixed(3)}<br>
                    Facing: Yaw ${(this.player.yaw * 180 / Math.PI).toFixed(1)}° / Pitch ${(this.player.pitch * 180 / Math.PI).toFixed(1)}°<br>
                    Selected: ${this.blockPalette[this.activeBlockType].name}
                `;
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

    // 11. Launch Sequence Handler
    function setupLaunchSequence() {
        const btnLaunch = document.getElementById('btn-launch-game');
        const overlay = document.getElementById('game-simulator-overlay');
        const progressScreen = document.getElementById('launch-progress-screen');
        const progressFill = document.getElementById('launch-progress-fill');
        const progressTitle = document.getElementById('progress-status-title');
        const terminal = document.getElementById('launch-terminal-console');

        if (!btnLaunch) return;

        btnLaunch.addEventListener('click', () => {
            if (window.shadowAudio) window.shadowAudio.playLaunch();
            triggerHaptic(60);

            // Notify native Android bridge if running as an APK
            if (window.ShadowNative && typeof window.ShadowNative.launchGame === 'function') {
                const configPayload = {
                    version: state.profile.version,
                    loader: state.profile.loader,
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

            const logs = [
                { t: '[13:37:01] [ShadowLauncher/INFO]: Initializing Shadow Engine v1.0.0...', p: 15 },
                { t: `[13:37:01] [ShadowOptimizer/INFO]: Allocating ${state.optimizer.ramMb}MB JVM heap. GC: ${state.optimizer.gcMode.toUpperCase()}`, p: 35 },
                { t: `[13:37:02] [ShadowGraphics/INFO]: Binding native renderer: ${state.profile.renderer}`, p: 55 },
                { t: `[13:37:02] [FabricLoader/INFO]: Loading active modpack (Sodium, Iris, Lithium, FerriteCore)...`, p: 75 },
                { t: `[13:37:03] [Minecraft/INFO]: Resolution scaled to ${state.optimizer.resScale}%. Display lock: ${state.optimizer.maxFps} FPS`, p: 90 },
                { t: `[13:37:03] [ShadowEngine/INFO]: Virtual ShadowTouch mapped successfully. Starting game world!`, p: 100 }
            ];

            let step = 0;
            function nextStep() {
                if (step < logs.length) {
                    const item = logs[step];
                    terminal.innerHTML += `<div>${item.t}</div>`;
                    terminal.scrollTop = terminal.scrollHeight;
                    progressFill.style.width = `${item.p}%`;
                    progressTitle.textContent = `Launching ${state.profile.name}... (${item.p}%)`;
                    step++;
                    setTimeout(nextStep, 280);
                } else {
                    setTimeout(() => {
                        progressScreen.style.display = 'none';
                        const canvas = document.getElementById('mc-game-canvas');
                        if (canvas) {
                            window.activeGameInstance = new MinecraftSimulationEngine(canvas);
                            window.activeGameInstance.start();
                        }
                    }, 400);
                }
            }
            nextStep();
        });

        // Pause Menu Handlers
        const btnMenu = document.getElementById('btn-open-game-menu');
        const pauseModal = document.getElementById('game-pause-modal');
        const btnResume = document.getElementById('btn-pause-resume');
        const btnExit = document.getElementById('btn-pause-exit');

        if (btnMenu) btnMenu.addEventListener('click', toggleGamePause);
        if (btnResume) btnResume.addEventListener('click', toggleGamePause);
        if (btnExit) {
            btnExit.addEventListener('click', () => {
                if (window.activeGameInstance) {
                    window.activeGameInstance.stop();
                    window.activeGameInstance = null;
                }
                overlay.classList.remove('active');
                pauseModal.classList.remove('active');
                state.gamePaused = false;
                if (window.shadowAudio) window.shadowAudio.playClick();
            });
        }
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

    // 12. Document Ready
    document.addEventListener('DOMContentLoaded', () => {
        initHardwareInfo();
        setupTabs();
        setupProfiles();
        setupOptimizerListeners();
        renderModsList();
        setupVirtualControls();
        renderSkinViewer();
        setupLaunchSequence();
    });

})();
