import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import brainGltf from "../assets/model/brain.glb?url";
import BrainModel from '../assets/model/brainAll.glb?url';
import dotTexture from '../assets/textures/dotTexture.png?url';
import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
let sampler = null;
let brainModel = null;
const sparkles = [];
const group = new THREE.Group();
group.position.set(0, 2, 0);
const lines = [];
const sparklesGeometry = new THREE.BufferGeometry();
let linesColors = [new THREE.Color(0xFAAD80).multiplyScalar(0.5), new THREE.Color(0xFF6767).multiplyScalar(0.5), new THREE.Color(0xFF3D68).multiplyScalar(0.5), new THREE.Color(0xA73489).multiplyScalar(0.5)];
function generatePoints() {

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
      if (texture(pointTexture,gl_PointCoord).g < 0.7) discard;
      gl_FragColor = gl_FragColor * texture(pointTexture, gl_PointCoord);
    }
  `,
    depthTest: false,
    depthWrite: false,

    blending: THREE.AdditiveBlending
  });

  const points = new THREE.Points(sparklesGeometry, sparklesMaterial);
  return points;
}
function initLines(model) {
  sampler = new MeshSurfaceSampler(model).build();
  for (let i = 0; i < 6; i++) {
    sampler.sample(p1);
    const linesMesh = {
      colorIndex: i % 4,
      previous: p1.clone()
    };
    lines.push(linesMesh);
  }
  console.log(lines);
}


function setupModel(loadedData) {
  const model = loadedData.scene.children[0];

  let meshModel = null
  model.traverse((object) => {
    if (object.isMesh) {
      meshModel = object;
    }
  });

  meshModel.geometry.rotateX(Math.PI * -0.5);
  meshModel.geometry.rotateY(Math.PI * -0.3);

  return meshModel;
}
async function createBrain() {
  const loader = new GLTFLoader();
  const loadedData = await loader.loadAsync(BrainModel);
  const model = setupModel(loadedData);
  return { model, brainData: loadedData };
}
async function createSparkle() {
  const points = generatePoints();
  group.add(points);
  const { model, brainData } = await createBrain();
  brainModel = model;
  const geometry = brainModel.geometry;

  // 对于BufferGeometry，顶点数量可以通过获取 position 属性的 count
  const vertexCount = geometry.attributes.position.count;

  console.log('顶点数量:', vertexCount);
  initLines(brainModel);
  return group;
}







let tempSparklesArray = [];
let tempSparklesArraySizes = [];
function tick() {
  group.rotation.y -= 0.002;

  if (sparkles.length < 40000) {
    lines.forEach(l => {
      findNextVector(l);
      findNextVector(l);
      findNextVector(l);
    });

  }
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

/** 寻找临近 */
class Sparkle extends THREE.Vector3 {
  setup(origin) {
    this.add(origin).multiplyScalar(3);
    this.dest = origin;

    this._size = Math.random() * 6 + 1;
    this.size = 2;
    this.scaleSpeed = Math.random() * 0.03 + 0.03;
    this.stop = false;
  }
  update() {
    this.x += (this.dest.x - this.x) * 0.08;
    this.y += (this.dest.y - this.y) * 0.08;
    this.z += (this.dest.z - this.z) * 0.08;
    if (this.size < this._size) {
      this.size += this.scaleSpeed;
    } else {
      if (this.distanceTo(this.dest) < 0.1) {
        this.stop = true;
      }
    }
  }
}
const p1 = new THREE.Vector3();
const tempSparklesArrayColors = [];
function findNextVector(line) {
  let ok = false;
  while (!ok) {
    sampler.sample(p1);

    if (p1.distanceTo(line.previous) < 0.7) {
      line.previous = p1.clone();

      const spark = new Sparkle();
      spark.setup(line.previous);
      sparkles.push(spark);

      tempSparklesArrayColors.push(linesColors[line.colorIndex].r, linesColors[line.colorIndex].g, linesColors[line.colorIndex].b);
      sparklesGeometry.setAttribute("color", new THREE.Float32BufferAttribute(tempSparklesArrayColors, 3));

      ok = true;
    }
  }
}

const sparkAnimation = {
  createSparkle,
  tick
}
export default sparkAnimation;