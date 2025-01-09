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
    objects.push(axe);//axe


    

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


        
        const axeShape = new CANNON.Box(new CANNON.Vec3(0.3, 0.6, 0.1));      
        const axeBody = new CANNON.Body({ mass: 1, shape: axeShape });
        //axeBody.addShape(axeShape);
        axeBody.position.set(0, 10, 0);
        Physicsworld.addBody(axeBody);

        //const axeGeometry = axe.geometry;
        //const axeMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
        //const AXE = new THREE.Mesh(axeGeometry, axeMaterial);

        //AXE.name = "test";
        //scene.add(AXE);

        //let AxeWrapper = { body: axeBody, mesh: AXE};
        
        //objects.push(AxeWrapper.mesh);//warum auch immer das so gemacht werden muss...



    //function to execute matrix on Cannon body//
    function applyMatrixToBody(body, matrix) {
        // Extrahiere die Position aus der Matrix
        const position = new THREE.Vector3();
        matrix.decompose(position, new THREE.Quaternion(), new THREE.Vector3());
    
        // Extrahiere die Rotation (Quaternion) aus der Matrix
        const quaternion = new THREE.Quaternion();
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
                    //change begin
                    //applyMatrixToBody(axeBody, inverseWorld.clone().multiply(cursor.matrix).multiply(initialGrabbed));
                    //applyMatrixToBody(axeBody, grabbedObject.matrix);
                    axeBody.mass = 0;
                    axeBody.updateMassProperties();
                    //change end
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
            axeBody.mass = 1;
            axeBody.updateMassProperties();

            
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
 
        Physicsworld.step(1/60);
        mesh.position.set(boxBody.position.x, boxBody.position.y, boxBody.position.z);
        //console.log("Mesh height = " + axe.position.y);
        //console.log("BodyHeight = " + axeBody.position.y);
        
        axe.position.set(axeBody.position.x, axeBody.position.y, axeBody.position.z);
        axe.quaternion.set(axeBody.quaternion.x, axeBody.quaternion.y, axeBody.quaternion.z, axeBody.quaternion.w);
        console.log(axe.position.y);

        
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