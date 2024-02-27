="module" >

  // @author prisoner849

  console.clear();

import * as THREE from "../jsm/three.module.124.js";
import { OrbitControls } from "../jsm/OrbitControls.124.js";
import { GUI } from "../jsm/dat.gui.module.124.js";

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
camera.position.set(10, 0, 0);
let renderer = new THREE.WebGLRenderer();
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x222222);
document.body.appendChild(renderer.domElement);

let controls = new OrbitControls(camera, renderer.domElement);

//scene.add(new THREE.GridHelper(20, 10, 0x333333, 0x333333));

// curve
const randD = 3;
const halfD = randD * 0.5;
let curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-10, 0, 0),
  new THREE.Vector3(-5, Math.random() * randD - halfD, Math.random() * randD - halfD),
  new THREE.Vector3(0, Math.random() * randD - halfD, Math.random() * randD - halfD),
  new THREE.Vector3(5, Math.random() * randD - halfD, Math.random() * randD - halfD),
  new THREE.Vector3(10, 0, 0)
]);
console.log(curve)

// tube
const tubeR = 2;
let gTube = new THREE.TubeBufferGeometry(curve, 20, tubeR, 16, false);
let mTube = new THREE.MeshBasicMaterial({ color: 0x666666, wireframe: true, side: THREE.BackSide });
let oTube = new THREE.Mesh(gTube, mTube);
scene.add(oTube);

// icosahedrons
const icoCount = 20;
let icos = [];
let icoG = new THREE.IcosahedronBufferGeometry(1, 0);
for (let i = 0; i < icoCount; i++) {
  let scale = (Math.random() < 0.5) ? 0.25 : 0.0625;
  let oIco = new THREE.Mesh(icoG, new THREE.MeshBasicMaterial({ color: Math.random() * 0x7f7f7f + 0x7f7f7f, wireframe: true }));
  oIco.scale.setScalar(scale);
  oIco.userData.curvePos = Math.random();
  oIco.userData.curveSpeed = (Math.random() * 0.75 + 0.25) * 0.2;
  oIco.userData.curveOffset = new THREE.Vector3(0, Math.random() - 0.5, Math.random() - 0.5).setLength(Math.random() * (tubeR - 0.5));
  icos.push(oIco);
  scene.add(oIco);
}

let params = {
  useOffset: true
}

let gui = new GUI();
gui.add(params, "useOffset");

let clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  let t = clock.getElapsedTime();

  icos.forEach(ico => {
    let icoData = ico.userData;
    let realT = (icoData.curvePos + (t * icoData.curveSpeed)) % 1;
    curve.getPoint(realT, ico.position);
    if (params.useOffset) ico.position.add(icoData.curveOffset);
  })

  renderer.render(scene, camera);
})

