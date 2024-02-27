console.clear();
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.125.2/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.125.2/examples/jsm/controls/OrbitControls.js";
import { BufferGeometryUtils } from "https://cdn.jsdelivr.net/npm/three@0.125.2/examples/jsm/utils/BufferGeometryUtils.js";
import { TWEEN } from "https://cdn.jsdelivr.net/npm/three@0.125.2/examples/jsm/libs/tween.module.min.js";

let scene = new THREE.Scene();
scene.background = new THREE.Color(0.0625, 0, 0.125);
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.01, 50);
camera.position.set(0, 5, 10);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

let controls = new OrbitControls(camera, renderer.domElement);

let maxImpactAmount = 8;
// init uniforms impacts array
let impacts = [];
for (let i = 0; i < maxImpactAmount; i++) {
  impacts.push({
    impactPosition: new THREE.Vector3(),
    impactMaxRadius: 0,
    impactRatio: 0
  });
}
let uniforms = {
  impacts: { value: impacts }
}

var tweens = [];

for (let i = 0; i < maxImpactAmount; i++) {
  tweens.push({
    runTween: function () {
      var tween = new TWEEN.Tween({ value: 0 })
        .to({ value: 1 }, THREE.Math.randInt(2500, 5000))
        //.delay(THREE.Math.randInt(500, 2000))
        .onUpdate(val => {
          uniforms.impacts.value[i].impactRatio = val.value;
        })
        .onComplete(val => {
          uniforms.impacts.value[i].impactPosition.setFromSphericalCoords(
            5,
            Math.PI * Math.random(),
            Math.PI * 2 * Math.random()
          );
          uniforms.impacts.value[i].impactMaxRadius = 5 * THREE.Math.randFloat(0.5, 0.75);
          tweens[i].runTween();
        });
      tween.start();
    }
  });
}

tweens.forEach(t => { t.runTween(); })

let img = new Image();
img.onload = () => {
  makeGlobeOfPoints();
};
img.src = imgData;

renderer.setAnimationLoop(_ => {
  TWEEN.update();
  renderer.render(scene, camera);
})

function makeGlobeOfPoints() {

  let dummyObj = new THREE.Object3D();
  let p = new THREE.Vector3();
  let geoms = [];

  let c = document.createElement("canvas");
  c.width = 360;
  c.height = 181;
  let ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, c.width, c.height);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, c.width, 14);
  let data = ctx.getImageData(0, 0, c.width, c.height).data;
  console.log(data);
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      let idx = ((c.width * y) + x) * 4 + 2;
      let d = data[idx];

      p.setFromSphericalCoords(5, THREE.MathUtils.degToRad(y), THREE.MathUtils.degToRad(x));
      dummyObj.lookAt(p);
      dummyObj.updateMatrix();

      let maxSize = 0.04;
      let minSize = 0.015;
      let gSize = (d > 128) ? minSize : maxSize;

      let g = new THREE.PlaneGeometry(gSize, gSize);
      g.applyMatrix4(dummyObj.matrix);
      g.translate(p.x, p.y, p.z);
      let centers = [
        p.x, p.y, p.z,
        p.x, p.y, p.z,
        p.x, p.y, p.z,
        p.x, p.y, p.z
      ];
      g.setAttribute("center", new THREE.Float32BufferAttribute(centers, 3));
      let s = (d > 128) ? (maxSize / minSize) : 1;
      g.setAttribute("scale", new THREE.Float32BufferAttribute([s, s, s, s], 1));
      geoms.push(g);
    }
  }
  let g = BufferGeometryUtils.mergeBufferGeometries(geoms);
  let m = new THREE.MeshBasicMaterial({
    color: 0x6633aa,
    side: THREE.DoubleSide,
    onBeforeCompile: shader => {
      shader.uniforms.impacts = uniforms.impacts;
      shader.vertexShader = `
      	struct impact {
          vec3 impactPosition;
          float impactMaxRadius;
          float impactRatio;
        };
      	uniform impact impacts[${maxImpactAmount}];
        
        attribute vec3 center;
        attribute float scale;
        
        varying float vFinalStep;
        
        ${shader.vertexShader}
      `.replace(
        `#include <begin_vertex>`,
        `#include <begin_vertex>
        float finalStep = 0.0;
        for (int i = 0; i < ${maxImpactAmount};i++){

          float dist = distance(center, impacts[i].impactPosition);
          float curRadius = impacts[i].impactMaxRadius * impacts[i].impactRatio;
          float sstep = smoothstep(0., curRadius, dist) - smoothstep(curRadius - ( 0.25 * impacts[i].impactRatio ), curRadius, dist);
          sstep *= 1. - impacts[i].impactRatio;
          finalStep += sstep;

        }
        finalStep = clamp(finalStep, 0., 1.);
        vFinalStep = finalStep;
        transformed = (position - center) * mix(1., scale * 1.25, finalStep) + center; // scale on wave
        transformed += normal * finalStep * 0.125; // lift on wave
        `
      );
      shader.fragmentShader = `
        varying float vFinalStep;
        ${shader.fragmentShader}
        `.replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `
        if (length(vUv - 0.5) > 0.5) discard; // make points circular
        vec3 grad = mix(vec3(1, 0.75, 1), vec3(0, 1, 1), clamp(length(vUv - 0.5) / 0.5, 0., 1.)); // circular gradient
        vec3 col = mix(diffuse, grad, vFinalStep); // color on wave
        vec4 diffuseColor = vec4( col , opacity ); 
        `
      );
    }
  });
  m.defines = { "USE_UV": "" };
  let o = new THREE.Mesh(g, m);
  o.rotation.y = Math.PI;
  scene.add(o);
}