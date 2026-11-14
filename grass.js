
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

export function createGrass(scene, count = 7000) {
    const grassGroup = new THREE.Group();

    const grassColors = [
        0x526d35,
        0x6d8244,
        0x83904e,
        0x405a2e,
        0x91a05b
    ];

    const grassMaterials = grassColors.map(color =>
        new THREE.MeshStandardMaterial({
            color,
            roughness: 1,
            side: THREE.DoubleSide
        })
    );

    const grassGeometry = new THREE.BufferGeometry();

    const vertices = new Float32Array([
        -0.04, 0, 0,
         0.04, 0, 0,
         0.00, 1, 0
    ]);

    grassGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(vertices, 3)
    );

    grassGeometry.setIndex([0, 1, 2]);
    grassGeometry.computeVertexNormals();

    const dummy = new THREE.Object3D();

    for (let materialIndex = 0; materialIndex < grassMaterials.length; materialIndex++) {
        const amount = Math.floor(count / grassMaterials.length);

        const mesh = new THREE.InstancedMesh(
            grassGeometry,
            grassMaterials[materialIndex],
            amount
        );

        mesh.castShadow = false;
        mesh.receiveShadow = true;

        for (let i = 0; i < amount; i++) {
            const x = (Math.random() - 0.5) * 230;
            const z = (Math.random() - 0.5) * 230;

            // Keep the lake area clear.
            if (Math.hypot(x - 22, z + 12) < 20) {
                dummy.position.set(0, -100, 0);
            } else {
                dummy.position.set(x, 0.03, z);
            }

            const height = 0.35 + Math.random() * 0.65;
            const width = 0.5 + Math.random() * 0.8;

            dummy.rotation.set(
                (Math.random() - 0.5) * 0.25,
                Math.random() * Math.PI,
                (Math.random() - 0.5) * 0.3
            );

            dummy.scale.set(width, height, width);
            dummy.updateMatrix();

            mesh.setMatrixAt(i, dummy.matrix);
        }

        mesh.instanceMatrix.needsUpdate = true;
        grassGroup.add(mesh);
    }

    // Small leafy plants
    const bushMaterials = [
        new THREE.MeshStandardMaterial({ color: 0x385b31, roughness: 1 }),
        new THREE.MeshStandardMaterial({ color: 0x55743a, roughness: 1 }),
        new THREE.MeshStandardMaterial({ color: 0x6d8043, roughness: 1 })
    ];

    const bushGeometry = new THREE.IcosahedronGeometry(0.35, 1);

    const bushes = new THREE.Group();

    for (let i = 0; i < 230; i++) {
        const bush = new THREE.Mesh(
            bushGeometry,
            bushMaterials[Math.floor(Math.random() * bushMaterials.length)]
        );

        const x = (Math.random() - 0.5) * 210;
        const z = (Math.random() - 0.5) * 210;

        if (Math.hypot(x - 22, z + 12) < 21) continue;

        bush.position.set(x, 0.25, z);
        bush.scale.set(
            0.8 + Math.random() * 1.2,
            0.5 + Math.random() * 0.6,
            0.8 + Math.random() * 1.2
        );

        bush.castShadow = true;
        bush.receiveShadow = true;

        bushes.add(bush);
    }

    grassGroup.add(bushes);

    // Tiny flowers
    const flowerColors = [
        0xf1d8a0,
        0xd7b5d8,
        0xf0e6d1
    ];

    const flowerGroup = new THREE.Group();

    for (let i = 0; i < 180; i++) {
        const flower = new THREE.Group();

        const stem = new THREE.Mesh(
            new THREE.CylinderGeometry(0.012, 0.018, 0.22, 5),
            new THREE.MeshStandardMaterial({ color: 0x476332 })
        );

        stem.position.y = 0.11;
        flower.add(stem);

        const petals = new THREE.Mesh(
            new THREE.SphereGeometry(0.075, 8, 6),
            new THREE.MeshStandardMaterial({
                color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
                roughness: 0.8
            })
        );

        petals.position.y = 0.24;
        petals.scale.set(1, 0.55, 1);
        flower.add(petals);

        const x = (Math.random() - 0.5) * 190;
        const z = (Math.random() - 0.5) * 190;

        if (Math.hypot(x - 22, z + 12) < 22) continue;

        flower.position.set(x, 0, z);
        flower.rotation.y = Math.random() * Math.PI;

        flowerGroup.add(flower);
    }

    grassGroup.add(flowerGroup);
    scene.add(grassGroup);

    return grassGroup;
}
