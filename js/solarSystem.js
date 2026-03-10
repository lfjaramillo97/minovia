// js/solarSystem.js
// Handles the 3D Solar System Phase 1

let ssScene, ssCamera, ssRenderer;
let sunMesh, planets = [];
let ssActive = false;
let starField;

// Elements
let webglContainer;
let sunHint;

// Raycasting for Sun Click
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();

function initSolarSystem() {
    try {
        webglContainer = document.getElementById('webgl-container');
        sunHint = document.getElementById('sun-hint');

        // 1. Scene setup
        ssScene = new THREE.Scene();
        ssScene.fog = new THREE.FogExp2(0x000000, 0.0015);

        // 2. Camera setup
        ssCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        // Start camera far away, moving towards Z = 0
        ssCamera.position.set(0, 30, 400);
        ssCamera.lookAt(0, 0, 0);

        // 3. Renderer setup
        ssRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        ssRenderer.setSize(window.innerWidth, window.innerHeight);
        ssRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        webglContainer.appendChild(ssRenderer.domElement);

        // 4. Lighting
        const ambientLight = new THREE.AmbientLight(0x222222);
        ssScene.add(ambientLight);

        const pointLight = new THREE.PointLight(0xffeedd, 2.5, 600);
        pointLight.position.set(0, 0, 0); // Light comes from the sun
        ssScene.add(pointLight);

        // 5. Build Deep Space Background (Starfield)
        createStarfield();

        // 6. Build Celestial Bodies
        createSolarSystem();

        // 7. Event Listeners
        window.addEventListener('resize', onSSResize);
        window.addEventListener('click', onSSClick);
        window.addEventListener('touchstart', onSSTouch, { passive: false });

        ssActive = true;
        requestAnimationFrame(animateSolarSystem);
    } catch (e) {
        document.body.innerHTML = "<div style='color:red; background:white; padding:20px; z-index:999999; position:absolute; width:100%; height:100%; top:0; left:0; font-family:sans-serif;'><h3>CRITICAL ERROR STARTING 3D:</h3><pre>" + e.message + "\n" + e.stack + "</pre></div>";
        console.error("ThreeJS Error: ", e);
    }
}

function createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsCount = 4000;
    const posArray = new Float32Array(starsCount * 3);
    const colorsArray = new Float32Array(starsCount * 3);

    const color1 = new THREE.Color(0xffffff);
    const color2 = new THREE.Color(0xaaaaee);

    for (let i = 0; i < starsCount * 3; i += 3) {
        // Spread stars far out
        posArray[i] = (Math.random() - 0.5) * 1500;
        posArray[i + 1] = (Math.random() - 0.5) * 1500;
        posArray[i + 2] = (Math.random() - 0.5) * 1500 - 200; // Push back

        // Mix colors
        const mixedColor = color1.clone().lerp(color2, Math.random());
        colorsArray[i] = mixedColor.r;
        colorsArray[i + 1] = mixedColor.g;
        colorsArray[i + 2] = mixedColor.b;
    }

    starsGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    starsGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

    const starsMaterial = new THREE.PointsMaterial({
        size: 1.5,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    starField = new THREE.Points(starsGeometry, starsMaterial);
    ssScene.add(starField);
}

function createSolarSystem() {
    // --- SUN ---
    const sunGeo = new THREE.SphereGeometry(25, 64, 64);
    // Emissive yellow/orange material for the sun
    const sunMat = new THREE.MeshBasicMaterial({
        color: 0xffdd88,
    });
    sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.name = "TheSun";
    ssScene.add(sunMesh);

    // Sun Glow effect using a slightly larger transparent sphere
    const glowGeo = new THREE.SphereGeometry(32, 64, 64);
    const glowMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    const sunGlow = new THREE.Mesh(glowGeo, glowMat);
    ssScene.add(sunGlow);

    const auraGeo = new THREE.SphereGeometry(45, 64, 64);
    const auraMat = new THREE.MeshBasicMaterial({
        color: 0xff5500,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
    const sunAura = new THREE.Mesh(auraGeo, auraMat);
    ssScene.add(sunAura);


    // --- PLANETS ---
    // [radius, distance, speed, color, hasRings]
    const planetData = [
        { name: 'Mercury', r: 1.2, d: 42, s: 0.04, c: 0xaaaaaa },
        { name: 'Venus', r: 2.5, d: 58, s: 0.015, c: 0xeebb99 },
        { name: 'Earth', r: 2.8, d: 78, s: 0.01, c: 0x4488ff },
        { name: 'Mars', r: 1.5, d: 98, s: 0.008, c: 0xff5533 },
        { name: 'Jupiter', r: 8.0, d: 140, s: 0.004, c: 0xddaa88 },
        { name: 'Saturn', r: 6.5, d: 190, s: 0.002, c: 0xf4d0a1, rings: true }
    ];

    planetData.forEach((pd, index) => {
        // Group for combining orbit rotation with local planet rotation
        const orbitGroup = new THREE.Group();
        // Give each planet a random starting angle
        orbitGroup.rotation.y = Math.random() * Math.PI * 2;

        // Solid physical material so it reacts to the pointLight from the sun
        const pGeo = new THREE.SphereGeometry(pd.r, 32, 32);
        const pMat = new THREE.MeshStandardMaterial({
            color: pd.c,
            roughness: 0.7,
            metalness: 0.1
        });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        pMesh.position.x = pd.d; // distance from Sun

        // Store speed for animation
        pMesh.userData = { orbitSpeed: pd.s, rotSpeed: Math.random() * 0.02 + 0.01 };

        if (pd.rings) {
            const rGeo = new THREE.RingGeometry(pd.r * 1.4, pd.r * 2.2, 64);
            const rMat = new THREE.MeshStandardMaterial({
                color: 0xccaabb,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
                roughness: 0.5
            });
            const rings = new THREE.Mesh(rGeo, rMat);
            rings.rotation.x = Math.PI / 2 - 0.2; // Tilt
            pMesh.add(rings);
        }

        orbitGroup.add(pMesh);
        ssScene.add(orbitGroup);
        planets.push(orbitGroup);
    });
}

function onSSResize() {
    if (!ssCamera || !ssRenderer) return;
    ssCamera.aspect = window.innerWidth / window.innerHeight;
    ssCamera.updateProjectionMatrix();
    ssRenderer.setSize(window.innerWidth, window.innerHeight);
}

function checkSunInteraction(clientX, clientY) {
    if (!ssActive) return;

    // Normalize mouse coordinates (-1 to +1)
    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, ssCamera);

    // Check if sun was intersected
    const intersects = raycaster.intersectObject(sunMesh);
    if (intersects.length > 0) {
        triggerCinematicTransition();
    }
}

function onSSClick(e) {
    checkSunInteraction(e.clientX, e.clientY);
}

function onSSTouch(e) {
    if (e.touches.length > 0) {
        checkSunInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }
}

function animateSolarSystem() {
    if (!ssActive) return;
    requestAnimationFrame(animateSolarSystem);

    // 1. Slowly advance the camera towards the sun to create the "travel" feeling
    if (ssCamera.position.z > 120) {
        // Move forward, exponentially slowing down as it reaches the target depth
        ssCamera.position.z -= (ssCamera.position.z - 110) * 0.002;
    } else {
        // Once nicely positioned near the sun, show the hint text
        if (sunHint.style.display === 'none') {
            sunHint.style.display = 'block';
        }
    }

    // 2. Rotate starfield slowly for cosmic drift
    starField.rotation.y -= 0.0003;
    starField.rotation.x -= 0.0001;

    // 3. Animate planets (Orbit and local rotation)
    planets.forEach(orbitGroup => {
        const mesh = orbitGroup.children[0];
        // Orbit
        orbitGroup.rotation.y += mesh.userData.orbitSpeed;
        // Local rotation
        mesh.rotation.y += mesh.userData.rotSpeed;
    });

    ssRenderer.render(ssScene, ssCamera);
}

// Controls the bright flash overlay to switch into Phase 2
function triggerCinematicTransition() {
    try {
        ssActive = false; // Stop rendering
        const flash = document.getElementById('flash-overlay');
        let flashOpacity = 0;

        // Step 1: Fade IN white flash manually
        function fadeOutScene() {
            try {
                flashOpacity += 0.05;
                flash.style.opacity = flashOpacity;
                if (flashOpacity < 1) {
                    requestAnimationFrame(fadeOutScene);
                } else {
                    // Step 2: Swap the DOM elements while totally white
                    webglContainer.style.display = 'none';
                    sunHint.style.display = 'none';
                    document.getElementById('canvas').style.display = 'none';

                    try {
                        if (typeof window.startPhase2 === 'function') {
                            window.startPhase2();
                        } else {
                            alert("startPhase2 not found!");
                        }
                    } catch (e) {
                        alert("Error inside startPhase2: " + e.message);
                    }

                    // Step 3: Fade OUT white flash manually (Wait a tiny bit for render buffer)
                    setTimeout(() => {
                        requestAnimationFrame(fadeInCube);
                    }, 100);
                }
            } catch (e) { alert("Error in fadeOutScene: " + e.message); }
        }

        function fadeInCube() {
            try {
                flashOpacity -= 0.05;
                flash.style.opacity = flashOpacity;
                if (flashOpacity > 0) {
                    requestAnimationFrame(fadeInCube);
                } else {
                    flash.style.display = 'none'; // Completely remove from flow
                }
            } catch (e) { alert("Error in fadeInCube: " + e.message); }
        }

        // Start sequence
        requestAnimationFrame(fadeOutScene);
    } catch (e) {
        alert("Top level trigger error: " + e.message);
    }
}

// Expose starter globally
window.startSolarSystem = initSolarSystem;
