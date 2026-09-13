// Shadow Launcher — Website Interactive Features & Benchmarks

(function() {
    'use strict';

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
            }
        });
    });

    // Restore saved accent
    try {
        const saved = localStorage.getItem('shadow_accent');
        if (saved) document.documentElement.setAttribute('data-accent', saved);
    } catch (e) {}

    // Interactive Benchmark Data
    const benchmarkData = {
        'snapdragon': {
            name: 'Snapdragon 8 Gen 3 (Galaxy S24 / OnePlus 12)',
            fps: { shadow: 138, standard: 62, vanilla: 35 },
            ram: { shadow: 1420, standard: 2840, vanilla: 3450 },
            latency: { shadow: 8, standard: 36, vanilla: 54 }
        },
        'dimensity': {
            name: 'MediaTek Dimensity 9300 (Mali-G720 Immortalis)',
            fps: { shadow: 124, standard: 48, vanilla: 28 },
            ram: { shadow: 1480, standard: 2950, vanilla: 3550 },
            latency: { shadow: 9, standard: 40, vanilla: 58 }
        },
        'tensor': {
            name: 'Google Tensor G3 (Pixel 8 Pro)',
            fps: { shadow: 98, standard: 42, vanilla: 24 },
            ram: { shadow: 1520, standard: 3100, vanilla: 3600 },
            latency: { shadow: 10, standard: 44, vanilla: 62 }
        },
        'helio': {
            name: 'Budget Helio G99 / Snapdragon 680 (4GB Device)',
            fps: { shadow: 64, standard: 22, vanilla: 14 },
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

        document.getElementById('bench-fps-shadow').style.width = `${fpsShadowPct}%`;
        document.getElementById('bench-fps-shadow').textContent = `${data.fps.shadow} FPS`;

        document.getElementById('bench-fps-standard').style.width = `${fpsStandardPct}%`;
        document.getElementById('bench-fps-standard').textContent = `${data.fps.standard} FPS`;

        document.getElementById('bench-fps-vanilla').style.width = `${fpsVanillaPct}%`;
        document.getElementById('bench-fps-vanilla').textContent = `${data.fps.vanilla} FPS`;

        // RAM Usage (Lower is better, Max 4000MB)
        const ramShadowPct = Math.min(100, (data.ram.shadow / 4000) * 100);
        const ramStandardPct = Math.min(100, (data.ram.standard / 4000) * 100);
        const ramVanillaPct = Math.min(100, (data.ram.vanilla / 4000) * 100);

        document.getElementById('bench-ram-shadow').style.width = `${ramShadowPct}%`;
        document.getElementById('bench-ram-shadow').textContent = `${data.ram.shadow} MB`;

        document.getElementById('bench-ram-standard').style.width = `${ramStandardPct}%`;
        document.getElementById('bench-ram-standard').textContent = `${data.ram.standard} MB`;

        document.getElementById('bench-ram-vanilla').style.width = `${ramVanillaPct}%`;
        document.getElementById('bench-ram-vanilla').textContent = `${data.ram.vanilla} MB`;

        // Touch Latency (Lower is better, Max 100ms)
        const latShadowPct = Math.min(100, (data.latency.shadow / 100) * 100);
        const latStandardPct = Math.min(100, (data.latency.standard / 100) * 100);
        const latVanillaPct = Math.min(100, (data.latency.vanilla / 100) * 100);

        document.getElementById('bench-lat-shadow').style.width = `${latShadowPct}%`;
        document.getElementById('bench-lat-shadow').textContent = `${data.latency.shadow} ms`;

        document.getElementById('bench-lat-standard').style.width = `${latStandardPct}%`;
        document.getElementById('bench-lat-standard').textContent = `${data.latency.standard} ms`;

        document.getElementById('bench-lat-vanilla').style.width = `${latVanillaPct}%`;
        document.getElementById('bench-lat-vanilla').textContent = `${data.latency.vanilla} ms`;
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
                setTimeout(() => copyHashBtn.textContent = 'Copy SHA256', 2000);
            });
        });
    }

    // Initialize with Snapdragon
    updateBenchmarks('snapdragon');

})();
