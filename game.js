import {
    createForestTrees,
    updateForestTrees
} from "./trees.js";

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

// =====================================================
// WILDERNESS - MAIN GAME
// =====================================================

const container = document.getElementById("game");
const inventoryUI = document.getElementById("inventory");
const messageUI = document.getElementById("message");
const toolUI = document.getElementById("tool");

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x9b7666, 0.0038);

const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 700
);

camera.position.set(0, 1.7, 12);
camera.rotation.order = "YXZ";

const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance"
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

container.appendChild(renderer.domElement);

// =====================================================
// SKY
// =====================================================

const skyGeometry = new THREE.SphereGeometry(450, 32, 24);

const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
        topColor: { value: new THREE.Color(0x253e58) },
        middleColor: { value: new THREE.Color(0xd18b70) },
        bottomColor: { value: new THREE.Color(0xe5a77c) }
    },
    vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 middleColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;

        void main() {
            float h = normalize(vWorldPosition).y;
            vec3 color;

            if (h > 0.0) {
                color = mix(middleColor, topColor, smoothstep(0.0, 0.8, h));
            } else {
                color = mix(bottomColor, middleColor, smoothstep(-0.5, 0.0, h));
            }

            gl_FragColor = vec4(color, 1.0);
        }
    `
});

scene.add(new THREE.Mesh(skyGeometry, skyMaterial));

// =====================================================
// SUN
// =====================================================

const sun = new THREE.Mesh(
    new THREE.SphereGeometry(9, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0xffc18b })
);

sun.position.set(-90, 45, -160);
scene.add(sun);

const sunGlow = new THREE.PointLight(0xff985f, 80, 250);
sunGlow.position.copy(sun.position);
scene.add(sunGlow);

// =====================================================
// LIGHTS
// =====================================================

scene.add(new THREE.HemisphereLight(0xc7d7e5, 0x35472b, 1.5));

const sunlight = new THREE.DirectionalLight(0xffc19a, 3.1);
sunlight.position.set(-65, 90, -70);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);
sunlight.shadow.camera.left = -120;
sunlight.shadow.camera.right = 120;
sunlight.shadow.camera.top = 120;
sunlight.shadow.camera.bottom = -120;
sunlight.shadow.bias = -0.0002;
sunlight.shadow.normalBias = 0.035;
scene.add(sunlight);

const fillLight = new THREE.DirectionalLight(0x9ab5c4, 0.65);
fillLight.position.set(60, 35, 50);
scene.add(fillLight);

// =====================================================
// GROUND TEXTURE
// =====================================================

function makeGroundTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#52683b";
    ctx.fillRect(0, 0, 1024, 1024);

    const colors = [
        "#435a31", "#637847", "#778653",
        "#374d2d", "#8b8756", "#536b3c", "#6a7847"
    ];

    for (let i = 0; i < 45000; i++) {
        ctx.globalAlpha = 0.15 + Math.random() * 0.3;
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];

        ctx.beginPath();
        ctx.ellipse(
            Math.random() * 1024,
            Math.random() * 1024,
            1 + Math.random() * 5,
            1 + Math.random() * 3,
            Math.random() * Math.PI,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }

    ctx.globalAlpha = 1;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(12, 12);
    texture.colorSpace = THREE.SRGBColorSpace;

    return texture;
}

const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(260, 260),
    new THREE.MeshStandardMaterial({
        map: makeGroundTexture(),
        roughness: 1
    })
);

ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.1;
ground.receiveShadow = true;
scene.add(ground);

// =====================================================
// LAKE
// =====================================================

const lakeCenter = new THREE.Vector3(22, 0, -12);

const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x286a7c,
    roughness: 0.18,
    metalness: 0.18,
    transparent: true,
    opacity: 0.91,
    clearcoat: 1,
    clearcoatRoughness: 0.12
});

const lake = new THREE.Mesh(
    new THREE.CircleGeometry(18, 80),
    waterMaterial
);

lake.rotation.x = -Math.PI / 2;
lake.position.set(lakeCenter.x, 0.04, lakeCenter.z);
scene.add(lake);

const shore = new THREE.Mesh(
    new THREE.RingGeometry(17.5, 20, 80),
    new THREE.MeshStandardMaterial({
        color: 0x8b805e,
        roughness: 1
    })
);

shore.rotation.x = -Math.PI / 2;
shore.position.set(lakeCenter.x, 0.02, lakeCenter.z);
scene.add(shore);

const ripples = [];

for (let i = 0; i < 18; i++) {
    const ripple = new THREE.Mesh(
        new THREE.RingGeometry(0.25, 0.32, 32),
        new THREE.MeshBasicMaterial({
            color: 0xb4d7d8,
            transparent: true,
            opacity: 0.35,
            side: THREE.DoubleSide
        })
    );

    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set(
        lakeCenter.x + (Math.random() - 0.5) * 25,
        0.09,
        lakeCenter.z + (Math.random() - 0.5) * 25
    );

    scene.add(ripple);
    ripples.push({ mesh: ripple, phase: Math.random() * 5 });
}

// =====================================================
// DISTANT MOUNTAINS
// =====================================================

const mountainMaterial = new THREE.MeshStandardMaterial({
    color: 0x53605b,
    roughness: 1,
    flatShading: true
});

for (let i = 0; i < 28; i++) {
    const angle = (i / 28) * Math.PI * 2;
    const radius = 155 + Math.random() * 25;
    const height = 22 + Math.random() * 35;

    const mountain = new THREE.Mesh(
        new THREE.ConeGeometry(18 + Math.random() * 15, height, 6),
        mountainMaterial
    );

    mountain.position.set(
        Math.cos(angle) * radius,
        height / 2 - 1,
        Math.sin(angle) * radius
    );

    mountain.rotation.y = Math.random() * Math.PI;
    scene.add(mountain);
}

// =====================================================
// TREES
// =====================================================

const barkMaterial = new THREE.MeshStandardMaterial({
    color: 0x57402d,
    roughness: 1
});

const leafMaterials = [
    new THREE.MeshStandardMaterial({ color: 0x24472c, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0x315c35, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0x3e6639, roughness: 1 }),
    new THREE.MeshStandardMaterial({ color: 0x1b3925, roughness: 1 })
];

const trees = [];

function createTree(x, z, scale = 1) {
    const tree = new THREE.Group();

    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.22, 0.36, 4.5, 10),
        barkMaterial
    );

    trunk.position.y = 2.25;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    tree.add(trunk);

    for (let i = 0; i < 4; i++) {
        const leaves = new THREE.Mesh(
            new THREE.ConeGeometry(2.4 - i * 0.35, 3.3, 9),
            leafMaterials[Math.floor(Math.random() * leafMaterials.length)]
        );

        leaves.position.y = 3.5 + i * 1.65;
        leaves.rotation.y = Math.random() * Math.PI;
        leaves.castShadow = true;
        leaves.receiveShadow = true;
        tree.add(leaves);
    }

    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);
    scene.add(tree);

    trees.push({
        object: tree,
        x,
        z,
        health: 3,
        removed: false
    });
}

for (let i = 0; i < 230; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 18 + Math.random() * 100;

    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    if (Math.hypot(x - lakeCenter.x, z - lakeCenter.z) < 23) continue;
    if (Math.hypot(x, z - 12) < 8) continue;

    createTree(x, z, 0.8 + Math.random() * 0.65);
}

// =====================================================
// GRASS
// =====================================================

const grassGeometry = new THREE.ConeGeometry(0.045, 0.35, 3);

const grassMaterial = new THREE.MeshStandardMaterial({
    color: 0x74834a,
    roughness: 1
});

const grass = new THREE.InstancedMesh(
    grassGeometry,
    grassMaterial,
    5000
);

const dummy = new THREE.Object3D();

for (let i = 0; i < 5000; i++) {
    const x = (Math.random() - 0.5) * 230;
    const z = (Math.random() - 0.5) * 230;

    if (Math.hypot(x - lakeCenter.x, z - lakeCenter.z) < 19) {
        dummy.position.set(0, -100, 0);
    } else {
        dummy.position.set(x, 0.15, z);
    }

    dummy.rotation.set(
        0,
        Math.random() * Math.PI,
        (Math.random() - 0.5) * 0.3
    );

    const size = 0.6 + Math.random() * 1.2;
    dummy.scale.set(size, size, size);
    dummy.updateMatrix();
    grass.setMatrixAt(i, dummy.matrix);
}

scene.add(grass);

// =====================================================
// ROCKS AND WOOD RESOURCES
// =====================================================

const resources = [];

const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x858a88,
    roughness: 0.95
});

const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x98643b,
    roughness: 0.95
});

function createResource(type, x, z) {
    const group = new THREE.Group();

    if (type === "stone") {
        for (let i = 0; i < 3; i++) {
            const rock = new THREE.Mesh(
                new THREE.DodecahedronGeometry(0.35 + Math.random() * 0.3, 1),
                stoneMaterial
            );

            rock.position.set(
                (Math.random() - 0.5) * 0.5,
                0.25 + Math.random() * 0.2,
                (Math.random() - 0.5) * 0.5
            );

            rock.scale.y = 0.75;
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            rock.castShadow = true;
            group.add(rock);
        }
    } else {
        for (let i = 0; i < 2; i++) {
            const log = new THREE.Mesh(
                new THREE.CylinderGeometry(0.16, 0.19, 1.6, 10),
                woodMaterial
            );

            log.rotation.z = Math.PI / 2;
            log.rotation.y = Math.random() * 0.5;
            log.position.set(0, 0.18 + i * 0.18, i * 0.25);
            log.castShadow = true;
            group.add(log);
        }
    }

    group.position.set(x, 0, z);
    scene.add(group);

    resources.push({
        object: group,
        type,
        collected: false
    });
}

for (let i = 0; i < 45; i++) {
    const x = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;

    if (Math.hypot(x - lakeCenter.x, z - lakeCenter.z) < 22) continue;

    createResource("wood", x, z);
    createResource("stone", x + 2, z + 2);
}

// =====================================================
// PLAYER
// =====================================================

const player = {
    position: new THREE.Vector3(0, 1.7, 12),
    velocityY: 0,
    onGround: true,
    speed: 7,
    sprintSpeed: 12
};

let yaw = 0;
let pitch = 0;
let gameFocused = false;

const keys = {};

const inventory = {
    wood: 0,
    stone: 0,
    fish: 0,
    photos: 0
};

let axeUnlocked = false;
let chainsawUnlocked = false;
let currentTool = "hands";
let flashlightOn = false;
let fishing = false;
let fishingTimer = 0;
let insideCar = false;

const clock = new THREE.Clock();

// =====================================================
// UI
// =====================================================

function showMessage(text) {
    messageUI.textContent = text;
    messageUI.style.opacity = "1";

    clearTimeout(showMessage.timer);

    showMessage.timer = setTimeout(() => {
        messageUI.style.opacity = "0";
    }, 2300);
}

function updateHUD() {
    inventoryUI.innerHTML = `
        🪵 Փայտ՝ ${inventory.wood}<br>
        🪨 Քար՝ ${inventory.stone}<br>
        🐟 Ձուկ՝ ${inventory.fish}<br>
        📷 Լուսանկարներ՝ ${inventory.photos}<br>
        🪓 Կացին՝ ${axeUnlocked ? "Բացված է" : "10 փայտ + 10 քար"}<br>
        ⚙️ Շղթայասղոց՝ ${chainsawUnlocked ? "Բացված է" : "100 փայտ + 100 քար"}
    `;

    const labels = {
        hands: "Ձեռքեր",
        axe: "Կացին",
        chainsaw: "Շղթայասղոց",
        shovel: "Բահ"
    };

    toolUI.textContent = insideCar
        ? "Opel Astra G"
        : "Գործիք՝ " + labels[currentTool];
}

updateHUD();

// =====================================================
// PLAYER HAND AND TOOLS
// =====================================================

const handGroup = new THREE.Group();
camera.add(handGroup);

const hand = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.2, 0.4),
    new THREE.MeshStandardMaterial({
        color: 0xc58d68,
        roughness: 0.85
    })
);

hand.position.set(0.38, -0.35, -0.55);
handGroup.add(hand);

// AXE

const axeGroup = new THREE.Group();

const axeHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.8, 10),
    new THREE.MeshStandardMaterial({
        color: 0x69452e,
        roughness: 0.9
    })
);

axeHandle.rotation.x = Math.PI / 2;
axeHandle.position.z = -0.3;
axeGroup.add(axeHandle);

const axeBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.36, 0.3, 0.08),
    new THREE.MeshStandardMaterial({
        color: 0xb8c2c5,
        metalness: 0.85,
        roughness: 0.2
    })
);

axeBlade.position.set(0.13, 0.05, -0.68);
axeGroup.add(axeBlade);

axeGroup.position.set(0.4, -0.3, -0.7);
camera.add(axeGroup);

// CHAINSAW

const chainsawGroup = new THREE.Group();

const sawBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.25, 0.45),
    new THREE.MeshStandardMaterial({
        color: 0xe2a322,
        roughness: 0.6
    })
);

chainsawGroup.add(sawBody);

const sawBar = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.09, 0.85),
    new THREE.MeshStandardMaterial({
        color: 0x8c969b,
        metalness: 0.8,
        roughness: 0.25
    })
);

sawBar.position.z = -0.58;
chainsawGroup.add(sawBar);

chainsawGroup.position.set(0.4, -0.3, -0.7);
camera.add(chainsawGroup);

// =====================================================
// SHOVEL - NEW TOOL
// =====================================================

const shovelGroup = new THREE.Group();

const shovelHandle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.045, 0.95, 10),
    new THREE.MeshStandardMaterial({
        color: 0x70472b,
        roughness: 0.9
    })
);

shovelHandle.rotation.x = Math.PI / 2;
shovelHandle.position.z = -0.3;
shovelGroup.add(shovelHandle);

const shovelNeck = new THREE.Mesh(
    new THREE.BoxGeometry(0.09, 0.09, 0.18),
    new THREE.MeshStandardMaterial({
        color: 0x777d80,
        metalness: 0.7,
        roughness: 0.35
    })
);

shovelNeck.position.set(0, -0.02, -0.75);
shovelGroup.add(shovelNeck);

const shovelBlade = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.42, 0.055),
    new THREE.MeshStandardMaterial({
        color: 0x9ba4a6,
        metalness: 0.85,
        roughness: 0.25
    })
);

shovelBlade.position.set(0, -0.08, -0.98);
shovelBlade.rotation.x = -0.15;
shovelGroup.add(shovelBlade);

shovelGroup.position.set(0.4, -0.3, -0.7);
camera.add(shovelGroup);

// =====================================================
// TOOL VISIBILITY
// =====================================================

function updateToolVisibility() {
    hand.visible = currentTool === "hands" && !insideCar && !fishing;
    axeGroup.visible = currentTool === "axe" && !insideCar && !fishing;
    chainsawGroup.visible = currentTool === "chainsaw" && !insideCar && !fishing;
    shovelGroup.visible = currentTool === "shovel" && !insideCar && !fishing;
}

updateToolVisibility();

// =====================================================
// FLASHLIGHT
// =====================================================

const flashlight = new THREE.SpotLight(
    0xfff4d9,
    0,
    65,
    Math.PI / 7,
    0.35,
    1
);

flashlight.position.set(0, 0, 0);
flashlight.target.position.set(0, 0, -1);
camera.add(flashlight);
camera.add(flashlight.target);

// =====================================================
// FISHING ROD
// =====================================================

const rodGroup = new THREE.Group();

const rod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.025, 0.04, 1.7, 8),
    new THREE.MeshStandardMaterial({ color: 0x72502d })
);

rod.rotation.x = Math.PI / 2;
rod.position.z = -0.6;
rodGroup.add(rod);

const line = new THREE.Mesh(
    new THREE.CylinderGeometry(0.003, 0.003, 1.2, 5),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
);

line.position.set(0, -0.5, -1.2);
rodGroup.add(line);

rodGroup.position.set(0.4, -0.3, -0.7);
rodGroup.visible = false;
camera.add(rodGroup);

// =====================================================
// DEER
// =====================================================

const deerList = [];

const deerBrown = new THREE.MeshStandardMaterial({
    color: 0x93613e,
    roughness: 0.95
});

const deerDark = new THREE.MeshStandardMaterial({
    color: 0x463024,
    roughness: 1
});

const deerWhite = new THREE.MeshStandardMaterial({
    color: 0xe6d9bd,
    roughness: 1
});

function createDeer(x, z) {
    const deer = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(0.58, 0.62, 1.25),
        deerBrown
    );

    body.position.y = 1.05;
    deer.add(body);

    const neck = new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.68, 0.35),
        deerBrown
    );

    neck.position.set(0, 1.52, -0.48);
    neck.rotation.x = -0.25;
    deer.add(neck);

    const head = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.32, 0.48),
        deerBrown
    );

    head.position.set(0, 1.88, -0.68);
    deer.add(head);

    const muzzle = new THREE.Mesh(
        new THREE.BoxGeometry(0.2, 0.13, 0.18),
        deerDark
    );

    muzzle.position.set(0, 1.78, -0.96);
    deer.add(muzzle);

    const belly = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.16, 0.8),
        deerWhite
    );

    belly.position.set(0, 0.76, 0);
    deer.add(belly);

    const legs = [];

    for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.055, 0.04, 0.72, 7),
            deerDark
        );

        leg.position.set(
            i < 2 ? -0.19 : 0.19,
            0.4,
            i % 2 === 0 ? -0.42 : 0.42
        );

        deer.add(leg);
        legs.push(leg);
    }

    for (const side of [-1, 1]) {
        const ear = new THREE.Mesh(
            new THREE.ConeGeometry(0.07, 0.3, 6),
            deerBrown
        );

        ear.position.set(side * 0.2, 2.02, -0.62);
        ear.rotation.z = side * 0.6;
        deer.add(ear);

        const antler = new THREE.Group();

        const main = new THREE.Mesh(
            new THREE.CylinderGeometry(0.025, 0.035, 0.5, 6),
            deerDark
        );

        main.position.y = 0.25;
        main.rotation.z = side * -0.2;
        antler.add(main);

        const branch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.025, 0.28, 6),
            deerDark
        );

        branch.position.set(side * 0.12, 0.35, 0);
        branch.rotation.z = side * 0.7;
        antler.add(branch);

        antler.position.set(side * 0.12, 2.02, -0.68);
        deer.add(antler);
    }

    deer.position.set(x, 0, z);

    deer.traverse(object => {
        if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });

    scene.add(deer);

    deerList.push({
        object: deer,
        legs,
        direction: Math.random() * Math.PI * 2,
        timer: Math.random() * 4,
        speed: 0.7 + Math.random() * 0.5,
        phase: Math.random() * 10,
        moving: true
    });
}

for (let i = 0; i < 9; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = 28 + Math.random() * 65;

    createDeer(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance
    );
}

function updateDeer(delta) {
    for (const deer of deerList) {
        deer.timer -= delta;
        deer.phase += delta * 6;

        const distance = deer.object.position.distanceTo(player.position);

        if (distance < 12) {
            const away = new THREE.Vector3()
                .subVectors(deer.object.position, player.position)
                .normalize();

            deer.direction = Math.atan2(away.x, away.z);
            deer.moving = true;
        } else if (deer.timer <= 0) {
            deer.timer = 2 + Math.random() * 5;
            deer.direction += (Math.random() - 0.5) * 1.5;
            deer.moving = Math.random() > 0.25;
        }

        if (deer.moving) {
            deer.object.position.x += Math.sin(deer.direction) * deer.speed * delta;
            deer.object.position.z += Math.cos(deer.direction) * deer.speed * delta;
            deer.object.rotation.y = deer.direction + Math.PI;

            deer.legs[0].rotation.x = Math.sin(deer.phase) * 0.4;
            deer.legs[1].rotation.x = -Math.sin(deer.phase) * 0.4;
            deer.legs[2].rotation.x = -Math.sin(deer.phase) * 0.4;
            deer.legs[3].rotation.x = Math.sin(deer.phase) * 0.4;
        }
    }
}

// =====================================================
// OPEL ASTRA G
// =====================================================

const car = new THREE.Group();

const carPaint = new THREE.MeshPhysicalMaterial({
    color: 0x183d68,
    metalness: 0.72,
    roughness: 0.25,
    clearcoat: 1,
    clearcoatRoughness: 0.15
});

const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0x172c39,
    metalness: 0.25,
    roughness: 0.12,
    transparent: true,
    opacity: 0.82
});

const tireMaterial = new THREE.MeshStandardMaterial({
    color: 0x171717,
    roughness: 0.95
});

const metalMaterial = new THREE.MeshStandardMaterial({
    color: 0xaeb5b7,
    metalness: 0.9,
    roughness: 0.25
});

const carBody = new THREE.Mesh(
    new THREE.BoxGeometry(2.1, 0.65, 4.5),
    carPaint
);

carBody.position.y = 0.9;
carBody.castShadow = true;
car.add(carBody);

const cabin = new THREE.Mesh(
    new THREE.BoxGeometry(1.72, 0.78, 2.35),
    glassMaterial
);

cabin.position.set(0, 1.55, -0.2);
cabin.castShadow = true;
car.add(cabin);

const roof = new THREE.Mesh(
    new THREE.BoxGeometry(1.7, 0.12, 1.6),
    carPaint
);

roof.position.set(0, 1.97, -0.2);
car.add(roof);

const hood = new THREE.Mesh(
    new THREE.BoxGeometry(1.95, 0.16, 1.1),
    carPaint
);

hood.position.set(0, 1.2, -1.55);
car.add(hood);

for (const z of [-2.28, 2.28]) {
    const bumper = new THREE.Mesh(
        new THREE.BoxGeometry(2.05, 0.22, 0.18),
        metalMaterial
    );

    bumper.position.set(0, 0.62, z);
    car.add(bumper);
}

for (const side of [-1, 1]) {
    const windowMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.035, 0.52, 1.85),
        glassMaterial
    );

    windowMesh.position.set(side * 0.87, 1.57, -0.2);
    car.add(windowMesh);
}

const wheels = [];

for (const x of [-1.05, 1.05]) {
    for (const z of [-1.45, 1.45]) {
        const wheel = new THREE.Group();

        const tire = new THREE.Mesh(
            new THREE.CylinderGeometry(0.43, 0.43, 0.24, 24),
            tireMaterial
        );

        tire.rotation.z = Math.PI / 2;
        wheel.add(tire);

        const rim = new THREE.Mesh(
            new THREE.CylinderGeometry(0.23, 0.23, 0.25, 16),
            metalMaterial
        );

        rim.rotation.z = Math.PI / 2;
        wheel.add(rim);

        wheel.position.set(x, 0.48, z);
        car.add(wheel);
        wheels.push(wheel);
    }
}

for (const side of [-1, 1]) {
    const headlight = new THREE.Mesh(
        new THREE.BoxGeometry(0.55, 0.22, 0.08),
        new THREE.MeshStandardMaterial({
            color: 0xfff2d1,
            emissive: 0xffd58a,
            emissiveIntensity: 1.2
        })
    );

    headlight.position.set(side * 0.65, 1.05, -2.28);
    car.add(headlight);

    const rearLight = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.25, 0.08),
        new THREE.MeshStandardMaterial({
            color: 0xa51c16,
            emissive: 0x6b0804,
            emissiveIntensity: 0.8
        })
    );

    rearLight.position.set(side * 0.72, 1.1, 2.28);
    car.add(rearLight);
}

const grille = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.24, 0.06),
    new THREE.MeshStandardMaterial({
        color: 0x171b1e,
        metalness: 0.7,
        roughness: 0.4
    })
);

grille.position.set(0, 0.92, -2.31);
car.add(grille);

const badge = new THREE.Mesh(
    new THREE.TorusGeometry(0.12, 0.025, 8, 24),
    metalMaterial
);

badge.position.set(0, 1.05, -2.37);
car.add(badge);

car.position.set(0, 0, 22);

car.traverse(object => {
    if (object.isMesh) {
        object.castShadow = true;
        object.receiveShadow = true;
    }
});

scene.add(car);

let carSpeed = 0;
let carSteering = 0;

function isNearCar() {
    return player.position.distanceTo(car.position) < 4;
}

function enterCar() {
    if (insideCar) {
        insideCar = false;

        player.position.set(
            car.position.x + 2.5,
            1.7,
            car.position.z
        );

        camera.position.copy(player.position);
        camera.rotation.order = "YXZ";
        camera.rotation.y = yaw;
        camera.rotation.x = pitch;

        showMessage("Դուրս եկար մեքենայից");
    } else if (isNearCar()) {
        insideCar = true;
        showMessage("Դու նստեցիր Opel Astra G");
    } else {
        showMessage("Մոտեցիր Opel Astra G-ին");
    }

    updateToolVisibility();
    updateHUD();
}

function updateCar(delta) {
    const accelerating = keys.KeyW;
    const reversing = keys.KeyS;
    const braking = keys.Space;

    if (accelerating) carSpeed += 13 * delta;
    if (reversing) carSpeed -= 9 * delta;
    if (braking) carSpeed *= Math.max(0, 1 - delta * 4);

    if (!accelerating && !reversing) {
        carSpeed *= Math.max(0, 1 - delta * 1.5);
    }

    carSpeed = THREE.MathUtils.clamp(carSpeed, -9, 25);

    const steeringInput =
        (keys.KeyA ? 1 : 0) -
        (keys.KeyD ? 1 : 0);

    carSteering = THREE.MathUtils.lerp(
        carSteering,
        steeringInput,
        delta * 4
    );

    car.rotation.y += carSteering * carSpeed * delta * 0.035;

    car.position.x -= Math.sin(car.rotation.y) * carSpeed * delta;
    car.position.z -= Math.cos(car.rotation.y) * carSpeed * delta;

    wheels.forEach(wheel => {
        wheel.rotation.x += carSpeed * delta * 1.5;
    });

    const followPosition = new THREE.Vector3(
        car.position.x + Math.sin(car.rotation.y) * 6,
        4.2,
        car.position.z + Math.cos(car.rotation.y) * 6
    );

    camera.position.lerp(followPosition, delta * 5);

    const lookTarget = new THREE.Vector3(
        car.position.x,
        1.2,
        car.position.z
    );

    camera.lookAt(lookTarget);
}

// =====================================================
// RESOURCE COLLECTION
// =====================================================

function getNearestResource() {
    let nearest = null;
    let nearestDistance = 3.5;

    for (const resource of resources) {
        if (resource.collected) continue;

        const distance = player.position.distanceTo(resource.object.position);

        if (distance < nearestDistance) {
            nearest = resource;
            nearestDistance = distance;
        }
    }

    return nearest;
}

function getTargetTree() {
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);

    let nearest = null;
    let nearestDistance = 4;

    for (const tree of trees) {
        if (tree.removed) continue;

        const target = new THREE.Vector3(tree.x, 1.5, tree.z);
        const difference = target.sub(player.position);
        const distance = difference.length();

        if (distance > nearestDistance) continue;

        difference.normalize();

        if (direction.dot(difference) > 0.65) {
            nearest = tree;
            nearestDistance = distance;
        }
    }

    return nearest;
}

function checkUnlocks() {
    if (!axeUnlocked && inventory.wood >= 10 && inventory.stone >= 10) {
        axeUnlocked = true;
        currentTool = "axe";
        showMessage("Կացինը բացվեց։ Սեղմիր 1՝ ընտրելու համար");
    }

    if (
        !chainsawUnlocked &&
        inventory.wood >= 100 &&
        inventory.stone >= 100
    ) {
        chainsawUnlocked = true;
        currentTool = "chainsaw";
        showMessage("Շղթայասղոցը բացվեց։ Սեղմիր 2՝ ընտրելու համար");
    }

    updateToolVisibility();
    updateHUD();
}

function collectResource() {
    if (insideCar || fishing) return;

    const resource = getNearestResource();

    if (!resource) {
        showMessage("Մոտակայքում հավաքելու բան չկա");
        return;
    }

    resource.collected = true;
    scene.remove(resource.object);

    if (resource.type === "wood") {
        inventory.wood++;
        showMessage("+1 փայտ");
    } else {
        inventory.stone++;
        showMessage("+1 քար");
    }

    checkUnlocks();
}

// =====================================================
// CHOP TREES
// =====================================================

let toolSwing = 0;

function chopTree() {
    if (insideCar || fishing) return;

    if (currentTool === "hands") {
        showMessage("Ծառ կտրելու համար կացին է պետք");
        return;
    }

    if (currentTool === "shovel") {
        showMessage("Բահով ծառ կտրել հնարավոր չէ");
        return;
    }

    const tree = getTargetTree();

    if (!tree) {
        showMessage("Նայիր ծառին և մոտեցիր նրան");
        return;
    }

    if (currentTool === "axe" && axeUnlocked) {
        tree.health--;
        inventory.wood += 3;

        if (tree.health <= 0) {
            tree.removed = true;
            scene.remove(tree.object);
            showMessage("Ծառը կտրվեց։ +3 փայտ");
        } else {
            showMessage("Հարված ծառին։ +3 փայտ");
        }
    } else if (currentTool === "chainsaw" && chainsawUnlocked) {
        tree.removed = true;
        scene.remove(tree.object);
        inventory.wood += 8;
        showMessage("Ծառը կտրվեց։ +8 փայտ");
    }

    toolSwing = 0.3;
    checkUnlocks();
}

// =====================================================
// SHOVEL DIGGING
// =====================================================

function digGround() {
    if (insideCar || fishing) return;

    if (currentTool !== "shovel") return;

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);

    if (direction.y > -0.35) {
        showMessage("Նայիր գետնին՝ փորելու համար");
        return;
    }

    const distance = 2.5;

    const digX = player.position.x + direction.x * distance;
    const digZ = player.position.z + direction.z * distance;

    if (Math.hypot(digX - lakeCenter.x, digZ - lakeCenter.z) < 20) {
        showMessage("Լճի մոտ փորել հնարավոր չէ");
        return;
    }

    const soil = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.48, 0.12, 12),
        new THREE.MeshStandardMaterial({
            color: 0x493522,
            roughness: 1
        })
    );

    soil.position.set(digX, 0.02, digZ);
    soil.castShadow = true;
    soil.receiveShadow = true;
    scene.add(soil);

    if (Math.random() > 0.5) {
        inventory.stone++;
        showMessage("Փորեցիր հողը։ +1 քար");
        checkUnlocks();
    } else {
        showMessage("Փորեցիր հողը, բայց ոչինչ չգտար");
    }

    toolSwing = 0.3;
    updateHUD();
}

// =====================================================
// MOUSE ACTION
// =====================================================

document.addEventListener("mousedown", event => {
    if (event.button !== 0) return;
    if (!gameFocused || insideCar) return;

    if (document.pointerLockElement !== renderer.domElement) return;

    if (currentTool === "shovel") {
        digGround();
    } else {
        chopTree();
    }
});

// =====================================================
// FISHING
// =====================================================

function startFishing() {
    if (insideCar || fishing) return;

    const distance = Math.hypot(
        player.position.x - lakeCenter.x,
        player.position.z - lakeCenter.z
    );

    if (distance > 21) {
        showMessage("Մոտեցիր լճի ափին");
        return;
    }

    fishing = true;
    fishingTimer = 4;

    updateToolVisibility();
    rodGroup.visible = true;

    showMessage("Ձկնորսություն... սպասիր");
}

function updateFishing(delta) {
    if (!fishing) return;

    fishingTimer -= delta;

    if (fishingTimer <= 0) {
        fishing = false;
        rodGroup.visible = false;
        updateToolVisibility();

        if (Math.random() > 0.3) {
            inventory.fish++;
            showMessage("Դու բռնեցիր մեկ ձուկ");
        } else {
            showMessage("Այս անգամ ձուկ չբռնվեց");
        }

        updateHUD();
    }
}

// =====================================================
// WILDLIFE PHOTOGRAPHY
// =====================================================

function takePhoto() {
    if (insideCar) return;

    let nearest = null;
    let nearestDistance = 18;

    for (const deer of deerList) {
        const distance = player.position.distanceTo(deer.object.position);

        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = deer;
        }
    }

    if (!nearest) {
        showMessage("Եղնիկը շատ հեռու է");
        return;
    }

    const viewDirection = new THREE.Vector3(0, 0, -1);
    viewDirection.applyQuaternion(camera.quaternion);

    const targetDirection = new THREE.Vector3()
        .subVectors(nearest.object.position, camera.position)
        .normalize();

    if (viewDirection.dot(targetDirection) < 0.7) {
        showMessage("Նայիր եղնիկի ուղղությամբ");
        return;
    }

    inventory.photos++;
    updateHUD();
    showMessage("Լուսանկարն արված է");
}

// =====================================================
// KEYBOARD
// =====================================================

document.addEventListener("keydown", event => {
    keys[event.code] = true;

    if (event.code === "Space") {
        event.preventDefault();
    }

    if (event.repeat) return;

    if (event.code === "KeyE") {
        if (insideCar || isNearCar()) {
            enterCar();
        } else {
            collectResource();
        }
    }

    if (event.code === "KeyF") {
        startFishing();
    }

    if (event.code === "KeyQ") {
        takePhoto();
    }

    if (event.code === "KeyL") {
        flashlightOn = !flashlightOn;
        flashlight.intensity = flashlightOn ? 6 : 0;

        showMessage(
            flashlightOn ? "Լապտերը միացված է" : "Լապտերն անջատված է"
        );
    }

    if (event.code === "Digit1") {
        if (!axeUnlocked) {
            showMessage("Հավաքիր 10 փայտ և 10 քար");
        } else {
            currentTool = "axe";
            showMessage("Ընտրված է կացինը");
        }

        updateToolVisibility();
        updateHUD();
    }

    if (event.code === "Digit2") {
        if (!chainsawUnlocked) {
            showMessage("Հավաքիր 100 փայտ և 100 քար");
        } else {
            currentTool = "chainsaw";
            showMessage("Ընտրված է շղթայասղոցը");
        }

        updateToolVisibility();
        updateHUD();
    }

    // SHOVEL: KEY 3
    if (event.code === "Digit3") {
        currentTool = "shovel";
        showMessage("Ընտրված է բահը");
        updateToolVisibility();
        updateHUD();
    }
});

document.addEventListener("keyup", event => {
    keys[event.code] = false;
});

// =====================================================
// MOUSE LOOK
// =====================================================

renderer.domElement.addEventListener("click", () => {
    gameFocused = true;

    if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock();
    }
});

document.addEventListener("pointerlockchange", () => {
    gameFocused =
        document.pointerLockElement === renderer.domElement;
});

document.addEventListener("mousemove", event => {
    if (document.pointerLockElement !== renderer.domElement) return;
    if (insideCar) return;

    yaw -= event.movementX * 0.002;
    pitch -= event.movementY * 0.002;

    pitch = THREE.MathUtils.clamp(
        pitch,
        -Math.PI / 2 + 0.05,
        Math.PI / 2 - 0.05
    );

    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
});

// =====================================================
// PLAYER MOVEMENT
// =====================================================

function updatePlayer(delta) {
    if (!gameFocused || fishing) return;

    if (insideCar) {
        updateCar(delta);
        return;
    }

    const forward = new THREE.Vector3(
        -Math.sin(yaw),
        0,
        -Math.cos(yaw)
    );

    const right = new THREE.Vector3(
        Math.cos(yaw),
        0,
        -Math.sin(yaw)
    );

    const direction = new THREE.Vector3();

    if (keys.KeyW) direction.add(forward);
    if (keys.KeyS) direction.sub(forward);
    if (keys.KeyD) direction.add(right);
    if (keys.KeyA) direction.sub(right);

    if (direction.lengthSq() > 0) {
        direction.normalize();

        const speed =
            keys.ShiftLeft || keys.ShiftRight
                ? player.sprintSpeed
                : player.speed;

        player.position.addScaledVector(direction, speed * delta);
    }

    if (keys.Space && player.onGround) {
        player.velocityY = 6;
        player.onGround = false;
        keys.Space = false;
    }

    player.velocityY -= 15 * delta;
    player.position.y += player.velocityY * delta;

    if (player.position.y < 1.7) {
        player.position.y = 1.7;
        player.velocityY = 0;
        player.onGround = true;
    }

    player.position.x = THREE.MathUtils.clamp(
        player.position.x,
        -125,
        125
    );

    player.position.z = THREE.MathUtils.clamp(
        player.position.z,
        -125,
        125
    );

    camera.position.copy(player.position);
    camera.rotation.order = "YXZ";
    camera.rotation.y = yaw;
    camera.rotation.x = pitch;
}

// =====================================================
// TOOL ANIMATION
// =====================================================

function updateToolAnimation(delta) {
    if (toolSwing > 0) {
        toolSwing -= delta;

        const swing = Math.sin(
            (0.3 - toolSwing) / 0.3 * Math.PI
        );

        axeGroup.rotation.x = -swing * 0.8;
        chainsawGroup.rotation.x = -swing * 0.4;
        shovelGroup.rotation.x = -swing * 0.65;
    } else {
        axeGroup.rotation.x = 0;
        chainsawGroup.rotation.x = 0;
        shovelGroup.rotation.x = 0;
    }
}

// =====================================================
// LAKE ANIMATION
// =====================================================

function updateWater(time) {
    for (const ripple of ripples) {
        const value = (time * 0.25 + ripple.phase) % 1;

        ripple.mesh.scale.setScalar(0.5 + value * 2.2);
        ripple.mesh.material.opacity = (1 - value) * 0.3;
    }

    waterMaterial.roughness = 0.17 + Math.sin(time * 0.6) * 0.025;
}

// =====================================================
// DAYLIGHT ATMOSPHERE
// =====================================================

function updateAtmosphere(time) {
    const glow = 1 + Math.sin(time * 0.15) * 0.08;
    sunGlow.intensity = 80 * glow;
}

// =====================================================
// RESIZE
// =====================================================

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// =====================================================
// GAME LOOP
// =====================================================

function animate() {
    requestAnimationFrame(animate);

    const delta = Math.min(clock.getDelta(), 0.04);
    const time = clock.elapsedTime;

    updatePlayer(delta);
    updateDeer(delta);
    updateFishing(delta);
    updateToolAnimation(delta);
    updateWater(time);
    updateAtmosphere(time);

    renderer.render(scene, camera);
}

animate();

showMessage("WILDERNESS — խաղը պատրաստ է։ Սեղմիր էկրանի վրա և սկսիր։");