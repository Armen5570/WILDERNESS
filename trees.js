
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const trunkMaterial = new THREE.MeshStandardMaterial({
    color: 0x493020,
    roughness: 0.95
});

const branchMaterial = new THREE.MeshStandardMaterial({
    color: 0x60402a,
    roughness: 1
});

const leafMaterials = [
    new THREE.MeshStandardMaterial({
        color: 0x244d2b,
        roughness: 0.95
    }),
    new THREE.MeshStandardMaterial({
        color: 0x315b32,
        roughness: 0.95
    }),
    new THREE.MeshStandardMaterial({
        color: 0x3c6838,
        roughness: 0.95
    }),
    new THREE.MeshStandardMaterial({
        color: 0x1d4026,
        roughness: 0.95
    })
];

const trunkGeometry = new THREE.CylinderGeometry(
    0.28, 0.48, 7, 9
);

const branchGeometry = new THREE.CylinderGeometry(
    0.07, 0.16, 2.8, 7
);

const leafGeometry = new THREE.IcosahedronGeometry(1, 1);

function createBranch(parent, x, y, z, rotationZ, rotationX, scale = 1) {
    const branch = new THREE.Mesh(
        branchGeometry,
        branchMaterial
    );

    branch.position.set(x, y, z);
    branch.rotation.set(rotationX, 0, rotationZ);
    branch.scale.setScalar(scale);
    branch.castShadow = true;

    parent.add(branch);
}

function createLeafCluster(parent, x, y, z, scale, material) {
    const cluster = new THREE.Group();

    const mainLeaf = new THREE.Mesh(
        leafGeometry,
        material
    );

    mainLeaf.scale.set(
        scale * 1.1,
        scale * 0.85,
        scale
    );

    mainLeaf.castShadow = true;
    mainLeaf.receiveShadow = true;
    cluster.add(mainLeaf);

    // Փոքր տերևային խմբեր՝ սաղարթն ավելի խիտ դարձնելու համար
    for (let i = 0; i < 4; i++) {
        const smallLeaf = new THREE.Mesh(
            leafGeometry,
            leafMaterials[Math.floor(Math.random() * leafMaterials.length)]
        );

        smallLeaf.position.set(
            (Math.random() - 0.5) * scale * 1.1,
            (Math.random() - 0.5) * scale * 0.9,
            (Math.random() - 0.5) * scale * 1.1
        );

        smallLeaf.scale.set(
            scale * 0.55,
            scale * 0.5,
            scale * 0.55
        );

        smallLeaf.rotation.set(
            Math.random(),
            Math.random() * Math.PI,
            Math.random()
        );

        smallLeaf.castShadow = true;
        cluster.add(smallLeaf);
    }

    cluster.position.set(x, y, z);
    parent.add(cluster);

    return cluster;
}

function createTree(x, z, scale = 1) {
    const tree = new THREE.Group();

    // Բուն
    const trunk = new THREE.Mesh(
        trunkGeometry,
        trunkMaterial
    );

    trunk.position.y = 3.5;
    trunk.castShadow = true;
    trunk.receiveShadow = true;
    trunk.scale.setScalar(scale);
    tree.add(trunk);

    // Վերին հատվածը շարժվում է քամուց
    const crown = new THREE.Group();
    crown.position.y = 4.5 * scale;
    tree.add(crown);

    // Հիմնական ճյուղեր
    for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2;

        createBranch(
            crown,
            Math.cos(angle) * 0.8 * scale,
            (Math.random() * 2.5 + 0.2) * scale,
            Math.sin(angle) * 0.8 * scale,
            Math.cos(angle) * 0.8,
            Math.sin(angle) * 0.8,
            scale
        );
    }

    // Ծավալուն սաղարթ
    const clusterCount = 13;

    for (let i = 0; i < clusterCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 2.5 * scale;

        const leafX = Math.cos(angle) * radius;
        const leafZ = Math.sin(angle) * radius;
        const leafY = (Math.random() * 4.5 + 0.2) * scale;

        const leafScale = (0.8 + Math.random() * 0.8) * scale;

        const material = leafMaterials[
            Math.floor(Math.random() * leafMaterials.length)
        ];

        createLeafCluster(
            crown,
            leafX,
            leafY,
            leafZ,
            leafScale,
            material
        );
    }

    tree.position.set(x, 0, z);
    tree.scale.setScalar(0.85 + Math.random() * 0.35);

    tree.userData.windPhase = Math.random() * Math.PI * 2;
    tree.userData.windStrength = 0.015 + Math.random() * 0.025;
    tree.userData.crown = crown;

    tree.traverse((object) => {
        if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });

    return tree;
}

// Ստեղծում է անտառը
export function createForestTrees(scene, count = 130) {
    const trees = [];

    for (let i = 0; i < count; i++) {
        const x = (Math.random() - 0.5) * 220;
        const z = (Math.random() - 0.5) * 220;

        // Լճի շուրջը ծառեր չենք դնում
        const lakeDistance = Math.sqrt(
            (x - 22) ** 2 + (z + 12) ** 2
        );

        if (lakeDistance < 25) {
            continue;
        }

        const scale = 0.75 + Math.random() * 0.9;
        const tree = createTree(x, z, scale);

        scene.add(tree);
        trees.push(tree);
    }

    return trees;
}

// Տերևների և ճյուղերի քամու անիմացիա
export function updateForestTrees(trees, elapsed) {
    for (const tree of trees) {
        if (!tree.parent) continue;

        const phase = tree.userData.windPhase;
        const strength = tree.userData.windStrength;

        const wind = Math.sin(elapsed * 1.4 + phase);

        tree.rotation.z = wind * strength;
        tree.rotation.x = Math.cos(elapsed * 1.1 + phase) * strength * 0.5;

        const crown = tree.userData.crown;

        if (crown) {
            crown.rotation.z = Math.sin(elapsed * 2 + phase) * 0.025;
            crown.rotation.x = Math.cos(elapsed * 1.7 + phase) * 0.02;
        }
    }
}
