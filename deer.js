
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x95623d,
    roughness: 0.95
});

const darkMaterial = new THREE.MeshStandardMaterial({
    color: 0x493021,
    roughness: 1
});

const bellyMaterial = new THREE.MeshStandardMaterial({
    color: 0xd9c5a4,
    roughness: 1
});

const antlerMaterial = new THREE.MeshStandardMaterial({
    color: 0x6a4a32,
    roughness: 0.9
});

const eyeMaterial = new THREE.MeshStandardMaterial({
    color: 0x100c08,
    roughness: 0.2
});

function addBox(parent, width, height, depth, material, position) {
    const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        material
    );

    mesh.position.set(position.x, position.y, position.z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    parent.add(mesh);

    return mesh;
}

function addAntler(deer, side) {
    const antler = new THREE.Group();

    const main = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.045, 0.65, 8),
        antlerMaterial
    );

    main.position.y = 0.32;
    main.rotation.z = side * -0.18;
    antler.add(main);

    const branchPositions = [
        { x: side * 0.12, y: 0.35, length: 0.32 },
        { x: side * 0.17, y: 0.55, length: 0.26 },
        { x: side * 0.09, y: 0.73, length: 0.2 }
    ];

    for (const branchData of branchPositions) {
        const branch = new THREE.Mesh(
            new THREE.CylinderGeometry(0.018, 0.027, branchData.length, 7),
            antlerMaterial
        );

        branch.position.set(
            branchData.x,
            branchData.y,
            0
        );

        branch.rotation.z = side * 0.7;
        antler.add(branch);
    }

    antler.position.set(side * 0.13, 2.12, -0.65);
    deer.add(antler);
}

function createOneDeer(x, z) {
    const deer = new THREE.Group();

    // Body
    const body = new THREE.Mesh(
        new THREE.SphereGeometry(0.55, 18, 14),
        bodyMaterial
    );

    body.scale.set(0.85, 0.78, 1.35);
    body.position.set(0, 1.05, 0);
    body.castShadow = true;
    deer.add(body);

    // Belly
    const belly = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 14, 10),
        bellyMaterial
    );

    belly.scale.set(0.8, 0.32, 1.15);
    belly.position.set(0, 0.75, 0.05);
    deer.add(belly);

    // Neck
    const neck = new THREE.Mesh(
        new THREE.CylinderGeometry(0.19, 0.28, 0.82, 12),
        bodyMaterial
    );

    neck.position.set(0, 1.55, -0.48);
    neck.rotation.x = -0.35;
    neck.castShadow = true;
    deer.add(neck);

    // Head
    const head = new THREE.Mesh(
        new THREE.SphereGeometry(0.25, 16, 12),
        bodyMaterial
    );

    head.scale.set(0.85, 0.9, 1.25);
    head.position.set(0, 1.94, -0.73);
    head.castShadow = true;
    deer.add(head);

    // Muzzle
    const muzzle = new THREE.Mesh(
        new THREE.SphereGeometry(0.13, 12, 8),
        bellyMaterial
    );

    muzzle.scale.set(0.85, 0.65, 1.2);
    muzzle.position.set(0, 1.83, -0.98);
    deer.add(muzzle);

    // Nose
    const nose = new THREE.Mesh(
        new THREE.SphereGeometry(0.07, 10, 8),
        darkMaterial
    );

    nose.position.set(0, 1.86, -1.11);
    deer.add(nose);

    // Eyes
    for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(
            new THREE.SphereGeometry(0.045, 10, 8),
            eyeMaterial
        );

        eye.position.set(side * 0.2, 2.0, -0.84);
        deer.add(eye);

        // Ears
        const ear = new THREE.Mesh(
            new THREE.SphereGeometry(0.13, 10, 8),
            bodyMaterial
        );

        ear.scale.set(0.45, 0.65, 1.4);
        ear.position.set(side * 0.28, 2.08, -0.61);
        ear.rotation.z = side * -0.5;
        deer.add(ear);
    }

    // Antlers
    addAntler(deer, -1);
    addAntler(deer, 1);

    // Tail
    const tail = new THREE.Mesh(
        new THREE.SphereGeometry(0.14, 10, 8),
        bellyMaterial
    );

    tail.scale.set(0.7, 0.8, 1.3);
    tail.position.set(0, 1.2, 0.7);
    deer.add(tail);

    // Legs
    const legs = [];

    for (let i = 0; i < 4; i++) {
        const legGroup = new THREE.Group();

        const upperLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.075, 0.055, 0.42, 8),
            bodyMaterial
        );

        upperLeg.position.y = -0.2;
        legGroup.add(upperLeg);

        const lowerLeg = new THREE.Mesh(
            new THREE.CylinderGeometry(0.045, 0.035, 0.4, 8),
            darkMaterial
        );

        lowerLeg.position.y = -0.59;
        legGroup.add(lowerLeg);

        const hoof = new THREE.Mesh(
            new THREE.BoxGeometry(0.11, 0.11, 0.15),
            darkMaterial
        );

        hoof.position.set(0, -0.83, -0.02);
        legGroup.add(hoof);

        legGroup.position.set(
            i < 2 ? -0.2 : 0.2,
            0.78,
            i % 2 === 0 ? -0.42 : 0.42
        );

        deer.add(legGroup);
        legs.push(legGroup);
    }

    deer.position.set(x, 0, z);

    deer.traverse(object => {
        if (object.isMesh) {
            object.castShadow = true;
            object.receiveShadow = true;
        }
    });

    return {
        object: deer,
        legs,
        direction: Math.random() * Math.PI * 2,
        timer: Math.random() * 4,
        speed: 0.65 + Math.random() * 0.45,
        phase: Math.random() * 10,
        moving: true
    };
}

export function createDeer(scene, count = 9) {
    const deerList = [];

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 28 + Math.random() * 65;

        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;

        const deer = createOneDeer(x, z);

        scene.add(deer.object);
        deerList.push(deer);
    }

    return deerList;
}

export function updateDeer(deerList, delta, playerPosition) {
    for (const deer of deerList) {
        deer.timer -= delta;
        deer.phase += delta * 6;

        const distance = deer.object.position.distanceTo(playerPosition);

        if (distance < 13) {
            const away = new THREE.Vector3()
                .subVectors(deer.object.position, playerPosition)
                .normalize();

            deer.direction = Math.atan2(away.x, away.z);
            deer.moving = true;
        } else if (deer.timer <= 0) {
            deer.timer = 2 + Math.random() * 5;
            deer.direction += (Math.random() - 0.5) * 1.5;
            deer.moving = Math.random() > 0.25;
        }

        if (deer.moving) {
            deer.object.position.x +=
                Math.sin(deer.direction) * deer.speed * delta;

            deer.object.position.z +=
                Math.cos(deer.direction) * deer.speed * delta;

            deer.object.rotation.y = deer.direction + Math.PI;

            const step = Math.sin(deer.phase) * 0.45;

            deer.legs[0].rotation.x = step;
            deer.legs[1].rotation.x = -step;
            deer.legs[2].rotation.x = -step;
            deer.legs[3].rotation.x = step;
        } else {
            for (const leg of deer.legs) {
                leg.rotation.x = 0;
            }
        }
    }
}
