
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

export function createOpelAstra(scene) {
    const car = new THREE.Group();
    const body = new THREE.Group();
    car.add(body);

    const paint = new THREE.MeshStandardMaterial({
        color: 0x243d55,
        metalness: 0.72,
        roughness: 0.27
    });

    const glass = new THREE.MeshPhysicalMaterial({
        color: 0x172b38,
        metalness: 0.2,
        roughness: 0.12,
        transparent: true,
        opacity: 0.83
    });

    const black = new THREE.MeshStandardMaterial({
        color: 0x151719,
        roughness: 0.85
    });

    const chrome = new THREE.MeshStandardMaterial({
        color: 0xb8c2c8,
        metalness: 0.9,
        roughness: 0.2
    });

    const rubber = new THREE.MeshStandardMaterial({
        color: 0x111111,
        roughness: 1
    });

    const headlightMaterial = new THREE.MeshStandardMaterial({
        color: 0xfff0c9,
        emissive: 0xffd58a,
        emissiveIntensity: 1.2
    });

    const rearLightMaterial = new THREE.MeshStandardMaterial({
        color: 0xb50012,
        emissive: 0x9d0010,
        emissiveIntensity: 0.8
    });

    function box(parent, w, h, d, material, x, y, z) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            material
        );

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    }

    // Main body
    box(body, 2.05, 0.58, 4.25, paint, 0, 0.85, 0);

    // Hood
    box(body, 1.98, 0.22, 1.05, paint, 0, 1.17, -1.45);

    // Rear trunk
    box(body, 1.98, 0.25, 0.8, paint, 0, 1.15, 1.65);

    // Cabin
    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.83, 2.05),
        paint
    );

    cabin.position.set(0, 1.57, 0.05);
    cabin.castShadow = true;
    body.add(cabin);

    // Roof
    box(body, 1.65, 0.12, 1.65, paint, 0, 2.02, 0.05);

    // Front windshield
    const windshield = box(
        body, 1.55, 0.65, 0.035, glass, 0, 1.64, -0.94
    );
    windshield.rotation.x = -0.22;

    // Rear window
    const rearWindow = box(
        body, 1.52, 0.58, 0.035, glass, 0, 1.65, 1.05
    );
    rearWindow.rotation.x = 0.22;

    // Side windows
    for (const side of [-1, 1]) {
        box(body, 0.035, 0.55, 0.8, glass, side * 0.87, 1.66, -0.42);
        box(body, 0.035, 0.55, 0.75, glass, side * 0.87, 1.66, 0.48);

        // Mirrors
        box(body, 0.22, 0.12, 0.18, black, side * 1.12, 1.48, -0.72);

        // Door handles
        box(body, 0.045, 0.045, 0.2, chrome, side * 1.04, 1.05, -0.1);
        box(body, 0.045, 0.045, 0.2, chrome, side * 1.04, 1.05, 0.8);
    }

    // Bumpers
    box(body, 2.08, 0.22, 0.25, black, 0, 0.64, -2.12);
    box(body, 2.08, 0.22, 0.25, black, 0, 0.64, 2.12);

    // Front grille
    box(body, 0.75, 0.18, 0.04, black, 0, 0.91, -2.15);

    // Opel-style circular badge
    const badge = new THREE.Mesh(
        new THREE.TorusGeometry(0.12, 0.025, 8, 24),
        chrome
    );

    badge.position.set(0, 1.08, -2.18);
    body.add(badge);

    box(body, 0.28, 0.035, 0.035, chrome, 0, 1.08, -2.2);

    // Headlights and rear lights
    for (const side of [-1, 1]) {
        box(body, 0.5, 0.19, 0.07, headlightMaterial, side * 0.68, 1.05, -2.16);
        box(body, 0.42, 0.22, 0.07, rearLightMaterial, side * 0.72, 1.03, 2.16);
    }

    // Wheels
    const wheels = [];

    for (const x of [-1.02, 1.02]) {
        for (const z of [-1.38, 1.38]) {
            const wheel = new THREE.Group();

            const tire = new THREE.Mesh(
                new THREE.CylinderGeometry(0.43, 0.43, 0.24, 32),
                rubber
            );

            tire.rotation.z = Math.PI / 2;
            wheel.add(tire);

            const rim = new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.25, 0.255, 24),
                chrome
            );

            rim.rotation.z = Math.PI / 2;
            wheel.add(rim);

            const center = new THREE.Mesh(
                new THREE.CylinderGeometry(0.09, 0.09, 0.27, 16),
                black
            );

            center.rotation.z = Math.PI / 2;
            wheel.add(center);

            wheel.position.set(x, 0.48, z);
            body.add(wheel);
            wheels.push(wheel);
        }
    }

    // Exhaust
    const exhaust = new THREE.Mesh(
        new THREE.CylinderGeometry(0.055, 0.055, 0.25, 12),
        chrome
    );

    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(0.65, 0.55, 2.15);
    body.add(exhaust);

    // Headlight beams
    const headlights = [];

    for (const side of [-1, 1]) {
        const light = new THREE.SpotLight(
            0xffe8bb,
            0,
            32,
            Math.PI / 7,
            0.45,
            1.5
        );

        light.position.set(side * 0.68, 1.05, -2.1);
        light.target.position.set(side * 0.68, 0.3, -18);

        car.add(light);
        car.add(light.target);
        headlights.push(light);
    }

    car.position.set(0, 0, 15);
    scene.add(car);

    return {
        object: car,
        wheels,
        headlights,
        speed: 0,
        steering: 0,
        driving: false,
        maxSpeed: 24,
        acceleration: 13,
        brake: 20
    };
}

export function isNearCar(car, position) {
    return car.object.position.distanceTo(
        new THREE.Vector3(position.x, 0, position.z)
    ) < 4.5;
}

export function enterCar(car) {
    car.driving = true;
    car.speed = 0;
}

export function exitCar(car) {
    car.driving = false;
    car.speed = 0;
}

export function updateCar(car, delta, keys, camera) {
    if (!car.driving) return;

    const accelerating = keys["KeyW"];
    const reversing = keys["KeyS"];

    if (accelerating) {
        car.speed += car.acceleration * delta;
    } else if (reversing) {
        car.speed -= car.brake * delta;
    } else {
        car.speed *= Math.pow(0.94, delta * 60);
    }

    car.speed = THREE.MathUtils.clamp(
        car.speed,
        -8,
        car.maxSpeed
    );

    const steeringInput =
        (keys["KeyA"] ? 1 : 0) -
        (keys["KeyD"] ? 1 : 0);

    car.steering = THREE.MathUtils.damp(
        car.steering,
        steeringInput,
        5,
        delta
    );

    const speedFactor = Math.min(Math.abs(car.speed) / 8, 1);

    car.object.rotation.y +=
        car.steering * speedFactor * delta * 0.9 *
        Math.sign(car.speed || 1);

    const forward = new THREE.Vector3(
        -Math.sin(car.object.rotation.y),
        0,
        -Math.cos(car.object.rotation.y)
    );

    car.object.position.addScaledVector(
        forward,
        car.speed * delta
    );

    car.object.position.x = THREE.MathUtils.clamp(
        car.object.position.x, -100, 100
    );

    car.object.position.z = THREE.MathUtils.clamp(
        car.object.position.z, -100, 100
    );

    for (const wheel of car.wheels) {
        wheel.rotation.x -= car.speed * delta * 1.8;
    }

    for (const light of car.headlights) {
        light.intensity = 2.5;
    }

    // Third-person follow camera
    const behind = new THREE.Vector3(
        Math.sin(car.object.rotation.y) * 8,
        4.2,
        Math.cos(car.object.rotation.y) * 8
    );

    const target = car.object.position.clone();
    target.y += 1.3;

    camera.position.lerp(
        target.clone().add(behind),
        1 - Math.exp(-4 * delta)
    );

    camera.lookAt(target);
}
