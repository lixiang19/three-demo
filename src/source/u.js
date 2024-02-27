
var noise = `
//
// Description : Array and textureless GLSL 2D/3D/4D simplex 
//               noise functions.
//      Author : Ian McEwan, Ashima Arts.
//  Maintainer : stegu
//     Lastmod : 20110822 (ijm)
//     License : Copyright (C) 2011 Ashima Arts. All rights reserved.
//               Distributed under the MIT License. See LICENSE file.
//               https://github.com/ashima/webgl-noise
//               https://github.com/stegu/webgl-noise
// 

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
     return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
  { 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}
`;

// @author prisoner849

console.clear();
import * as THREE from "../jsm/three.module.131.js";
import { OrbitControls } from "../jsm/OrbitControls.131.js";

let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 1, 100);
camera.position.set(0, 0, 10);
let renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setClearColor(0x302020);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", onWindowResize);

let controls = new OrbitControls(camera, renderer.domElement);

let pts = [];
let count = 2500;
let cylLength = 15;
let angleStep = Math.PI * 0.025;
let heightStep = cylLength / (count - 1);
for (let i = 0; i < count; i++) {
  let h = heightStep * i;
  let uvY = h / cylLength;
  pts.push(
    new THREE.Vector3().setFromCylindricalCoords(
      2 + 3 * Math.sin(uvY * Math.PI * 0.5),
      angleStep * i,
      cylLength * -0.5 + h
    )
  );
}
let curve = new THREE.CatmullRomCurve3(pts);
let g = new THREE.BufferGeometry().setFromPoints(curve.getSpacedPoints(count));
let u = {
  time: { value: 0 }
};
let m = new THREE.PointsMaterial({
  size: 0.05,
  color: "magenta",
  onBeforeCompile: (shader) => {
    shader.uniforms.time = u.time;
    shader.vertexShader = `
      uniform float time;
      varying float vNoiseVal;
      ${noise}
      ${shader.vertexShader}
    `.replace(
      `#include <begin_vertex>`,
      `#include <begin_vertex>
        
        float n31 = snoise(transformed  * 0.125 - vec3(0., time * 0.1, 0.));
        vNoiseVal = n31;
        n31 = (n31 - 0.5) * 2.;
        
        vec2 xzN = normalize(transformed.xz);
        transformed *= vec3(0.25, 1., 1.);
        float k = (position.y - ${cylLength * -0.5 + 0.001}) / ${cylLength + 0.001};
        transformed.xz += xzN * n31 * (k * 0.25 + 1.);
      `
    );
    shader.fragmentShader = `
      varying float vNoiseVal;
      ${shader.fragmentShader}
    `.replace(
      `#include <clipping_planes_fragment>`,
      `#include <clipping_planes_fragment>
        if(length(gl_PointCoord - 0.5) > 0.5) discard; // make'em round
      `
    ).replace(
      `#include <color_fragment>`,
      `#include <color_fragment>
        
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0, 1, 1), clamp(pow(vNoiseVal, 0.75), 0., 1.));
      `
    );
    console.log(shader.fragmentShader)
  }
});
let p = new THREE.Points(g, m);
p.rotation.z = Math.PI * 0.5;
p.rotation.y = Math.PI * 0.5;
scene.add(p);

let clock = new THREE.Clock();

renderer.setAnimationLoop((_) => {
  let t = clock.getElapsedTime();
  u.time.value = t;
  renderer.render(scene, camera);
});

function onWindowResize() {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
}

