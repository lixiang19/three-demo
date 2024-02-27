console.clear();
import * as THREE from "https://cdn.skypack.dev/three@0.131.3";
import { OrbitControls } from "https://cdn.skypack.dev/three@0.131.3/examples/jsm/controls/OrbitControls.js";

import { Line2 } from 'https://cdn.skypack.dev/three@0.131.3/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'https://cdn.skypack.dev/three@0.131.3/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'https://cdn.skypack.dev/three@0.131.3/examples/jsm/lines/LineGeometry.js';
import { GeometryUtils } from 'https://cdn.skypack.dev/three@0.131.3/examples/jsm/utils/GeometryUtils.js';

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(45, innerWidth / innerHeight, 1, 100);
camera.position.set(5, 8, 13);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x404040);
document.body.appendChild(renderer.domElement);

let controls = new OrbitControls(camera, renderer.domElement);

let grid = new THREE.GridHelper(10, 10, 0x303030, 0x202020);
scene.add(grid);

let pts = [];
let clr = [];
let wdth = [];
let counter = 10;
for (let i = 0; i < counter; i++) {
  pts.push(
    THREE.MathUtils.randFloat(-5, 5),
    THREE.MathUtils.randFloat(-5, 5),
    THREE.MathUtils.randFloat(-5, 5)
  )
  clr.push(Math.random(), Math.random(), Math.random());
  if (i < counter - 1) wdth.push(THREE.MathUtils.randInt(2, 20));
}
console.log(pts.length, clr.length, wdth.length);

let geometry = new LineGeometry();
geometry.setPositions(pts);
geometry.setColors(clr);
geometry.setAttribute("linewidth", new THREE.InstancedBufferAttribute(new Float32Array(wdth), 1));

console.log(geometry);

let matLine = new LineMaterial({

  color: 0xffffff,
  //linewidth: 5, // in pixels
  vertexColors: true,
  //resolution:  // to be set by renderer, eventually
  dashed: false,
  alphaToCoverage: true,
  onBeforeCompile: shader => {
    shader.vertexShader = `
      ${shader.vertexShader}
    `.replace(`uniform float linewidth;`, `attribute float linewidth;`);
    //console.log(shader.vertexShader)
  }

});

let line = new Line2(geometry, matLine);
line.computeLineDistances();
line.scale.set(1, 1, 1);
scene.add(line);


renderer.setAnimationLoop(_ => {
  matLine.resolution.set(innerWidth, innerHeight);
  renderer.render(scene, camera);
});