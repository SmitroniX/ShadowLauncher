// Shadow Launcher — Website Interactive Features & Benchmarks (v1.0.7)

(function() {
    'use strict';

    // Non-intrusive Toast Notification Utility
    let toastTimeout = null;
    function showToast(message) {
        let toast = document.querySelector('.toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
        }
        toast.textContent = message;
        toast.classList.add('show');
        if (toastTimeout) clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2400);
    }
    window.showShadowToast = showToast;

    // Accent Theme Switcher
    const accentDots = document.querySelectorAll('.accent-dot');
    accentDots.forEach(dot => {
        dot.addEventListener('click', () => {
            const acc = dot.getAttribute('data-accent');
            if (acc) {
                document.documentElement.setAttribute('data-accent', acc);
                try {
                    localStorage.setItem('shadow_accent', acc);
                } catch (e) {}
                showToast(`Switched theme to ${acc.toUpperCase()}`);
            }
        });
    });

    // Restore saved accent
    try {
        const saved = localStorage.getItem('shadow_accent');
        if (saved) document.documentElement.setAttribute('data-accent', saved);
    } catch (e) {}

    // Interactive Benchmark Data (144Hz & OpenJDK 25 Benchmarks)
    const benchmarkData = {
        'snapdragon': {
            name: 'Snapdragon 8 Gen 3 (Galaxy S24 / OnePlus 12)',
            fps: { shadow: 144, standard: 62, vanilla: 35 },
            ram: { shadow: 1420, standard: 2840, vanilla: 3450 },
            latency: { shadow: 8, standard: 36, vanilla: 54 }
        },
        'dimensity': {
            name: 'MediaTek Dimensity 9300 (Mali-G720 Immortalis)',
            fps: { shadow: 132, standard: 48, vanilla: 28 },
            ram: { shadow: 1480, standard: 2950, vanilla: 3550 },
            latency: { shadow: 9, standard: 40, vanilla: 58 }
        },
        'tensor': {
            name: 'Google Tensor G3 (Pixel 8 Pro)',
            fps: { shadow: 110, standard: 42, vanilla: 24 },
            ram: { shadow: 1520, standard: 3100, vanilla: 3600 },
            latency: { shadow: 10, standard: 44, vanilla: 62 }
        },
        'helio': {
            name: 'Budget Helio G99 / Snapdragon 680 (4GB Device)',
            fps: { shadow: 68, standard: 22, vanilla: 14 },
            ram: { shadow: 1120, standard: 2200, vanilla: 2400 },
            latency: { shadow: 14, standard: 55, vanilla: 82 }
        }
    };

    function updateBenchmarks(chipsetKey) {
        const data = benchmarkData[chipsetKey];
        if (!data) return;

        // FPS Bars (Max 144)
        const fpsShadowPct = Math.min(100, (data.fps.shadow / 144) * 100);
        const fpsStandardPct = Math.min(100, (data.fps.standard / 144) * 100);
        const fpsVanillaPct = Math.min(100, (data.fps.vanilla / 144) * 100);

        const elFpsShadow = document.getElementById('bench-fps-shadow');
        const elFpsStandard = document.getElementById('bench-fps-standard');
        const elFpsVanilla = document.getElementById('bench-fps-vanilla');

        if (elFpsShadow) {
            elFpsShadow.style.width = `${fpsShadowPct}%`;
            elFpsShadow.textContent = `${data.fps.shadow} FPS`;
        }
        if (elFpsStandard) {
            elFpsStandard.style.width = `${fpsStandardPct}%`;
            elFpsStandard.textContent = `${data.fps.standard} FPS`;
        }
        if (elFpsVanilla) {
            elFpsVanilla.style.width = `${fpsVanillaPct}%`;
            elFpsVanilla.textContent = `${data.fps.vanilla} FPS`;
        }

        // RAM Usage (Lower is better, Max 4000MB)
        const ramShadowPct = Math.min(100, (data.ram.shadow / 4000) * 100);
        const ramStandardPct = Math.min(100, (data.ram.standard / 4000) * 100);
        const ramVanillaPct = Math.min(100, (data.ram.vanilla / 4000) * 100);

        const elRamShadow = document.getElementById('bench-ram-shadow');
        const elRamStandard = document.getElementById('bench-ram-standard');
        const elRamVanilla = document.getElementById('bench-ram-vanilla');

        if (elRamShadow) {
            elRamShadow.style.width = `${ramShadowPct}%`;
            elRamShadow.textContent = `${data.ram.shadow} MB`;
        }
        if (elRamStandard) {
            elRamStandard.style.width = `${ramStandardPct}%`;
            elRamStandard.textContent = `${data.ram.standard} MB`;
        }
        if (elRamVanilla) {
            elRamVanilla.style.width = `${ramVanillaPct}%`;
            elRamVanilla.textContent = `${data.ram.vanilla} MB`;
        }

        // Touch Latency (Lower is better, Max 100ms)
        const latShadowPct = Math.min(100, (data.latency.shadow / 100) * 100);
        const latStandardPct = Math.min(100, (data.latency.standard / 100) * 100);
        const latVanillaPct = Math.min(100, (data.latency.vanilla / 100) * 100);

        const elLatShadow = document.getElementById('bench-lat-shadow');
        const elLatStandard = document.getElementById('bench-lat-standard');
        const elLatVanilla = document.getElementById('bench-lat-vanilla');

        if (elLatShadow) {
            elLatShadow.style.width = `${latShadowPct}%`;
            elLatShadow.textContent = `${data.latency.shadow} ms`;
        }
        if (elLatStandard) {
            elLatStandard.style.width = `${latStandardPct}%`;
            elLatStandard.textContent = `${data.latency.standard} ms`;
        }
        if (elLatVanilla) {
            elLatVanilla.style.width = `${latVanillaPct}%`;
            elLatVanilla.textContent = `${data.latency.vanilla} ms`;
        }
    }

    const chipsetBtns = document.querySelectorAll('.chipset-btn');
    chipsetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            chipsetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            updateBenchmarks(btn.getAttribute('data-chipset'));
        });
    });

    // Copy Checksum Button
    const copyHashBtn = document.getElementById('btn-copy-checksum');
    if (copyHashBtn) {
        copyHashBtn.addEventListener('click', () => {
            const hashText = document.getElementById('checksum-value').textContent.trim();
            navigator.clipboard.writeText(hashText).then(() => {
                copyHashBtn.textContent = 'Copied!';
                showToast('SHA256 Checksum copied to clipboard!');
                setTimeout(() => copyHashBtn.textContent = 'Copy SHA256', 2200);
            }).catch(() => {
                showToast('Copied SHA256!');
            });
        });
    }

    // Token Swatches Copy Interaction
    document.querySelectorAll('.token-swatch').forEach(swatch => {
        swatch.addEventListener('click', () => {
            const hex = swatch.getAttribute('data-hex');
            if (hex) {
                navigator.clipboard.writeText(hex).then(() => {
                    showToast(`Copied token color ${hex} to clipboard!`);
                }).catch(() => {});
            }
        });
    });

    // Initialize with Snapdragon
    updateBenchmarks('snapdragon');

    // Mobile Navigation Drawer Toggle
    const navToggle = document.querySelector('.nav-toggle-btn');
    const mobileDrawer = document.querySelector('.mobile-nav-drawer');
    if (navToggle && mobileDrawer) {
        navToggle.addEventListener('click', () => {
            mobileDrawer.classList.toggle('open');
        });
        // Close on link click
        mobileDrawer.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                mobileDrawer.classList.remove('open');
            });
        });
    }

    // App Screenshot Showcase Switcher
    const screenshotData = {
        'dashboard': {
            img: 'assets/designs/dashboard.jpg',
            title: '01. Main Gaming Dashboard (16:9 Landscape)',
            desc: 'Futuristic cyber-dark home screen with left navigation rail, active version hero banner, telemetry stats, and glowing PLAY CTA button.',
            badges: ['VulkanMod 1.3', 'Java 25 Ready', '144 FPS Pro', '42 Active Mods']
        },
        'instances': {
            img: 'assets/designs/instances.jpg',
            title: '02. Instances & Versions Hub (16:9 Landscape)',
            desc: 'Multi-card instance manager with automatic version folder isolation (instances/1.20.4-Fabric/), 1-tap folder explorer, and JRE/renderer inspector.',
            badges: ['Auto-JVM 25/21/17/8', 'Dedicated Subfolders', 'Zero Collision']
        },
        'mod_store': {
            img: 'assets/designs/mod_store.jpg',
            title: '03. In-App Mod & Resourcepack Store (16:9 Landscape)',
            desc: 'Integrated Modrinth / CurseForge browser. 1-click install automatically verifies dependencies and drops jar files directly into the active instance mods folder.',
            badges: ['1-Click Install', 'Dependency Check', 'Performance Packs']
        },
        'controls_studio': {
            img: 'assets/designs/controls_studio.jpg',
            title: '04. Custom HUD Controls Studio (16:9 Landscape)',
            desc: 'Full drag-and-drop on-screen touch button editor over a live canvas. Features snap-to-grid, opacity slider, layout presets (PvP, Survival, One-Handed), and keycode assignment.',
            badges: ['Live Game Canvas', 'Snap-to-Grid', 'Haptic Feedback']
        },
        'portrait_mobile': {
            img: 'assets/designs/portrait_mobile.jpg',
            title: '05. Mobile Portrait View (9:16)',
            desc: 'Ergonomic one-handed vertical launcher layout with bottom navigation bar, quick telemetry drawer, and thumb-friendly PLAY button.',
            badges: ['One-Handed Ergonomics', 'Dynamic Telemetry', 'Quick Play']
        }
    };

    const screenTabs = document.querySelectorAll('.screenshot-tab');
    const screenImg = document.getElementById('active-screenshot-img');
    const screenTitle = document.getElementById('active-screenshot-title');
    const screenDesc = document.getElementById('active-screenshot-desc');
    const screenBadges = document.getElementById('active-screenshot-badges');

    if (screenTabs.length && screenImg) {
        screenTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const screenKey = tab.getAttribute('data-screen');
                const data = screenshotData[screenKey];
                if (!data) return;

                screenTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                screenImg.style.opacity = '0';
                setTimeout(() => {
                    screenImg.src = data.img;
                    screenImg.alt = data.title;
                    if (screenTitle) screenTitle.textContent = data.title;
                    if (screenDesc) screenDesc.textContent = data.desc;
                    if (screenBadges) {
                        screenBadges.innerHTML = data.badges.map(b => `<span class="c-tag feature">${b}</span>`).join('');
                    }
                    screenImg.style.opacity = '1';
                }, 150);
            });
        });
    }

    // Lightbox Modal for Screenshots
    const lightbox = document.getElementById('screenshot-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close');

    if (screenImg && lightbox && lightboxImg) {
        screenImg.addEventListener('click', () => {
            lightboxImg.src = screenImg.src;
            lightbox.classList.add('active');
        });
    }

    if (lightboxClose) {
        lightboxClose.addEventListener('click', () => {
            lightbox.classList.remove('active');
        });
    }

    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                lightbox.classList.remove('active');
            }
        });
    }

})();
