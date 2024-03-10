import * as THREE from 'three';
import {gsap} from 'gsap';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader.js';
import BrainObj from '../assets/model/BrainUVs.obj?url';
import brainXRayLightPng from '../assets/textures/uv-test-col.png?url';
import dotTexture from '../assets/textures/spark1.png?url';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
let sampler = null;
let group = new THREE.Group();
let BRAIN_MODEL =null
let rootCamera
let endPointsCollections =[]
let memories = {}
let brainBufferGeometries =[]
let xRayMaterial
let brainXRayLight
let xRayEffect
let lines = []
const sparklesGeometry = new THREE.BufferGeometry();
const sparkles = [];
class Sparkle extends THREE.Vector3 {
  setup(origin,dest) {
    this.add(origin).multiplyScalar(1);
    // this.x = origin.x;
    // this.y = origin.y - 100;
    // this.z = origin.z;
    this.dest = dest;
    this._size = Math.random() * 6 + 1;
    this.size = 1;
    this.scaleSpeed = Math.random() * 0.03 + 0.03;
    this.stop = false;
  }
  update() {
    this.x += (this.dest.x - this.x) * 0.004;
    this.y += (this.dest.y - this.y) * 0.004;
    this.z += (this.dest.z - this.z) * 0.004;
    if (this.size < this._size) {
      this.size += this.scaleSpeed;
    } else {
      if (this.distanceTo(this.dest) < 0) {
        this.stop = true;
      }
    }
  }
}
function initLines(model) {
  sampler = new MeshSurfaceSampler(model).build();
  for (let i = 0; i < 60; i++) {
    sampler.sample(p1);
    const linesMesh = {
      colorIndex: i % 4,
      previous: p1.clone()
    };
    lines.push(linesMesh);
  }

}
function  storeBrainVertices(mesh, memories) {
  const keys = Object.keys(memories);

  keys.map((m) => {
    if (mesh.name.includes(m)) {
      if (memories[m].length) {
        memories[m].push(mesh.geometry);
        memories[m] = [
          BufferGeometryUtils.mergeGeometries(memories[m]),
        ];
        return memories;
      }
      return memories[m].push(mesh.geometry);
    }
    return [];
  });
}
function genPointsOrigin() {
  const vertices = endPointsCollections.attributes.position.array;
  const destList =[]
  for (let i = 0; i < vertices.length; i += 3) {
    // 
    if (Math.random() > 0.8){
      destList.push(new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]));
    }
  }
  const geometry = new THREE.TorusKnotGeometry( 200,20, 800, 60,3, 5); 

  // 把torus的顶点当作起点
  const originlist = []
  for (let i = 0; i < geometry.attributes.position.array.length; i += 3) {
    originlist.push(new THREE.Vector3(geometry.attributes.position.array[i], geometry.attributes.position.array[i + 1], geometry.attributes.position.array[i + 2]));
  }

  originlist.forEach((o, i) => {
    const sparkle = new Sparkle();
    if (destList[i]) {
      sparkle.setup(o,destList[i]);
      sparkles.push(sparkle);
    }
   
  });
}
function generatePoints() {
  genPointsOrigin()
  // 获取BRAIN_MODEL的顶点

  // 生成sparkles
  // for (let i = 0; i < vertices.length; i += 3) {
  //   const sparkle = new Sparkle();
  //   sparkle.setup(new THREE.Vector3(vertices[i], vertices[i + 1], vertices[i + 2]));
  //   sparkles.push(sparkle);
  // }

  const sparklesMaterial = new THREE.ShaderMaterial({
    uniforms: {
      pointTexture: {
        value: new THREE.TextureLoader().load(dotTexture)
      }
    },
    vertexShader: `
    attribute float size;
    attribute vec3 color;
    varying vec3 vColor;
    void main() {
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
    fragmentShader: `
    uniform sampler2D pointTexture;
    varying vec3 vColor;
    void main() {
      gl_FragColor = vec4(vColor, 1.0);
      gl_FragColor = gl_FragColor * texture(pointTexture, gl_PointCoord);
    }
  `,
    depthTest: false,
    depthWrite: false,

    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(sparklesGeometry, sparklesMaterial);
  points.castShadow = true;
  points.receiveShadow = false;
  return points;
}
function addLinesPath(mesh, memories) {
  const keys = Object.keys(memories.lines);
  keys.map((l) => {
    if (mesh.name.includes(l)) {
      memories.lines[l] = mesh.geometry.attributes.position.array;
      return memories.lines;
    }
    return [];
  });
}
function addPlane() {
  const geometry = new THREE.PlaneGeometry(20000, 20000);
  const material = new THREE.MeshPhongMaterial({
    opacity: 0.1,
    color: 0xffffff,
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.receiveShadow  = true;
  plane.position.y = -160;
  plane.rotation.x = -0.5 * Math.PI;
  
  group.add(plane);
}
function createBrain() {

  BRAIN_MODEL.traverse((child) => {
    if (child instanceof THREE.LineSegments) {
      memories.lines = {
        ...memories.lines,
        ...addLinesPath(child,memories),
      };
    }
    if (!(child instanceof THREE.Mesh)) {
      return;
    }
    child.geometry.verticesNeedUpdate = true;

    brainBufferGeometries.push(child.geometry);

    memories = {
      ...memories,
      ...storeBrainVertices(child,memories),
    };
  });
  endPointsCollections = BufferGeometryUtils.mergeGeometries(brainBufferGeometries);
  console.log('endPointsCollections',endPointsCollections)
  xRayMaterial = new THREE.ShaderMaterial({
    uniforms: {
        c: { type: 'f', value: 1.0 },
        p: { type: 'f', value: 0.0 },
        glowColor: { type: 'c', value: new THREE.Color(0xffffff) },
        viewVector: { type: 'v3', value: new THREE.Vector3(0, 0, 0) },
        lightningTexture: { type: 't', value:brainXRayLight },
        offsetY: { type: 'f', value: 0.0 },
        uTime: { type: 'f', value: 0.0 },
        teColor: { type: 'c', value: new THREE.Color(0xffffff) }
    },
    vertexShader: `
    uniform vec3 viewVector;
    uniform float c;
    uniform float p;
    uniform float uTime;
    varying float intensity;
    varying  vec2 vUv;
    
    void main(){
    
        vUv = uv;
    
        vec3 vNormal = normalize( normalMatrix * normal );
      vec3 vNormel = normalize( normalMatrix * viewVector );
        intensity = pow(c - abs(dot(vNormal, vec3(0, 0, 1))), p);
    
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
     }
    `,
    fragmentShader: `
    uniform vec3 glowColor;
    uniform sampler2D lightningTexture;
    varying float intensity;
    varying vec2 vUv;
    uniform float offsetY;
    uniform float uTime;
    uniform vec3 teColor;
    void main(){
        vec2 uv = vUv;
        uv.y += offsetY;
    
        vec3 glow = glowColor * intensity;
        vec3 color = vec3(step(0.1, uv.y) - step(0.2, uv.y)) - teColor;
    
        float alpha = clamp(cos(uTime* 3.0) , 0.3, 0.6);
    
        gl_FragColor = vec4( glow + color, alpha);
 
    }`,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    transparent: true,
    depthWrite: false, // 1.0, 1.0, 1.0调整成0.0, 0.0, 0.0就一直显示了
});
    const xRayGeometry = endPointsCollections.clone();
    const mergedGeometry = BufferGeometryUtils.mergeVertices(xRayGeometry);

    mergedGeometry.computeVertexNormals();


    const xRayEffect = new THREE.Mesh(mergedGeometry, xRayMaterial);
    xRayEffect.castShadow = true;
    xRayEffect.receiveShadow = false;
    return xRayEffect;

}
async function xRrayAni() {
  const progress = { p: 0.0 };
  gsap.fromTo(progress, 
    { p: 3.0 }, // from参数
    {
      p: 5.0, // to参数
      duration: 3.0, // 持续时间
      ease: "power1.in", // 缓动函数
      onUpdate: () => {
        // 更新函数
        xRayMaterial.uniforms.offsetY.value = Math.sin(progress.p);
      },
      onComplete: () => {
        // 完成时的回调函数
      }
    }
  );
  
}
let isStartRotate = false;
async function createSparkle(camera) {
  rootCamera = camera;
  const loader = new OBJLoader();
  const textureLoader = new THREE.TextureLoader(this.loadingManager);
  brainXRayLight = textureLoader.load(brainXRayLightPng);
  console.log('brainXRayLight',brainXRayLight)
  BRAIN_MODEL = await loader.loadAsync(BrainObj);
 
  // addPlane()
  xRayEffect = createBrain();
  const points = generatePoints()

  group.add(points);
 
  setTimeout(() => {
    group.add(xRayEffect);
    xRrayAni();
    setTimeout(() => {
      xRayMaterial.uniforms.teColor.value = new THREE.Color(0x000000);
      xRayMaterial.uniforms.p.value = 5.0;
      isStartRotate = true;
    },2500);
  }, 4300);
  return group;
}
let tempSparklesArray = [];
let tempSparklesArraySizes = [];
function tick(deltaTime, elapsedTime) {
  if (isStartRotate) {
    group.rotation.y += 0.0005;
  }
  xRayMaterial.uniforms.uTime.value += deltaTime
  // if (sparkles.length < 12000) {
  //   lines.forEach(l => {
  //     findNextVector(l);
  //     findNextVector(l);
  //     findNextVector(l);

  //   });

  // }
  sparkles.forEach((s, i) => {
    if (!s.stop) {
      s.update();
    }
    tempSparklesArray[(i * 3)] = s.x;
    tempSparklesArray[(i * 3) + 1] = s.y;
    tempSparklesArray[(i * 3) + 2] = s.z;
    tempSparklesArraySizes[i] = s.size;
  });
  sparklesGeometry.setAttribute("position", new THREE.Float32BufferAttribute(tempSparklesArray, 3));
  sparklesGeometry.setAttribute("size", new THREE.Float32BufferAttribute(tempSparklesArraySizes, 1));

 
}

const sparkAnimation = {
  createSparkle,
  tick
}
export default sparkAnimation;