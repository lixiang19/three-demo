

// @author prisoner849

import * as THREE from "../jsm/three.module.160.js";
import { OrbitControls } from "../jsm/OrbitControls.160.js";
import { GUI } from "../jsm/lil-gui.module.min.160.js";

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
camera.position.set(0, 0, 10);
let renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", event => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

let g = new THREE.BoxGeometry();

let mu = {
  holeRadius: {
    value: 0.75
  }
}
let m = new THREE.MeshNormalMaterial({
  side: THREE.DoubleSide,
  onBeforeCompile: shader => {
    shader.uniforms.holeRadius = mu.holeRadius;
    shader.vertexShader = `
    	varying vec3 vPos;
      ${shader.vertexShader}
    `.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
      	vPos = vec3(modelMatrix * vec4(position, 1.));
      `
    );
    //console.log(shader.vertexShader);
    shader.fragmentShader = `
    	uniform float holeRadius;
    	varying vec3 vPos;
      
      
      ${shader.fragmentShader}
    `.replace(
      `#include <clipping_planes_fragment>`,
      `#include <clipping_planes_fragment>
      	
        float XY = length(vPos.xy);
        float YZ = length(vPos.yz);
        float XZ = length(vPos.xz);
        
        float lenMax = min(XY, min(YZ, XZ));
        
        if (lenMax < holeRadius) discard;
        
      `
    );
    //console.log(shader.fragmentShader);
  }
});
let o = new THREE.Mesh(g, m);
o.scale.set(5, 3, 2);
scene.add(o);

let gui = new GUI();
let scale = gui.addFolder("scale");
scale.add(o.scale, "x", 1, 5);
scale.add(o.scale, "y", 1, 5);
scale.add(o.scale, "z", 1, 5);
gui.add(mu.holeRadius, "value", 0.1, 1).name("hole radius");

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

