import * as THREE from '../99_Lib/three.module.min.js';
import { keyboard, mouse } from './js/interaction2D.mjs';
import { add, createLine } from './js/geometry.mjs';
import { createRay } from './js/ray.mjs';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';
import { VRButton } from '../99_Lib/jsm/webxr/VRButton.js';
import { createVRcontrollers } from './js/vr.mjs';

window.onload = async function () {

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.3, 2);

    const scene = new THREE.Scene();
    const world = new THREE.Group();
    world.matrixAutoUpdate = true;
    scene.add(world);

    scene.background = new THREE.Color(0x666666);

    const hemiLight = new THREE.HemisphereLight();
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    dirLight.shadow.camera.zoom = 2;
    scene.add(dirLight);

    const Physicsworld = new CANNON.World();
    Physicsworld.gravity.set(0,-9.81, 0);

    const defaultMaterial = new CANNON.Material("default");
    const groundMaterial = new CANNON.Material("ground"); 

    const contactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
        friction: 1.2, // Increased friction to minimize sliding
        restitution: 0.01, // Very low bounciness
    });
    Physicsworld.addContactMaterial(contactMaterial);

    const groundContactMaterial = new CANNON.ContactMaterial(defaultMaterial, groundMaterial, {
        friction: 1.2, // Increased friction between blocks and ground
        restitution: 0.01, // Very low bounciness
    });
    Physicsworld.addContactMaterial(groundContactMaterial);

    // Ground
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0, material: groundMaterial });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    Physicsworld.addBody(groundBody);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshStandardMaterial({ color: 0x808080 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    const cursor = add(1, scene);
    const isMouseButton = mouse(cursor);

    let objects = [];
    let axe = add(0, world, 0.1, 0.2, 0);
    axe.name = "axe";
    objects.push(axe);

    const boxShape = new CANNON.Box(new CANNON.Vec3(0.1, 0.1, 0.1));
    const boxBody = new CANNON.Body({
        mass: 1,
        shape: boxShape,
    });
    boxBody.position.set(1, 1, 0);
    Physicsworld.addBody(boxBody);
         
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    objects.push(mesh);
    scene.add(mesh);

    const axeShape = new CANNON.Box(new CANNON.Vec3(0.3, 0.6, 0.1));      
    const axeBody = new CANNON.Body({ mass: 1, shape: axeShape });

    axeBody.position.set(-1, 10, 0);
    Physicsworld.addBody(axeBody);

    const axeGeometry = axe.geometry;
    const axeMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
    const AXE = new THREE.Mesh(axeGeometry, axeMaterial);

    objects.push(AXE);

    scene.add(AXE);

    let ready4Impulse = false;
        
    const targetShape = new CANNON.Cylinder(1,1,0.5,20);
    const TargetBody = new CANNON.Body({ mass: 0, shape: targetShape});

    let rotationQuat = new CANNON.Quaternion();
    rotationQuat.setFromAxisAngle(new CANNON.Vec3(1,0,0), Math.PI/2);
    TargetBody.quaternion.copy(rotationQuat);

    TargetBody.position.set(0, 1.5, -2.5);
    Physicsworld.addBody(TargetBody);
    const TargetGeometry = new THREE.CylinderGeometry(1,1,0.5,20);
    const TargetMaterial = new THREE.MeshStandardMaterial({ color: 0x8c7a2b });
    const TARGET = new THREE.Mesh(TargetGeometry, TargetMaterial);
    TARGET.rotateX(Math.PI/2);
    scene.add(TARGET);

    let IsInTarget = false;
    TargetBody.addEventListener('collide', (event) => {
        axeBody.mass = 0;
        axeBody.updateMassProperties();
        let stationary = new CANNON.Vec3(0,0,0);
        axeBody.velocity.copy(stationary);
        axeBody.angularVelocity.copy(stationary);
        IsInTarget = true;
    });

    function applyMatrixToBody(body, matrix) {
        // Extrahiere die Position aus der Matrix
        const position = new THREE.Vector3();
        matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3());
    
        // Extrahiere die Rotation (Quaternion) aus der Matrix
        let quaternion = new THREE.Quaternion();
        matrix.decompose(new THREE.Vector3(), quaternion, new THREE.Vector3());
    
        // Setze die Position des CANNON.Body
        body.position.set(position.x, position.y, position.z);
    
        // Setze die Rotation des CANNON.Body
        body.quaternion.set(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
    }
    
    const lineFunc = createLine(scene);
    const rayFunc = createRay(objects);

    let position = new THREE.Vector3();
    let rotation = new THREE.Quaternion();
    let scale = new THREE.Vector3();
    let endRay = new THREE.Vector3();
    let direction = new THREE.Vector3();

    // Renderer erstellen
    const renderer = new THREE.WebGLRenderer({
        antialias: true,
    });

    // Renderer-Parameter setzen
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(VRButton.createButton(renderer));

    let last_active_controller;
    createVRcontrollers(scene, renderer, (controller, data, id) => {
        cursor.matrixAutoUpdate = false;
        cursor.visible = false;
        last_active_controller = controller;
        renderer.xr.enabled = true;
        console.log("verbinde", id, data.handedness)
    });


    const addKey = keyboard();
    addKey("Escape", active => {
        console.log("Escape", active);
    });

    let grabbed = false, squeezed = false;
    addKey(" ", active => {
        console.log("Space: Grabbed", active);
        grabbed = active;
    });

    addKey("s", active => {
        console.log("S: Squeeze", active);
        squeezed = active;
    });

    addKey("f", active => {
        if (active) {
            console.log("F: toggle floor", active, floor.visible);
            floor.visible = !floor.visible;
        }
    });

    addKey("r", active => {
        console.log("R: reset world", active, floor.visible);
        world.matrix.identity();
    });


    const maxDistance = 10;
    direction.set(0, 1, 0);
    let impulse;

    function calcImpulse(now, prev) {
        let direct = new CANNON.Vec3();
        now.vsub(prev, direct);
        direct.scale(6, direct);
        return direct;
    }

    let grabbedObject, initialGrabbed, distance, inverseHand, inverseWorld;
    const deltaFlyRotation = new THREE.Quaternion();
    const differenceMatrix = new THREE.Matrix4();
    const flySpeedRotationFactor = 0.01;
    const flySpeedTranslationFactor = -0.02;
    const euler = new THREE.Euler();

    let positions = [];
    function render() {
        //60fps
        if (last_active_controller) {
            cursor.matrix.copy(last_active_controller.matrix);
            squeezed = last_active_controller.userData.isSqueezeing;
            grabbed = last_active_controller.userData.isSelecting;
            direction.set(0, 0, -1);
        } else {
            direction.set(0, 1, 0);
        }

        cursor.matrix.decompose(position, rotation, scale);
        lineFunc(0, position);

        direction.applyQuaternion(rotation);

        

        let firstObjectHitByRay;
        if (grabbedObject === undefined) {
            firstObjectHitByRay = rayFunc(position, direction);
            if (firstObjectHitByRay) {
                distance = firstObjectHitByRay.distance;
            } else {
                distance = maxDistance;
            }
            endRay.addVectors(position, direction.multiplyScalar(distance));
            lineFunc(1, endRay);
        }

        if (grabbed) {
            IsInTarget = false;
            ready4Impulse = true;
            axeBody.mass = 0;
            axeBody.updateMassProperties();
            positions.push(axeBody.position.clone());
            if(positions.length > 11) {
                positions.shift();
            }
            impulse = calcImpulse(axeBody.position.clone(), positions[0]);
            if (grabbedObject) {

                endRay.addVectors(position, direction.multiplyScalar(distance));
                lineFunc(1, endRay);
                if (grabbedObject === world) {
                    world.matrix.copy(cursor.matrix.clone().multiply(initialGrabbed));
                } else {
                    grabbedObject.matrix.copy(inverseWorld.clone().multiply(cursor.matrix).multiply(initialGrabbed));
                    applyMatrixToBody(axeBody, inverseWorld.clone().multiply(cursor.matrix).multiply(initialGrabbed));
                    axeBody.mass = 0;
                    axeBody.updateMassProperties();
                }
            } else if (firstObjectHitByRay) {
                grabbedObject = firstObjectHitByRay.object;
                inverseWorld = world.matrix.clone().invert();
                initialGrabbed = cursor.matrix.clone().invert().multiply(world.matrix).multiply(grabbedObject.matrix);
            } else {
                applyMatrixToBody(axeBody, cursor.matrix);
            }
        } else {
            grabbedObject = undefined;
            if(!IsInTarget) {
                axeBody.mass = 1;
                axeBody.updateMassProperties();
            }
            if(ready4Impulse) {
                axeBody.applyLocalImpulse(impulse, new CANNON.Vec3(0,0,0));
                ready4Impulse = false;
            }
        }

        if (squeezed) {
            lineFunc(1, position);
            if (inverseHand !== undefined) {
                let differenceHand = cursor.matrix.clone().multiply(inverseHand);
                differenceHand.decompose(position, rotation, scale);
                deltaFlyRotation.set(0, 0, 0, 1);
                deltaFlyRotation.slerp(rotation.conjugate(), flySpeedRotationFactor);

                // Beschränkung der Rotation beim Fliegen
                euler.setFromQuaternion(deltaFlyRotation);
                euler.x = 0;
                euler.z = 0;
                deltaFlyRotation.setFromEuler(euler);

                differenceMatrix.compose(position.multiplyScalar(flySpeedTranslationFactor), deltaFlyRotation, scale);
                world.matrix.premultiply(differenceMatrix);
            } else {
                inverseHand = cursor.matrix.clone().invert();
            }
        } else {
            inverseHand = undefined;
        }
 
        Physicsworld.step(1/60);
        mesh.position.set(boxBody.position.x, boxBody.position.y, boxBody.position.z);

        AXE.position.set(axeBody.position.x, axeBody.position.y, axeBody.position.z);
        AXE.quaternion.set(axeBody.quaternion.x, axeBody.quaternion.y, axeBody.quaternion.z, axeBody.quaternion.w);

        TARGET.position.set(TargetBody.position.x, TargetBody.position.y, TargetBody.position.z);
        
        renderer.render(scene, camera);
    }
    renderer.setAnimationLoop(render);
};
