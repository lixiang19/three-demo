
// @author  prisoner849 

import * as THREE from '../jsm/three.module.136.js';
import { OrbitControls } from '../jsm/OrbitControls.136.js'

console.clear();

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 2, 5);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
window.addEventListener("resize", event => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
})

let controls = new OrbitControls(camera, renderer.domElement);

let gu = {
  time: { value: 0 }
}

scene.add(new THREE.GridHelper());

let r = 0.1, R = 20, halfAngle = THREE.MathUtils.degToRad(45);
let g = new THREE.PlaneGeometry(1, 1, 72, 20);
let pos = g.attributes.position;
let uv = g.attributes.uv;
for (let i = 0; i < pos.count; i++) {
  let y = 1. - uv.getY(i);
  let radius = r + (R - r) * y;
  let x = pos.getX(i);
  pos.setXY(i, Math.cos(x * halfAngle) * radius, Math.sin(x * halfAngle) * radius);
}
g.rotateX(-Math.PI * 0.5);
g.rotateY(-Math.PI * 0.5);

let m = new THREE.MeshBasicMaterial({
  color: new THREE.Color(0, 0.75, 1),
  side: THREE.DoubleSide,
  transparent: true,
  onBeforeCompile: shader => {
    shader.uniforms.time = gu.time;
    shader.fragmentShader = `
      uniform float time;
      ${shader.fragmentShader}
    `.replace(
      `#include <color_fragment>`,
      `#include <color_fragment>
      float t = time;
      float mainWave = sin((vUv.x - t * 0.2) * 1.5 * PI2) * 0.5 + 0.5;
      mainWave = mainWave * 0.25 + 0.25;
      mainWave *= (sin(t * PI2 * 5.) * 0.5 + 0.5) * 0.25 + 0.75;
      float sideLines = smoothstep(0.45, 0.5, abs(vUv.x - 0.5));
      float scanLineSin = abs(vUv.x - (sin(t * 2.7) * 0.5 + 0.5));
      float scanLine = smoothstep(0.01, 0., scanLineSin);
      float fadeOut = pow(vUv.y, 2.7);
      
      
      float a = 0.;
      a = max(a, mainWave);
      a = max(a, sideLines);
      a = max(a, scanLine);
      
      diffuseColor.a = a * fadeOut;
      
      `
    );
    console.log(shader.fragmentShader)
  }
});
m.defines = { "USE_UV": "" }

let laser = new THREE.Mesh(g, m);
laser.position.set(0, 1.5, 0);
scene.add(laser);

let clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  let t = clock.getElapsedTime();
  gu.time.value = t;
  laser.rotation.x = (Math.sin(t) * 0.5 + 0.5) * THREE.MathUtils.degToRad(10);
  renderer.render(scene, camera);
});
