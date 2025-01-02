import { mergeGeometries } from '../../99_Lib/jsm/utils/BufferGeometryUtils.js';
import * as THREE from '../../99_Lib/three.module.min.js';

const geometries = [
    //createAxeHead(),
    createAxe(),
    new THREE.BoxGeometry(0.25, 0.25, 0.25),
    new THREE.ConeGeometry(0.1, 0.4, 64),
    new THREE.CylinderGeometry(0.01, 0.01, 0.7, 64),
    new THREE.IcosahedronGeometry(0.1, 3),
    new THREE.TorusKnotGeometry(.2, .03, 50, 16),
    new THREE.TorusGeometry(0.2, 0.04, 64, 32),
    new THREE.CapsuleGeometry(0.1, 0.3, 8, 16)
];

function randomMaterial() {
    return new THREE.MeshStandardMaterial({
        color: Math.random() * 0xff3333,
        roughness: 0.2,
        metalness: 0.4
    });
}

export function add(i, parent, x = 0, y = 0, z = 0) {
    let object = new THREE.Mesh(geometries[i], randomMaterial());
    object.position.set(x, y, z);
    parent.add(object);
    return object;
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

function createAxe() {
    const AxeHandle = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 64);
    //  linksrechts     hochrunter      vorzurück
    AxeHandle.translate(0,0.65,0.05);

    const AxeHead = new THREE.BoxGeometry(0.25, 0.25, 0.05);
    AxeHead.translate(0.1,0.6,0);
    

    const merged = mergeGeometries([AxeHandle.toNonIndexed(), createAxeHead()])
    
    return merged;
    
    
}
