
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js";

export function createWorld(scene) {
    // Sunset sky
    const sky = new THREE.Mesh(
        new THREE.SphereGeometry(500, 32, 24),
        new THREE.ShaderMaterial({
            side: THREE.BackSide,
            uniforms: {
                topColor: { value: new THREE.Color(0x26385f) },
                middleColor: { value: new THREE.Color(0xe58a59) },
                bottomColor: { value: new THREE.Color(0xf5c18a) },
                offset: { value: 20 },
                exponent: { value: 0.65 }
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
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;

                void main() {
                    float h = normalize(vWorldPosition + vec3(0.0, offset, 0.0)).y;
                    float blend1 = smoothstep(-0.25, 0.25, h);
                    float blend2 = smoothstep(0.0, 0.75, h);
                    vec3 low = mix(bottomColor, middleColor, blend1);
                    vec3 col = mix(low, topColor, blend2);
                    gl_FragColor = vec4(col, 1.0);
                }
            `
        })
    );

    scene.add(sky);

    // Sunset sun
    const sun = new THREE.Mesh(
        new THREE.SphereGeometry(5, 32, 32),
        new THREE.MeshBasicMaterial({ color: 0xffc078 })
    );

    sun.position.set(-65, 32, -115);
    scene.add(sun);

    // Sun glow
    const glow = new THREE.Mesh(
        new THREE.SphereGeometry(8, 32, 32),
        new THREE.MeshBasicMaterial({
            color: 0xff9a55,
            transparent: true,
            opacity: 0.18,
            depthWrite: false
        })
    );

    glow.position.copy(sun.position);
    scene.add(glow);

    // Sunset lighting
    const sunsetLight = new THREE.DirectionalLight(0xffb477, 2.5);
    sunsetLight.position.copy(sun.position);
    sunsetLight.castShadow = true;
    sunsetLight.shadow.mapSize.set(2048, 2048);
    sunsetLight.shadow.camera.left = -90;
    sunsetLight.shadow.camera.right = 90;
    sunsetLight.shadow.camera.top = 90;
    sunsetLight.shadow.camera.bottom = -90;
    scene.add(sunsetLight);

    const ambient = new THREE.HemisphereLight(
        0xffd5b0,
        0x26382b,
        1.3
    );
    scene.add(ambient);

    // Distant mountains
    const mountainMaterial = new THREE.MeshStandardMaterial({
        color: 0x4c514c,
        roughness: 1,
        flatShading: true
    });

    for (let i = 0; i < 18; i++) {
        const height = 18 + Math.random() * 28;
        const mountain = new THREE.Mesh(
            new THREE.ConeGeometry(
                18 + Math.random() * 15,
                height,
                5 + Math.floor(Math.random() * 3)
            ),
            mountainMaterial
        );

        mountain.position.set(
            -110 + i * 13,
            height / 2 - 3,
            -125 - Math.random() * 20
        );

        mountain.rotation.y = Math.random() * Math.PI;
        scene.add(mountain);
    }

    // Lake shore
    const lakeCenter = new THREE.Vector3(18, 0, -5);

    const shore = new THREE.Mesh(
        new THREE.CircleGeometry(1, 96),
        new THREE.MeshStandardMaterial({
            color: 0x9a8867,
            roughness: 1
        })
    );

    shore.rotation.x = -Math.PI / 2;
    shore.scale.set(15, 9, 1);
    shore.position.set(18, 0.025, -5);
    scene.add(shore);

    // Lake water
    const water = new THREE.Mesh(
        new THREE.CircleGeometry(1, 128),
        new THREE.MeshPhysicalMaterial({
            color: 0x276d79,
            roughness: 0.16,
            metalness: 0.25,
            transparent: true,
            opacity: 0.91,
            clearcoat: 1,
            clearcoatRoughness: 0.08
        })
    );

    water.rotation.x = -Math.PI / 2;
    water.scale.set(12.8, 7.2, 1);
    water.position.set(18, 0.08, -5);
    scene.add(water);

    // Water ripples
    const ripples = [];

    const rippleMaterial = new THREE.MeshBasicMaterial({
        color: 0xc4d9d2,
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide
    });

    for (let i = 0; i < 18; i++) {
        const ripple = new THREE.Mesh(
            new THREE.RingGeometry(0.2, 0.24, 32),
            rippleMaterial.clone()
        );

        ripple.rotation.x = -Math.PI / 2;
        ripple.position.set(
            18 + (Math.random() - 0.5) * 20,
            0.105,
            -5 + (Math.random() - 0.5) * 10
        );

        ripple.userData.phase = Math.random() * Math.PI * 2;
        scene.add(ripple);
        ripples.push(ripple);
    }

    // Shore stones
    const stoneMaterial = new THREE.MeshStandardMaterial({
        color: 0x77766d,
        roughness: 1
    });

    for (let i = 0; i < 90; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 13.5 + Math.random() * 2;

        const stone = new THREE.Mesh(
            new THREE.DodecahedronGeometry(
                0.12 + Math.random() * 0.32,
                1
            ),
            stoneMaterial
        );

        stone.position.set(
            18 + Math.cos(angle) * radius,
            0.12,
            -5 + Math.sin(angle) * radius * 0.58
        );

        stone.scale.y = 0.6;
        stone.rotation.set(Math.random(), Math.random(), Math.random());
        stone.castShadow = true;
        scene.add(stone);
    }

    function update(time) {
        for (const ripple of ripples) {
            const phase = time * 0.7 + ripple.userData.phase;
            const scale = 0.7 + (Math.sin(phase) + 1) * 0.45;

            ripple.scale.set(scale, scale, scale);
            ripple.material.opacity =
                0.08 + (Math.sin(phase) + 1) * 0.08;
        }
    }

    return {
        update,
        lakeCenter
    };
}
