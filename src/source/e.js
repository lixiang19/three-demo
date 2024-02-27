import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";

console.clear();

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 1000);
camera.position.set(-3, 5, 8).setLength(12);
let renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(innerWidth, innerHeight);
//renderer.setClearColor(0x404040);
document.body.appendChild(renderer.domElement);
window.addEventListener("resize", event => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
})

let controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

let light = new THREE.DirectionalLight(0xffffff, 0.5);
light.position.setScalar(1);
scene.add(light, new THREE.AmbientLight(0xffffff, 0.5));

scene.add(new THREE.GridHelper());

let cps = new Array(6).fill().map((_, idx, arr) => {
  let init = -(arr.length - 1);
  return new THREE.Vector3(
    init + idx * 2,
    Math.random() < 0.5 ? -1 : 1,
    -init - idx * 2
  );
});
let curve = new THREE.CatmullRomCurve3(cps);

let g = new THREE.TubeGeometry(curve, 100, 0.5, 32);
let m = new THREE.MeshLambertMaterial({
  color: 0xface8d,
  side: THREE.DoubleSide,
  onBeforeCompile: shader => {
    shader.uniforms.totalLength = m.userData.totalLength;
    shader.uniforms.pipeFittingAt = m.userData.pipeFittingAt;
    shader.uniforms.pipeFittingWidth = m.userData.pipeFittingWidth;
    shader.uniforms.pipeFittingColor = m.userData.pipeFittingColor;
    shader.fragmentShader = `
      #define S(a, b, c) smoothstep(a, b, c)
      uniform float totalLength;
      uniform float pipeFittingAt;
      uniform float pipeFittingWidth;
      uniform vec3 pipeFittingColor;
      ${shader.fragmentShader}
    `.replace(
      `#include <color_fragment>`,
      `#include <color_fragment>
        float normAt = pipeFittingAt / totalLength;
        float normWidth = pipeFittingWidth / totalLength;
        float hWidth = normWidth * 0.5;
        float fw = fwidth(vUv.x);
        float f = S(hWidth + fw, hWidth, abs(vUv.x - normAt));
        diffuseColor.rgb = mix(diffuseColor.rgb, pipeFittingColor, f);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1, 1, 0), S(fw,  0., abs(vUv.x - normAt)));
      `
    );
    console.log(shader.fragmentShader);
  }
});
m.defines = { "USE_UV": "" };
m.userData = {
  totalLength: { value: curve.getLength() },
  pipeFittingAt: { value: 2 },
  pipeFittingWidth: { value: 1 },
  pipeFittingColor: { value: new THREE.Color(0xff2200) }
};
let o = new THREE.Mesh(g, m);
scene.add(o);

let gui = new GUI();
gui.add(m.userData.pipeFittingAt, "value", 0, curve.getLength()).name("at");
gui.add(m.userData.pipeFittingWidth, "value", 0.1, 2).name("width");
gui.addColor(m.userData.pipeFittingColor, "value").name("color");

let clock = new THREE.Clock();

renderer.setAnimationLoop((_) => {
  let t = clock.getElapsedTime();
  controls.update();
  renderer.render(scene, camera);
});