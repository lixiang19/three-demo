// https://discourse.threejs.org/t/updating-nearby-vertices-of-mesh/58118

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";


// general setup, boring, skip to the next comment

console.clear();

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x101010);

var camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight);
camera.position.set(0, 0, 7);
camera.lookAt(scene.position);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setAnimationLoop(animationLoop);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", (event) => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.render(scene, camera);
});


var light = new THREE.DirectionalLight('white', 2);
light.position.set(0, 0, 5);
scene.add(light);


var head = new THREE.Object3D();
var headFrame = new THREE.Object3D();
var headDots = new THREE.Object3D();

new GLTFLoader().load('https://boytchev.github.io/etudes/threejs/negative-morphs/LeePerrySmith.glb', (gltf) => {
  head = gltf.scene.children[0];
  head.geometry.scale(0.5, 0.5, 0.5);
  head.material = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(2, 2, 2),
    metalness: 0,
    roughness: 1,
    sheen: 1,
    sheenColor: 'white',
    sheenRoughness: 0.5,
    polygonOffset: true,
    polygonOffsetUnits: 0.1,
    polygonOffsetFactor: 0.1,
    transparent: !true,
    opacity: 0.1,
  });

  headFrame = new THREE.Mesh(head.geometry);
  headFrame.material = new THREE.MeshPhysicalMaterial({
    color: 'blue',
    metalness: 0,
    roughness: 0,
    wireframe: true,
    transparent: true,
    opacity: 0.1,
  });

  headDots = new THREE.Points(head.geometry);
  headDots.material = new THREE.PointsMaterial({
    color: 'dimgray',
    size: 0.02,
  });

  scene.add(head, headFrame, headDots);
  renderer.render(scene, camera);
}
);


var raycaster = new THREE.Raycaster(),
  pointer = new THREE.Vector2(Infinity, Infinity),
  mouse = new THREE.Vector2(Infinity, Infinity),
  contact = new THREE.Vector3();

function hasPointOfContact(event) {
  pointer.x = 2 * event.clientX / innerWidth - 1;
  pointer.y = -2 * event.clientY / innerHeight + 1;

  raycaster.setFromCamera(pointer, camera);

  var intersects = raycaster.intersectObject(head);
  if (intersects.length > 0) {
    contact.copy(intersects[0].point);
    return true;
  }
  return false;
}



var selectedPoints = [];
var selectedForces = [];

function selectPoints() {
  selectedPoints = [];
  selectedForces = [];
  var pos = head.geometry.getAttribute('position'),
    v = new THREE.Vector3();

  for (var i = 0; i < pos.count; i++) {
    v.set(pos.getX(i), pos.getY(i), pos.getZ(i));
    var force = v.distanceTo(contact) / 0.5;
    if (force < 1) {
      selectedPoints.push(i);
      selectedForces.push((0.5 + 0.5 * Math.cos(Math.PI * (force))) / 185);
    }
  }
}


function dragPoints(dx, dy) {
  var pos = head.geometry.getAttribute('position'),
    v = new THREE.Vector3();

  for (var j in selectedPoints) {
    var i = selectedPoints[j];
    pos.setX(i, pos.getX(i) + selectedForces[j] * dx);
    pos.setY(i, pos.getY(i) - selectedForces[j] * dy);
  }
  pos.needsUpdate = true;
}

window.addEventListener('pointerdown', () => document.getElementById('hint').style.display = 'none');

// next comment


function onPointerDown(event) {
  if (hasPointOfContact(event)) {
    selectPoints();
    mouse.set(event.clientX, event.clientY);
  }
}


function onPointerUp(event) {
  selectedPoints = [];
}


function onPointerMove(event) {
  dragPoints(event.clientX - mouse.x, event.clientY - mouse.y);
  mouse.set(event.clientX, event.clientY);
}


window.addEventListener('pointermove', onPointerMove);
window.addEventListener('pointerdown', onPointerDown);
window.addEventListener('pointerup', onPointerUp);


function animationLoop(t) {
  renderer.render(scene, camera);
}
