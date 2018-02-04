import * as CANNON from "cannon";
import * as THREE from "three";
import OrbitControlsLib = require("three-orbit-controls");
import Vec3 = CANNON.Vec3;
import * as dat from "dat-gui"

let OrbitControls = OrbitControlsLib(THREE);

enum Face {
    Top = "Top",
    Bottom = "Bottom",
    Side = "Side"
}

class WeirdDice {
    cannonShape: CANNON.Cylinder;
    cannonBody: CANNON.Body;
    threeGeometry: THREE.CylinderGeometry;
    threeMaterial: THREE.MeshLambertMaterial;
    threeMesh: THREE.Mesh;
    lastMovementTime: number;
    lastMovementY: number;

    private world: CANNON.World;
    private scene: THREE.Scene;

    constructor(world: CANNON.World, scene: THREE.Scene, radius: number, height: number, mass: number, material: CANNON.Material, position: CANNON.Vec3) {
        this.world = world;
        this.scene = scene;

        this.cannonShape = new CANNON.Cylinder(radius, radius, height, 32);
        this.cannonBody = new CANNON.Body({mass: mass, material: material});
        this.cannonBody.addShape(this.cannonShape);
        this.cannonBody.position = position;

        this.threeGeometry = new THREE.CylinderGeometry(radius, radius, height, 32);
        this.threeMaterial = new THREE.MeshLambertMaterial({color: "lightblue"});
        this.threeMesh = new THREE.Mesh(this.threeGeometry, this.threeMaterial);
        this.threeMesh.castShadow = true;

        this.lastMovementTime = world.time;
        this.lastMovementY = 0;

        this.update();

        world.addBody(this.cannonBody);
        scene.add(this.threeMesh);
    }

    get heading(): THREE.Vector3 {
        let heading = new THREE.Vector3(0, 0, 1);
        let rot = new THREE.Quaternion();
        rot.set(this.cannonBody.quaternion.x, this.cannonBody.quaternion.y, this.cannonBody.quaternion.z, this.cannonBody.quaternion.w);
        heading.applyQuaternion(rot);

        return heading;
    }

    get face(): Face {
        let headingY = this.heading.y;

        if (Math.abs(headingY) < 0.1) {
            return Face.Side
        } else if (headingY > 0) {
            return Face.Top
        } else {
            return Face.Bottom
        }
    }

    rotateRandom() {
        let theta = THREE.Math.randFloat(0, 2 * Math.PI);
        let u = THREE.Math.randFloat(-1, 1);
        let randomDirection = new Vec3(Math.sqrt(1 - u * u) * Math.cos(theta), Math.sqrt(1 - u * u) * Math.sin(theta), u);
        this.cannonBody.quaternion.setFromVectors(new Vec3(0, 0, 1), randomDirection);
    }

    spinRandom(magnitude: number) {
        let theta = THREE.Math.randFloat(0, 2 * Math.PI);
        let u = THREE.Math.randFloat(-1, 1);
        this.cannonBody.angularVelocity = new Vec3(Math.sqrt(1 - u * u) * Math.cos(theta), Math.sqrt(1 - u * u) * Math.sin(theta), u).mult(magnitude);
    }

    velocityRandom(onlyHorizontal: boolean, magnitude: number) {
        let velocityDirection: Vec3;
        if (onlyHorizontal) {
            let phi = THREE.Math.randFloat(0, 2 * Math.PI);
            velocityDirection = new Vec3(Math.cos(phi), 0, Math.sin(phi));
        } else {
            let theta = THREE.Math.randFloat(0, 2 * Math.PI);
            let u = THREE.Math.randFloat(-1, 1);
            velocityDirection = new Vec3(Math.sqrt(1 - u * u) * Math.cos(theta), Math.sqrt(1 - u * u) * Math.sin(theta), u);
        }

        this.cannonBody.velocity = velocityDirection.mult(magnitude);
    }

    update() {
        this.threeMesh.position.x = this.cannonBody.position.x;
        this.threeMesh.position.y = this.cannonBody.position.y;
        this.threeMesh.position.z = this.cannonBody.position.z;
        this.threeMesh.quaternion.w = this.cannonBody.quaternion.w;
        this.threeMesh.quaternion.x = this.cannonBody.quaternion.x;
        this.threeMesh.quaternion.y = this.cannonBody.quaternion.y;
        this.threeMesh.quaternion.z = this.cannonBody.quaternion.z;
        let correctionQuaternion = new THREE.Quaternion();
        correctionQuaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
        this.threeMesh.quaternion.multiply(correctionQuaternion);

        if (guiProps.dynamicColors) {
            switch (this.face) {
                case Face.Top:
                    this.threeMaterial.color = new THREE.Color("red");
                    break;
                case Face.Bottom:
                    this.threeMaterial.color = new THREE.Color("yellow");
                    break;
                case Face.Side:
                    this.threeMaterial.color = new THREE.Color("orange");
                    break;
            }
        }

        if (Math.abs(this.cannonBody.position.y - this.lastMovementY) > 0.001) {
            this.lastMovementY = this.cannonBody.position.y;
            this.lastMovementTime = this.world.time;
        }
    }

    remove() {
        this.world.remove(this.cannonBody);
        this.scene.remove(this.threeMesh);
    }

    get resting(): boolean {
        return (this.world.time - this.lastMovementTime) > guiProps.restTimeout;
    }
}

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);

let renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.setClearColor("white");
let cameraControls = <THREE.OrbitControls>new OrbitControls(camera, renderer.domElement);
cameraControls.minPolarAngle = 0;
cameraControls.maxPolarAngle = Math.PI / 2;
cameraControls.enableZoom = true;
cameraControls.maxDistance = 100;

camera.position.z = 1.5;
camera.position.y = 0.4;
camera.position.x = 0;
cameraControls.update();

let ambientLight = new THREE.AmbientLight("white", 0.8);
scene.add(ambientLight);

let directionalLight = new THREE.DirectionalLight("white", 0.4);
directionalLight.shadow.mapSize = new THREE.Vector2(2048, 2048);
directionalLight.castShadow = true;
scene.add(directionalLight);

let timeStep = 1.0 / 60.0;
let world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.broadphase = new CANNON.SAPBroadphase(world);
world.solver.iterations = 20;

let groundCannonMaterial = new CANNON.Material("ground");
let groundShape = new CANNON.Plane();
let groundBody = new CANNON.Body({mass: 0, material: groundCannonMaterial});
groundBody.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), -Math.PI / 2);
groundBody.addShape(groundShape);
world.addBody(groundBody);

let groundGeometry = new THREE.PlaneGeometry(100, 100);
let groundMaterial = new THREE.MeshLambertMaterial({color: 0xcccccc});
let groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
groundMesh.quaternion.w = groundBody.quaternion.w;
groundMesh.quaternion.x = groundBody.quaternion.x;
groundMesh.quaternion.y = groundBody.quaternion.y;
groundMesh.quaternion.z = groundBody.quaternion.z;
groundMesh.receiveShadow = true;
scene.add(groundMesh);

let rolling = false;
let dice: WeirdDice[] = [];
let diceCannonMaterial = new CANNON.Material("dice");
let topCount = 0;
let bottomCount = 0;
let sideCount = 0;

let guiProps = {
    gravity: 9.82,
    timeScale: 1,
    volumeCcm: 100,
    ratio: "1.7321",
    mass: 0.2,
    rollCount: 25,
    gridWidth: 0.4,
    restTimeout: 2,
    dynamicColors: true,
    groundRestitution: 0.3,
    groundFriction: 0.1,
    diceRestitution: 0.3,
    diceFriction: 0.1,
    randomSpin: false,
    randomSpinMagnitude: 1,
    randomVelocity: false,
    randomVelocityOnlyHorizontal: true,
    randomVelocityMagnitude: 1,
    dropHeight: 1,
    enableAutoSearch: false,
    searchGoalPercent: 33.3,
    tweakRatioAfter: 500,
    lowerRatio: "1.0000",
    upperRatio: "5.0000"
};

let guiButtons = {
    reset: function () {
        for (let die of dice) {
            die.remove();
        }

        topCount = 0;
        bottomCount = 0;
        sideCount = 0;
        dice = [];
    },
    start: function () {
        rolling = true;

        if (guiProps.enableAutoSearch) {
            ratioController.setValue(((parseFloat(guiProps.upperRatio) + parseFloat(guiProps.lowerRatio)) / 2).toFixed(4));
        }
    },
    stop: function () {
        rolling = false;
    }
};

let gui = new dat.GUI();
let graphicsGui = gui.addFolder("Graphics");
graphicsGui.add(guiProps, "dynamicColors");
let simulationGui = gui.addFolder("World");
simulationGui.add(guiProps, "gravity");
simulationGui.add(guiProps, "timeScale").min(0);
simulationGui.add(guiProps, "groundRestitution", 0, 1);
simulationGui.add(guiProps, "groundFriction", 0, 1);
let diceGui = gui.addFolder("Dice");
diceGui.add(guiProps, "volumeCcm").min(0);
let ratioController = diceGui.add(guiProps, "ratio");
diceGui.add(guiProps, "mass").min(0);
diceGui.add(guiProps, "diceRestitution", 0, 1);
diceGui.add(guiProps, "diceFriction", 0, 1);
let rollGui = gui.addFolder("Rolling");
rollGui.add(guiProps, "rollCount").min(0);
rollGui.add(guiProps, "dropHeight").min(0);
rollGui.add(guiProps, "gridWidth").min(0);
rollGui.add(guiProps, "randomSpin");
rollGui.add(guiProps, "randomSpinMagnitude").min(0);
rollGui.add(guiProps, "randomVelocity");
rollGui.add(guiProps, "randomVelocityOnlyHorizontal");
rollGui.add(guiProps, "randomVelocityMagnitude").min(0);
rollGui.add(guiProps, "restTimeout").min(0);
let searchGui = gui.addFolder("Auto Search");
searchGui.add(guiProps, "enableAutoSearch");
searchGui.add(guiProps, "searchGoalPercent", 0, 100).step(0.1);
searchGui.add(guiProps, "tweakRatioAfter").min(1);
let upperRatioController = searchGui.add(guiProps, "upperRatio");
let lowerRatioController = searchGui.add(guiProps, "lowerRatio");
gui.add(guiButtons, "start");
gui.add(guiButtons, "stop");
gui.add(guiButtons, "reset");

function rollDie(index: number): WeirdDice {
    let volume = guiProps.volumeCcm * 1e-6;
    let ratio = parseFloat(guiProps.ratio);
    let height = Math.pow((4 * volume) / (Math.PI * Math.pow(ratio, 2)), 1.0/3.0);
    let radius = Math.pow(4 * volume * ratio / Math.PI, 1.0/3.0);

    let rows = Math.ceil(Math.sqrt(guiProps.rollCount));

    let row = Math.floor(index / rows);
    let column = index % rows;

    let x = (row - (rows - 1) / 2) * guiProps.gridWidth;
    let z = (column - (rows - 1) / 2) * guiProps.gridWidth;

    let newDie = new WeirdDice(world, scene, radius, height, guiProps.mass, diceCannonMaterial, new CANNON.Vec3(x, guiProps.dropHeight, z));
    newDie.rotateRandom();
    if (guiProps.randomSpin) {
        newDie.spinRandom(guiProps.randomSpinMagnitude);
    }
    if (guiProps.randomVelocity) {
        newDie.velocityRandom(guiProps.randomVelocityOnlyHorizontal, guiProps.randomVelocityMagnitude);
    }
    newDie.update();

    return newDie;
}

function animate() {
    requestAnimationFrame(animate);

    world.gravity.y = -guiProps.gravity;
    groundCannonMaterial.restitution = guiProps.groundRestitution;
    groundCannonMaterial.friction = guiProps.groundFriction;
    diceCannonMaterial.restitution = guiProps.diceRestitution;
    diceCannonMaterial.friction = guiProps.diceFriction;

    world.step(timeStep * guiProps.timeScale);

    if (rolling) {
        for (let i = dice.length; i < Math.floor(guiProps.rollCount); i++) {
            dice.push(rollDie(i));
        }
    }

    for (let i = 0; i < dice.length; i++) {
        let die = dice[i];
        die.update();

        if (rolling) {
            if (die.resting) {
                switch (die.face) {
                    case Face.Top: topCount++; break;
                    case Face.Bottom: bottomCount++; break;
                    case Face.Side: sideCount++; break;
                }

                die.remove();

                if (guiProps.rollCount < dice.length) {
                    dice.splice(i, 1);
                } else {
                    dice[i] = rollDie(i);
                }
            }
        }
    }

    let totalCount = topCount + bottomCount + sideCount;
    let topPercentage = (100 * topCount / totalCount).toFixed(2);
    let bottomPercentage = (100 * bottomCount / totalCount).toFixed(2);
    let sidePercentage = (100 * sideCount / totalCount).toFixed(2);

    document.getElementById("topCount").textContent = "X   " + topCount + (totalCount > 0 ? " ≙ " + topPercentage + "%" : "");
    document.getElementById("bottomCount").textContent = "O   " + bottomCount + (totalCount > 0 ? " ≙ " + bottomPercentage + "%" : "");
    document.getElementById("sideCount").textContent = "-   " + sideCount + (totalCount > 0 ? " ≙ " + sidePercentage + "%" : "");

    if (guiProps.enableAutoSearch) {
        if (totalCount >= guiProps.tweakRatioAfter) {
            if (100 * sideCount / totalCount > guiProps.searchGoalPercent) {
                lowerRatioController.setValue(guiProps.ratio);
            } else {
                upperRatioController.setValue(guiProps.ratio);
            }

            ratioController.setValue(((parseFloat(guiProps.upperRatio) + parseFloat(guiProps.lowerRatio)) / 2).toFixed(4));

            guiButtons.reset();
        }
    }

    cameraControls.update();
    renderer.render(scene, camera);
}

window.onload = function () {
    animate();
}