const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const words = [
    "1500 besitos",
    "Mi bebé",
    "Mi linda",
    "Mi amor",
    "Me fascinas",
    "Mi vida",
    "Mi hermosa",
    "Me encantas",
    "Mi persona favorita",
    "Me gustas infinito",
    "Mamacita",
    "Rikita",
    "Deliciosa",
    "Me fascinas muchote",
    "Quiero unos mimitos"
];

const wordColors = [
    '#ff6eb4', '#ff9de2', '#ffb347', '#ffd700',
    '#ff8c69', '#ffa07a', '#ffcc44', '#ff7f50',
    '#e8a838', '#f4c842', '#ff6a00', '#ffb700'
];

let width, height, stars = [], wordMeteors = [], active = false, progress = 0;

function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    stars = []; wordMeteors = [];
    for (let i = 0; i < 350; i++) {
        stars.push({ x: Math.random() * width - width / 2, y: Math.random() * height - height / 2, z: Math.random() * width });
    }
    for (let i = 0; i < 90; i++) wordMeteors.push(createWordMeteor(true));
}

function createWordMeteor(randomZ) {
    return {
        text: words[Math.floor(Math.random() * words.length)],
        color: wordColors[Math.floor(Math.random() * wordColors.length)],
        x: (Math.random() - 0.5) * width * 1.3,
        y: (Math.random() - 0.5) * height * 1.3,
        z: randomZ ? Math.random() * width : width,
        fontSize: Math.random() * 10 + 12,
        speed: Math.random() * 1.5 + 2, // SLOWER SPEEDS
    };
}

function drawWordMeteors() {
    ctx.save();
    wordMeteors.forEach((m, i) => {
        m.z -= (m.speed + 1.5); // REDUCED the Z step offset to make words travel gracefully
        if (m.z <= 0) { wordMeteors[i] = createWordMeteor(false); return; }
        const scale = width / m.z;
        const sx = m.x * scale + width / 2, sy = m.y * scale + height / 2;
        if (sx < -250 || sx > width + 250 || sy < -60 || sy > height + 60) return;
        const fs = m.fontSize * scale;
        if (fs < 5) return;
        const alpha = Math.min(1, (1 - m.z / width) * 2.2);
        // trail
        const ps = width / (m.z + m.speed * 5);
        ctx.globalAlpha = alpha * 0.2;
        ctx.font = `bold ${m.fontSize * ps}px 'Dancing Script',cursive`;
        ctx.fillStyle = m.color;
        ctx.textAlign = 'left';
        ctx.fillText(m.text, m.x * ps + width / 2, m.y * ps + height / 2);
        // main
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${fs}px 'Dancing Script',cursive`;
        ctx.shadowColor = m.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = m.color;
        ctx.fillText(m.text, sx, sy);
        ctx.shadowBlur = 0;
    });
    ctx.globalAlpha = 1;
    ctx.restore();
}

function animate() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    stars.forEach(s => {
        s.z -= active ? 8 : 0.4; // REDUCED BACKGROUND STAR SPEED TOO
        if (s.z <= 0) s.z = width;
        const x = (s.x / s.z) * width + width / 2, y = (s.y / s.z) * height + height / 2;
        ctx.fillStyle = `rgba(255,255,255,${1 - s.z / width})`;
        ctx.beginPath(); ctx.arc(x, y, (1 - s.z / width) * 2.5, 0, Math.PI * 2); ctx.fill();
    });

    if (active) {
        drawWordMeteors();
        if (progress < 100) {
            progress += 0.5;
            document.getElementById('progress-bar').style.width = progress * 0.6 + '%';
            const pC = document.getElementById('planet-container');
            pC.style.display = 'block';
            pC.style.transform = `translate(-50%,-50%) scale(${progress / 42})`;
            drawBlackHole();
        }
    }
    requestAnimationFrame(animate);
}

// ═══════════════════════════════════════════════════════════════
//   G A R G A N T U A   —   Interstellar-style black hole
// ═══════════════════════════════════════════════════════════════
let bhAngle = 0;
const BHC = document.getElementById('blackhole-canvas');
const bctx = BHC.getContext('2d');
const W = 320, H = 320, CX = W / 2, CY = H / 2;

function drawBlackHole() {
    bctx.clearRect(0, 0, W, H);
    bhAngle += 0.007;          // very slow rotation — exactly like the film

    // ── 1. Warm nebula background glow ──────────────────────────────────
    const nebula = bctx.createRadialGradient(CX, CY, 62, CX, CY, 158);
    nebula.addColorStop(0, 'rgba(0,0,0,0)');
    nebula.addColorStop(0.28, 'rgba(75,25,0,0.5)');
    nebula.addColorStop(0.6, 'rgba(120,45,0,0.22)');
    nebula.addColorStop(1, 'rgba(0,0,0,0)');
    bctx.beginPath(); bctx.arc(CX, CY, 158, 0, Math.PI * 2);
    bctx.fillStyle = nebula; bctx.fill();

    // ── 2. Accretion disk (in local rotating frame) ──────────────────────
    bctx.save();
    bctx.translate(CX, CY);
    bctx.rotate(bhAngle);

    function diskEllipse(rx, ry, lw, stops, ga) {
        const g = bctx.createLinearGradient(-rx, 0, rx, 0);
        stops.forEach(([p, c]) => g.addColorStop(p, c));
        bctx.save();
        bctx.globalAlpha = ga;
        bctx.beginPath(); bctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
        bctx.strokeStyle = g; bctx.lineWidth = lw; bctx.stroke();
        bctx.restore();
    }

    // outermost dust
    diskEllipse(132, 18, 11, [
        [0, 'rgba(0,0,0,0)'], [0.2, 'rgba(130,42,0,0.3)'], [0.5, 'rgba(200,85,10,0.48)'],
        [0.8, 'rgba(130,42,0,0.3)'], [1, 'rgba(0,0,0,0)']
    ], 0.55);

    // main bright disk — orange-gold
    diskEllipse(114, 13, 22, [
        [0, 'rgba(0,0,0,0)'], [0.10, 'rgba(175,58,0,0.55)'], [0.35, 'rgba(255,135,18,0.95)'],
        [0.50, 'rgba(255,215,105,1.0)'], [0.65, 'rgba(255,135,18,0.95)'],
        [0.90, 'rgba(175,58,0,0.55)'], [1, 'rgba(0,0,0,0)']
    ], 1.0);

    // bright inner photon ring
    diskEllipse(80, 8, 9, [
        [0, 'rgba(0,0,0,0)'], [0.28, 'rgba(255,148,28,0.8)'], [0.50, 'rgba(255,238,148,1.0)'],
        [0.72, 'rgba(255,148,28,0.8)'], [1, 'rgba(0,0,0,0)']
    ], 1.0);

    // ultra-thin innermost ring
    diskEllipse(63, 5, 3, [
        [0, 'rgba(0,0,0,0)'], [0.40, 'rgba(255,205,80,0.7)'], [0.50, 'rgba(255,245,185,1.0)'],
        [0.60, 'rgba(255,205,80,0.7)'], [1, 'rgba(0,0,0,0)']
    ], 0.9);

    bctx.restore();   // end disk rotation

    // ── 3. Gravitational lensing arcs (always upright) ───────────────────
    bctx.save();
    bctx.translate(CX, CY);

    // Primary upper arc — the Gargantua signature
    const ag1 = bctx.createLinearGradient(-102, 0, 102, 0);
    [[0, 'rgba(0,0,0,0)'], [0.12, 'rgba(155,52,0,0.58)'], [0.38, 'rgba(255,158,38,0.97)'],
    [0.50, 'rgba(255,225,118,1.0)'], [0.62, 'rgba(255,158,38,0.97)'],
    [0.88, 'rgba(155,52,0,0.58)'], [1, 'rgba(0,0,0,0)']
    ].forEach(([p, c]) => ag1.addColorStop(p, c));
    bctx.globalAlpha = 0.94;
    bctx.beginPath(); bctx.ellipse(0, -3, 98, 55, 0, Math.PI, Math.PI * 2);
    bctx.strokeStyle = ag1; bctx.lineWidth = 10; bctx.stroke();

    // bright highlight streak on top of arc
    const ag2 = bctx.createLinearGradient(-82, 0, 82, 0);
    [[0, 'rgba(0,0,0,0)'], [0.28, 'rgba(255,205,82,0.45)'], [0.50, 'rgba(255,248,205,0.82)'],
    [0.72, 'rgba(255,205,82,0.45)'], [1, 'rgba(0,0,0,0)']
    ].forEach(([p, c]) => ag2.addColorStop(p, c));
    bctx.globalAlpha = 0.78;
    bctx.beginPath(); bctx.ellipse(0, -3, 96, 54, 0, Math.PI * 1.07, Math.PI * 1.93);
    bctx.strokeStyle = ag2; bctx.lineWidth = 4; bctx.stroke();

    // outer ghost arc (secondary lensing ring)
    bctx.globalAlpha = 0.28;
    bctx.beginPath(); bctx.ellipse(0, -7, 121, 65, 0, Math.PI * 1.04, Math.PI * 1.96);
    bctx.strokeStyle = 'rgba(255,140,38,0.75)'; bctx.lineWidth = 4; bctx.stroke();

    // faint relativistic reflection below event horizon
    bctx.globalAlpha = 0.15;
    bctx.beginPath(); bctx.ellipse(0, 4, 90, 12, 0, 0, Math.PI);
    bctx.strokeStyle = 'rgba(255,175,58,0.8)'; bctx.lineWidth = 3; bctx.stroke();

    bctx.globalAlpha = 1;
    bctx.restore();

    // ── 4. Photon sphere glow ────────────────────────────────────────────
    const ps = bctx.createRadialGradient(CX, CY, 56, CX, CY, 74);
    ps.addColorStop(0, 'rgba(255,130,20,0.0)');
    ps.addColorStop(0.35, 'rgba(255,168,55,0.58)');
    ps.addColorStop(0.65, 'rgba(255,110,15,0.28)');
    ps.addColorStop(1, 'rgba(0,0,0,0)');
    bctx.beginPath(); bctx.arc(CX, CY, 74, 0, Math.PI * 2);
    bctx.fillStyle = ps; bctx.fill();

    // ── 5. Event horizon ────────────────────────────────────────────────
    // warm rim glow
    bctx.beginPath(); bctx.arc(CX, CY, 60, 0, Math.PI * 2);
    bctx.strokeStyle = 'rgba(255,148,35,0.72)'; bctx.lineWidth = 3.5;
    bctx.shadowBlur = 16; bctx.shadowColor = '#ff8800'; bctx.stroke();
    bctx.shadowBlur = 0;
    // absolute black
    bctx.beginPath(); bctx.arc(CX, CY, 59, 0, Math.PI * 2);
    bctx.fillStyle = '#000'; bctx.fill();

    // ── 6. Orbiting spark particles ─────────────────────────────────────
    bctx.save();
    bctx.translate(CX, CY);
    const N = 24;
    for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 + bhAngle * 4.5;
        const rx = 108 + Math.sin(i * 1.8) * 16;
        const ry = 11 + Math.cos(i * 1.1) * 3;
        const sz = 0.7 + Math.abs(Math.sin(i * 0.9 + bhAngle * 2)) * 1.5;
        bctx.globalAlpha = 0.42 + Math.abs(Math.sin(i + bhAngle * 3)) * 0.58;
        bctx.beginPath();
        bctx.arc(Math.cos(a) * rx, Math.sin(a) * ry, sz, 0, Math.PI * 2);
        bctx.fillStyle = `hsl(${26 + i * 4},100%,${56 + i * 1.3}%)`;
        bctx.fill();
    }
    bctx.globalAlpha = 1;
    bctx.restore();
}

// ── Controls ──────────────────────────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', function () {
    active = true;
    document.getElementById('start-screen').style.display = 'none';
    init();
});

document.getElementById('planet-container').addEventListener('click', function () {
    if (progress >= 85) {
        this.style.display = 'none';
        document.getElementById('progress-bar').style.display = 'none';
        document.getElementById('cube-scene').style.display = 'flex';
        active = false;
        lastTime = performance.now();
        requestAnimationFrame(animateCube);
    }
});

function showProposal() {
    document.getElementById('cube-scene').style.display = 'none';
    document.getElementById('proposal-screen').style.display = 'block';
}

function moveNo() {
    const b = document.getElementById('no-btn');
    b.style.transform = 'none';
    b.style.left = (Math.random() * 80 + 10) + '%';
    b.style.top = (Math.random() * 80 + 10) + '%';
}

let cube = document.getElementById('cube'), isDrag = false, lX, lY, rX = -15, rY = -15;
let lastTime = 0;

// --- Smooth JS Auto-rotation Function ---
function animateCube(time) {
    if (document.getElementById('cube-scene').style.display === 'flex') {
        const dt = time - lastTime;
        lastTime = time;
        if (!isDrag) {
            // Auto rotation logic, only if user isn't holding the cube
            rY += (dt * 0.05); // Adjust for rotation speeds
            rX += (dt * 0.02);
        }

        // Apply rotation to cube frame
        cube.style.transform = `rotateX(${rX}deg) rotateY(${rY}deg)`;
        requestAnimationFrame(animateCube);
    }
}

const sDrag = (x, y) => { isDrag = true; lX = x; lY = y; };
const mDrag = (x, y) => {
    if (!isDrag) return;
    rY += (x - lX) * 0.6; rX -= (y - lY) * 0.6;
    // The cube style transform is handled by the animation loop now
    lX = x; lY = y;
};
window.addEventListener('mousedown', e => sDrag(e.clientX, e.clientY));
window.addEventListener('touchstart', e => sDrag(e.touches[0].clientX, e.touches[0].clientY));
window.addEventListener('mousemove', e => mDrag(e.clientX, e.clientY));
window.addEventListener('touchmove', e => mDrag(e.touches[0].clientX, e.touches[0].clientY));
window.addEventListener('mouseup', () => isDrag = false);
window.addEventListener('touchend', () => isDrag = false);

init(); animate();
