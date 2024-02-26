import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import BrainModel from '../assets/model/brainAll.glb?url';
import dotTexture from '../assets/textures/dotTexture.png?url';

import polyVe from '../data/polyVe.json'
const pixelRatio = 2
const group = new THREE.Group();
const polyVePoints = polyVe.map(p => new THREE.Vector3(p[0], p[2], -p[1]))
const sparkles = [];
const sparklesGeometry = new THREE.BufferGeometry();
const sparklesMaterial = new THREE.ShaderMaterial({
  uniforms: {
    pointTexture: {
      value: new THREE.TextureLoader().load(
        dotTexture
      )
    }
  },
  vertexShader: `
  attribute float size;
			attribute vec3 color;
			attribute float fade;

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
    gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
  }
  `,
  blending: THREE.AdditiveBlending,
  alphaTest: 1.0,
  transparent: true
});
const points = new THREE.Points(sparklesGeometry, sparklesMaterial);
group.add(points);

let sampler = null;
const lines = [];
let linesMaterials = [
  new THREE.LineBasicMaterial({ transparent: true, color: 0x125D98 }),
  new THREE.LineBasicMaterial({ transparent: true, color: 0xCFD6DE })
];
let galaxyColors = [
  new THREE.Color("#f9fbf2").multiplyScalar(0.8),
  new THREE.Color("#ffede1").multiplyScalar(0.8),
  new THREE.Color("#05c7f2").multiplyScalar(0.8),
  new THREE.Color("#0597f2").multiplyScalar(0.8),
  new THREE.Color("#0476d9").multiplyScalar(0.8)
];
function dots() {
  for (let i = 0; i < 2; i++) {
    const linesMesh = new THREE.Line(new THREE.BufferGeometry(), linesMaterials[i % 2]);
    linesMesh.coordinates = [];
    linesMesh.previous = null;
    lines.push(linesMesh);
    group.add(linesMesh);
  }
  console.log(group)
}
function setupModel(loadedData) {
  console.log("🚀 ~ setupModel ~ loadedData:", loadedData)
  const model = loadedData.scene.children[0];

  let meshModel = null
  model.traverse((object) => {

    if (object.isMesh) {
      meshModel = object;
    }
  });
  console.log("🚀 ~ model.traverse ~ object:", meshModel)
  // meshModel.geometry.scale(0.3, 0.3, 0.3);
  // meshModel.geometry.translate(0, -2, 0);
  // meshModel.geometry.rotateY(0.2);
  return meshModel;
}
async function createBrain() {
  const loader = new GLTFLoader();
  const loadedData = await loader.loadAsync(BrainModel);
  const model = setupModel(loadedData);
  return { model, brainData: loadedData };
}
async function createLine() {
  // const { model, brainData } = await createBrain();

  dots();
  return group;

}
function createUniqueValueGetter(arr) {
  console.log("🚀 ~ createUniqueValueGetter ~ arr:", arr)
  let values = Array.from(arr); // 复制数组以避免修改原始数据
  const usedIndices = new Set(); // 用于存储已返回值的索引

  return function() {
    // 查找尚未返回的值的索引
    let index = values.findIndex((_, i) => !usedIndices.has(i));

    if (index !== -1) {
      usedIndices.add(index);
      return values[index];
    } else {
      return null; // 如果所有值都已被返回，则返回null
    }
  };
}
const getNextUniqueValue = createUniqueValueGetter(polyVePoints);

let p1 = new THREE.Vector3();
function nextDot(line) {
  let ok = false;
  while (!ok) {
    p1 = getNextUniqueValue();
    if (!p1) {
      return
    }
    if (line.previous) {
      console.log("🚀 ~ nextDot ~ p1", p1,line.previous,p1.distanceTo(line.previous))
    }
   
    if (line.previous && p1.distanceTo(line.previous) < 100) {
      
      line.coordinates.push(p1.x, p1.y, p1.z);
      line.previous = p1.clone();

      for (let i = 0; i < 2; i++) {
        const spark = new Sparkle();
        spark.setup(p1, line.material.color);
        sparkles.push(spark);
      }
      ok = true;
    } else if (!line.previous) {
      line.previous = p1.clone();
    }
  }
}

function updateSparklesGeometry() {
  let tempSparklesArraySizes = [];
  let tempSparklesArrayColors = [];
  sparkles.forEach((s) => {
    tempSparklesArraySizes.push(s.size);
    tempSparklesArrayColors.push(s.color.r, s.color.g, s.color.b);
  });
  sparklesGeometry.setAttribute("color", new THREE.Float32BufferAttribute(tempSparklesArrayColors, 3));
  sparklesGeometry.setAttribute("size", new THREE.Float32BufferAttribute(tempSparklesArraySizes, 1));
}

class Sparkle extends THREE.Vector3 {
  setup(origin, color) {
    this.x = origin.x;
    this.y = origin.y;
    this.z = origin.z;
    this.v = new THREE.Vector3();
    /* X Speed */
    this.v.x = THREE.MathUtils.randFloat(0.001, 0.006);
    this.v.x *= Math.random() > 0.5 ? 1 : -1;
    /* Y Speed */
    this.v.y = THREE.MathUtils.randFloat(0.001, 0.006);
    this.v.y *= Math.random() > 0.5 ? 1 : -1;
    /* Z Speed */
    this.v.z = THREE.MathUtils.randFloat(0.001, 0.006);
    this.v.z *= Math.random() > 0.5 ? 1 : -1;

    this.size = Math.random() * 4 + 0.5 * pixelRatio;
    this.slowDown = 0.4 + Math.random() * 0.58;
    this.color = color;
  }
  update() {
    if (this.v.x > 0.001 || this.v.y > 0.001 || this.v.z > 0.001) {
      this.add(this.v);
      this.v.multiplyScalar(this.slowDown);
    }
  }
}



let _prev = 0;
function tick(delta, elapsedTime) {

  // group.rotation.x = Math.sin(elapsedTime * 0.0003) * 0.1;
  // group.rotation.y += 0.001;

  if (elapsedTime - _prev > 0.01) {

    lines.forEach((l) => {
      if (sparkles.length < 35000) {
        nextDot(l);
      
      }
      const tempVertices = new Float32Array(l.coordinates);
      l.geometry.setAttribute("position", new THREE.BufferAttribute(tempVertices, 3));
      l.geometry.computeBoundingSphere();
    });
    updateSparklesGeometry();
    _prev = elapsedTime;
  }

  let tempSparklesArray = [];
  sparkles.forEach((s) => {
    s.update();
    tempSparklesArray.push(s.x, s.y, s.z);
  });

  sparklesGeometry.setAttribute("position", new THREE.Float32BufferAttribute(tempSparklesArray, 3));


}
function trans(path) {
  return path.map(p => new THREE.Vector3(p[0], p[2], -p[1]))
}
function createTest() {
  const group = new THREE.Group();
  // 使用polyVe创建点
  const points = trans(polyVe);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.PointsMaterial({ size: 0.1 });
  const pointsObj = new THREE.Points(geometry, material);
  group.add(pointsObj);
  return group;
}
const animation = {
  createLine,
  tick,
  createTest
}
export default animation;