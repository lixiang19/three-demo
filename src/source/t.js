

// @author PavelBoytchev

import * as THREE from '../jsm/three.module.158.js';
//import { OrbitControls } from '../jsm/OrbitControls.158.js';

// general setup, boring, skip to the next comment

console.clear();

var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight);
camera.position.set(0, 0, 10);
camera.lookAt(scene.position);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setAnimationLoop(animationLoop);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", (event) => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});


// next comment

const N = 20; // number of vertices in a line
const L = 150; // number of lines

var colors = [],
  color = new THREE.Color();
for (var i = 0; i < N; i++) {
  color.setHSL(0.6, 1, (1 - i / (N - 1)) ** 4);
  colors.push(color.r, color.g, color.b);
}

var material = new THREE.LineBasicMaterial({
  vertexColors: true,
  blending: THREE.AdditiveBlending,
});

var geometry, line, lines = [];
for (var i = 0; i < L; i++) {
  geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

  line = new THREE.Line(geometry, material);
  line.pos = geometry.getAttribute('position');
  line.rnd = Math.random();

  lines.push(line);
}
scene.add(...lines);


function path(buf, t, i, rnd) {
  t += 10 * rnd;

  var x = (0.1 + 3 * rnd) * Math.sin(t + 13 * rnd) + 2 * rnd * Math.cos(3.2 * t + 3);
  var y = (3 - 3 * rnd) * Math.cos(t) + 2 * rnd * Math.cos(4.5 * t - 7 * rnd);
  var z = (3 * rnd ** 2) * Math.sin(2.7 * t - 4 * rnd);
  buf.setXYZ(i, x, y, z);
}


function animationLoop(t) {

  for (var line of lines) {
    for (var i = 0; i < N; i++)
      path(line.pos, t / 3000 - i / 50, i, line.rnd);

    line.pos.needsUpdate = true;
  }

  renderer.render(scene, camera);
}

