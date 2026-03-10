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

let width, height, wordMeteors = [], activeMeteors = false;

function initMeteors() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    wordMeteors = [];
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

function animateMeteors() {
    if (!activeMeteors) return;

    // Clear canvas instead of painting black, since WebGL is behind it
    ctx.clearRect(0, 0, width, height);

    drawWordMeteors();

    requestAnimationFrame(animateMeteors);
}

// ── Controls ──────────────────────────────────────────────────────────────────
document.getElementById('btn-start').addEventListener('click', function () {
    document.getElementById('start-screen').style.display = 'none';

    // 1. Start WebGL Solar System
    if (window.startSolarSystem) {
        window.startSolarSystem();
    }

    // 2. Start Overlay Meteors
    activeMeteors = true;
    initMeteors();
    animateMeteors();
});

// Phase 2 transition called from solarSystem.js raycaster interaction
window.startPhase2 = function () {
    activeMeteors = false; // stop 2D rendering loop
    document.getElementById('progress-bar').style.display = 'none';
    document.getElementById('cube-scene').style.display = 'flex';
    lastTime = performance.now();
    requestAnimationFrame(animateCube);
};

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

    // Add heartbeat to question title
    const proposalTitle = document.querySelector('.proposal-title');
    proposalTitle.classList.add('heartbeat-text');
}

function moveNo() {
    const b = document.getElementById('no-btn');
    b.style.transform = 'none';
    // Constraint inside container to prevent it going off screen
    b.style.left = (Math.random() * 60 + 20) + '%';
    b.style.top = (Math.random() * 60 + 20) + '%';
}

let cube = document.getElementById('cube'), isDrag = false, isDraggingAction = false, lX, lY, rX = -15, rY = -15;
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

const sDrag = (x, y) => { isDrag = true; isDraggingAction = false; lX = x; lY = y; };
const mDrag = (x, y) => {
    if (!isDrag) return;
    // Determine if mouse actually moved to distinct click intent vs drag
    if (Math.abs(x - lX) > 2 || Math.abs(y - lY) > 2) isDraggingAction = true;
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

// Image Modal Logic
const modal = document.getElementById('img-modal');
const modalImg = document.getElementById('modal-img');

document.querySelectorAll('.cube-face img').forEach(img => {
    // Use pointerup or click, but only if not dragging
    img.addEventListener('click', (e) => {
        if (isDraggingAction) return; // Prevent open if they were spinning cube
        modalImg.src = e.target.src;
        modal.style.display = 'flex';
        // setTimeout to allow display to apply before fading in
        setTimeout(() => modal.classList.add('active'), 10);
    });
});

function closeImage() {
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 300);
}

// init(); animate(); is bypassed because it waits for the initial user click on "Empezar Viaje"
