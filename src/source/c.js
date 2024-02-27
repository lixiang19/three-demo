import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

import { Line2 } from "three/examples/jsm/lines/Line2";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry";

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 100);
camera.position.set(5, 8, 13).setLength(10);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x404040);
document.body.appendChild(renderer.domElement);

let controls = new OrbitControls(camera, renderer.domElement);
controls.listenToKeyEvents(window);
console.log(controls);

let grid = new THREE.GridHelper(10, 10, 0x7f7f7f, 0x7f7f7f);
scene.add(grid);

let curve = new THREE.EllipseCurve(
  0,
  0, // ax, aY
  4,
  4, // xRadius, yRadius
  0,
  2 * Math.PI, // aStartAngle, aEndAngle
  false, // aClockwise
  0 // aRotation
);

const points = curve.getPoints(1000);
console.log(points.length);
const points2 = curve.getSpacedPoints(50);
// this._assignUVs(this.sphere)

let eGeom = new THREE.BufferGeometry().setFromPoints(points);
let col = new THREE.Color();
let cols = [];
for (let i = 0; i < points.length; i++) {
  col.setHSL(i / (points.length - 1), 1, 0.5);
  cols.push(col.r, col.g, col.b);
}

let geometry = new LineGeometry();

const firstMat = new THREE.LineBasicMaterial({ color: "yellow" });

let ellipse = new THREE.Line(eGeom, firstMat);

// scene.add(ellipse)

let fromElipse = geometry.fromLine(ellipse);
fromElipse.setColors(cols);
let u = {
  iTime: { value: 0 }
};
let matLine = new LineMaterial({
  worldUnits: true,
  linewidth: 0.2,
  vertexColors: true,
  dashed: false,
  alphaToCoverage: false
});

matLine.onBeforeCompile = (shader) => {
  shader.uniforms.iTime = u.iTime;
  //console.log(shader.vertexShader);
  shader.vertexShader = `
      uniform float iTime;
      uniform float Strength;
      ${document.getElementById("noiseFS").textContent}
      ${shader.vertexShader}
   `.replace(
    `// camera space
			vec4 start = modelViewMatrix * vec4( instanceStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );`,
    `
        // model position
        vec3 modPos = vec3(modelMatrix * (vec4(0, 0, 0, 1.)));
        vec3 camDir = cameraPosition - modPos;
        camDir.y = 0.;
        camDir = normalize(camDir);
        
        vec3 wPosS = vec3(modelMatrix * vec4(instanceStart, 1.));
        vec3 wPosE = vec3(modelMatrix * vec4(instanceEnd, 1.));
        
        float fadeOutS = smoothstep(0., 2., dot( wPosS, camDir ));
        float fadeOutE = smoothstep(0., 2., dot( wPosE, camDir ));


        float bS = pnoise( 1.5* instanceStart + vec3( 2.5 * iTime ), vec3( 3.0 ) );
        float bE = pnoise( 1.5* instanceEnd + vec3( 2.5 * iTime ), vec3( 3.0 ) );
        
        vec3 iStart = instanceStart + vec3(0, 0, 1) * bS * fadeOutS;
        vec3 iEnd = instanceEnd + vec3(0, 0, 1) * bE * fadeOutE;
        
      // camera space
			vec4 start = modelViewMatrix * vec4( iStart, 1.0 );
			vec4 end = modelViewMatrix * vec4( iEnd, 1.0 );
        `
  );
};

let line = new Line2(fromElipse, matLine);

line.computeLineDistances();
scene.add(line);

line.rotation.x = Math.PI / 2;

let clock = new THREE.Clock();

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

renderer.setAnimationLoop((_) => {
  u.iTime.value = clock.getElapsedTime() * 0.25;
  matLine.resolution.set(innerWidth, innerHeight);
  renderer.render(scene, camera);
});
