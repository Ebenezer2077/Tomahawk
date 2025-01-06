import * as THREE from '../99_Lib/three.module.min.js';
import { keyboard, mouse } from './js/interaction2D.mjs';
import { add, createLine, loadGLTFcb, randomMaterial, shaderMaterial } from './js/geometry.mjs';
import { createRay } from './js/ray.mjs';
import * as CANNON from 'https://cdn.jsdelivr.net/npm/cannon-es@0.20.0/dist/cannon-es.js';
import { createAxe } from './js/geometry.mjs';

import { Water } from '../99_Lib/jsm//objects/Water.js';
import { Sky } from '../99_Lib/jsm//objects/Sky.js';


import { VRButton } from '../99_Lib/jsm/webxr/VRButton.js';
import { createVRcontrollers } from './js/vr.mjs';

window.onload = async function () {

    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.3, 2);

    const scene = new THREE.Scene();
    const world = new THREE.Group();
    world.matrixAutoUpdate = false;
    scene.add(world);

    scene.background = new THREE.Color(0x666666);

    const hemiLight = new THREE.HemisphereLight();
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 3);
    dirLight.position.set(5, 5, 5);
    dirLight.castShadow = true;
    dirLight.shadow.camera.zoom = 2;
    scene.add(dirLight);

    //new//
    const Physicsworld = new CANNON.World();
    Physicsworld.gravity.set(0,-9.81, 0);

    const defaultMaterial = new CANNON.Material("default");
    const groundMaterial = new CANNON.Material("ground"); // Material for the ground with high friction

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
    //end//


    //////////////////////////////////////////////////////////////////////////////
    // FLOOR
    // const floorMaterial = await shaderMaterial("./shaders/floorVertexShader.glsl", "./shaders/floorFragmentShader.glsl")

    /*
    const width = 0.1;
    const box = new THREE.BoxGeometry(10, width, 10, 10, 1, 10);
    const floor = new THREE.Mesh(box, randomMaterial());
    floor.position.y = -1;
    floor.receiveShadow = true;
    floor.name = "floor";

    const wireframe = new THREE.WireframeGeometry(box);
    const line = new THREE.LineSegments(wireframe);
    line.material.opacity = 0.25;
    line.material.transparent = true;
    line.position.y = floor.position.y;
    scene.add(line);

    scene.add(floor);
    */

    

    const cursor = add(1, scene);
    const isMouseButton = mouse(cursor);

    let objects = [];
    let axe = add(0, world, 0.1, 0.2, 0);
    //axe.userData.physics = { mass: 0 };//axe
    //objects.push(axe);//axe




    //test to include axe in physics
    const boxShape = new CANNON.Box(new CANNON.Vec3(0.1, 0.1, 0.1));
    const boxBody = new CANNON.Body({
        mass: 1,          // Masse > 0 macht den Körper dynamisch (beeinflusst durch Schwerkraft)
        shape: boxShape,  // Form des Körpers
    });
    boxBody.position.set(1, 10, 0);
    Physicsworld.addBody(boxBody);

    //                      Visualisierrung                 //
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    /////////WICHTIG!////////
    //Wir müssen die bodys in Objects speichern und updaten, nicht die Meshs!//

    //function crAxe() {
        
        const axeShape = new CANNON.Box(new CANNON.Vec3(0.6, 0.3, 0.6));      
        const axeBody = new CANNON.Body({ mass: 1, shape: axeShape });
        axeBody.addShape(axeShape);
        axeBody.position.set(-1, 10, 0);
        Physicsworld.addBody(axeBody);
        const axeGeometry = axe.geometry;
        const axeMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
        const AXE = new THREE.Mesh(axeGeometry, axeMaterial);
        scene.add(AXE);
        

        
        //return { mesh: block, body: blockBody };

        
        

        //return {mesh: AXE, body: axeBody};
    //}
    //crAxe();
    //test end


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

    //
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

    let grabbedObject, initialGrabbed, distance, inverseHand, inverseWorld;
    const deltaFlyRotation = new THREE.Quaternion();
    const differenceMatrix = new THREE.Matrix4();
    const flySpeedRotationFactor = 0.01;
    const flySpeedTranslationFactor = -0.02;
    const euler = new THREE.Euler();



    // Renderer-Loop starten
    function render() {

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
                console.log(firstObjectHitByRay.object.name, firstObjectHitByRay.distance);
                distance = firstObjectHitByRay.distance;
            } else {
                distance = maxDistance;
            }
            endRay.addVectors(position, direction.multiplyScalar(distance));
            lineFunc(1, endRay);
        }


        if (grabbed) {
            if (grabbedObject) {
                endRay.addVectors(position, direction.multiplyScalar(distance));
                lineFunc(1, endRay);
                if (grabbedObject === world) {
                    world.matrix.copy(cursor.matrix.clone().multiply(initialGrabbed));
                } else {
                    grabbedObject.matrix.copy(inverseWorld.clone().multiply(cursor.matrix).multiply(initialGrabbed));
                }
            } else if (firstObjectHitByRay) {
                grabbedObject = firstObjectHitByRay.object;
                inverseWorld = world.matrix.clone().invert();
                initialGrabbed = cursor.matrix.clone().invert().multiply(world.matrix).multiply(grabbedObject.matrix);
            } else {
                grabbedObject = world;
                initialGrabbed = cursor.matrix.clone().invert().multiply(world.matrix);
            }
        } else {
            grabbedObject = undefined;
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

        //myshit
        //new
        axeBody.mass = 0;
        axeBody.position = position.add(new THREE.Vector3(0,0,-0.8));  //WORKS!
        console.log(position);
        //end

        let AxeQuat = new THREE.Quaternion();
        AxeQuat.setFromRotationMatrix(cursor.matrix);
        const rotationQuatX = new THREE.Quaternion();
        rotationQuatX.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        AxeQuat.multiply(rotationQuatX);

        const rotationQuatY = new THREE.Quaternion();
        rotationQuatY.setFromAxisAngle(new THREE.Vector3(0, -1, 0), Math.PI / 2);
        AxeQuat.multiply(rotationQuatY);

        AXE.setRotationFromQuaternion(AxeQuat);

        axeBody.quaternion.copy(AxeQuat);
        Physicsworld.step(1/60);
        mesh.position.set(boxBody.position.x, boxBody.position.y, boxBody.position.z);
        AXE.position.set(axeBody.position.x, axeBody.position.y, axeBody.position.z);

        //vielleicht das bisherige Grap verwenden?
        //LASS DAS SEIN! MACH ES ÜBER DAS NORMALE GRABBEN!!!



        renderer.render(scene, camera);


    }
    renderer.setAnimationLoop(render);
};


/*
- Laden von Objekten
- 


*/