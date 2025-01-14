import * as THREE from '../../99_Lib/three.module.min.js';

import { mergeGeometries } from '../../99_Lib/jsm/utils/BufferGeometryUtils.js';


export async function shaderMaterial(vertexShaderFile, fragmentShaderFile) {
    const vertexShader = await httpGetAsync(vertexShaderFile);
    const fragmentShader = await httpGetAsync(fragmentShaderFile);

    const material = new THREE.ShaderMaterial({
        uniforms: { 'thickness': { value: 1 } },
        vertexShader,
        fragmentShader,
        side: THREE.DoubleSide,
        alphaToCoverage: true, // only works when WebGLRenderer's "antialias" is set to "true"
        vertexShader,
        fragmentShader
    });

    return material;
}

console.log("ThreeJs " + THREE.REVISION);

const geometries = [
    createAxe(),
    new THREE.BoxGeometry(0.25, 0.25, 0.25),
    new THREE.ConeGeometry(0.1, 0.4, 64),
    new THREE.CylinderGeometry(0.01, 0.01, 0.7, 64),
    new THREE.IcosahedronGeometry(0.1, 3),
    new THREE.TorusKnotGeometry(.2, .03, 50, 16),
    new THREE.TorusGeometry(0.2, 0.04, 64, 32),
    new THREE.CapsuleGeometry(0.1, 0.3, 8, 16)

];

export function createAxe() {
        const AxeHandle = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 64);
        //  linksrechts     hochrunter      vorzurück
        AxeHandle.translate(0,0.65,0.05);
        const merged = mergeGeometries([AxeHandle.toNonIndexed(), createAxeHead()]);
        return merged;
}

function createAxeHead() {
    const shape = new THREE.Shape();
    shape.moveTo(0,0);
    shape.lineTo(0,0);
    shape.lineTo(0,0.1);
    shape.lineTo(0.3,0.05);
    shape.lineTo(0,0);

    const extrudeSettings = {
        steps: 2,
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelOffset: 0,
        bevelSegments: 1
    };

    const Extr = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    Extr.translate(0,0,0);
    Extr.rotateX(Math.PI/2);
    return Extr;
}

export function randomMaterial() {
    return new THREE.MeshStandardMaterial({
        color: Math.random() * 0xff3333,
        roughness: 0.2,
        metalness: 0.4
    });
}

export function add(i, parent, x = 0, y = 0, z = 0) {
    let object = new THREE.Mesh(geometries[i], randomMaterial());
    object.position.set(x, y, z);
    object.updateMatrix();
    object.castShadow = true;
    object.name = `o_${i}`;
    object.matrixAutoUpdate = false;
    parent.add(object);
    return object;
}


export function createLine(scene) {
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const points = [];
    points.push(new THREE.Vector3(0, 0, 0));
    points.push(new THREE.Vector3(0, 1, 0));
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const line = new THREE.Line(geometry, material);
    scene.add(line);

    const position = line.geometry.attributes.position.array;

    return (idx, pos) => {
        idx *= 3;
        position[idx++] = pos.x;
        position[idx++] = pos.y;
        position[idx++] = pos.z;
        line.geometry.attributes.position.needsUpdate = true;
    }
}
