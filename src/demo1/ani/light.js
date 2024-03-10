import * as THREE from 'three';
import {createXRayMaterial} from './xRayMaterial.js'
import LightningStrike from '../lib/LightningStrike.js'

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import BrainModel from '../assets/model/brain5000.glb?url';
import dotTexture from '../assets/textures/dotTexture.png?url';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';
import { MeshLine, MeshLineGeometry, MeshLineMaterial } from '@lume/three-meshline'
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import polyVe from '../data/polyVeLess.json'
import { randomBetween, pickOne, getRandomElementsFromArray } from '../utils.js';
const pixelRatio = 2
const group = new THREE.Group();
const edgesMap = {};
let pointLineMap = {}
const indexWaveMap = {}
let lightningStrikeList = []
const allLineList = []
let shaderMaterial = null
// const polyVePoints = polyVe.map(p => new THREE.Vector3(p[0], p[2], -p[1]))
// 函数：生成两数之间的随机数，可以为负数

// 将polyVePoints剔除 30% .filter((p, i) => i % 2 === 0)
// let polyVePoints = polyVe.map(p => new THREE.Vector3(p[0], p[2], -p[1]))
// polyVePoints = getRandomElementsFromArray(polyVePoints, 0.4)
// console.log(polyVePoints)
let polyVePoints = polyVe.map(p => new THREE.Vector3(p.x, p.y, p.z))
// polyVePoints = getRandomElementsFromArray(polyVePoints, 0.6)
function setupModel(loadedData) {
  const model = loadedData.scene.children[0];
  let meshModel = null
  model.traverse((object) => {
    if (object.isMesh) {
      meshModel = object;
    }
  });
  return meshModel;
}
async function createBrain() {
  const loader = new GLTFLoader();
  const loadedData = await loader.loadAsync(BrainModel);
  const model = setupModel(loadedData);
  return { model, brainData: loadedData };
}
async function main() {
  const { model, brainData } = await createBrain();
  createModel(model);

  group.position.set(0, -100, 0);
  setTimeout(() => {
    
  createLightAni()
  } , 2000)
  return group;
}
function createLightAni() {
  const maxRange = 60;
  const minRange = 50;
  console.log('polyVePoints',polyVePoints)
  let count = 0
  // const lightingPoints = getRandomElementsFromArray(polyVePoints, 0.01)
  const lightingPoints = [polyVePoints[300]]
  lightingPoints.forEach((point, index) => {
    pointLineMap[index] = {}
    // 遍历剩余的点
    for (let i = index + 1; i < polyVePoints.length; i++) {
      const otherPoint = polyVePoints[i];
      // 计算距离
      const distance = point.distanceTo(otherPoint);

      // 如果距离在特定范围内，则创建线段
      if (distance <= maxRange && distance >= minRange) {
        count++
        if (count>= 6) {
          return
        }
        createLightning(point, otherPoint)

      }
    }
  });
}
// 创建闪电
function createLightning(sourceOffset, destOffset) {
  console.log('创建了闪电',)
  const rayParams = {
    sourceOffset: sourceOffset,
    destOffset: destOffset,
    radius0: 0.2,
    radius1: 0.1,
    maxIterations: 7,
    isEternal: true,
    timeScale: 0.7,
    propagationTimeFactor: 0.05,
    vanishingTimeFactor: 0.95,
    subrayPeriod: 10,
    subrayDutyCycle: 0.2,
    maxSubrayRecursion: 3,
    ramification: 3,
    recursionProbability: 0.6,

    roughness: 0.85,
    straightness: 0.8
  }
  const lightningMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      void main() {
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
        void main() {
          gl_FragColor = vec4(2.0, 2.0, 2.0, 1.0);
        }`,
  });
  const lightningStrike = new LightningStrike(rayParams);
  const lightningStrikeMesh = new THREE.Mesh(lightningStrike, lightningMaterial);
  lightningStrikeList.push(lightningStrike)
  group.add(lightningStrikeMesh);

}

// 创建模型
function createModel(model) {
  // 创建自定义的着色器材质
  const shaderMaterial = createXRayMaterial()
  console.log(shaderMaterial)
  shaderMaterial.uniforms.p.value = 2.0
  // shaderMaterial.uniforms.teColor.value = new THREE.Color(0xffffff)
  let mesh = new THREE.Mesh(model.geometry, shaderMaterial);

  group.add(mesh);

}


let lastUpdateTime = 0; // 上次更新时间
// 累积时间
let accumulatedTime = 0;
const updateInterval = 1; // 更新间隔（秒）
let selectedIndices = new Set(); // 当前选中点的索引集合
const lineIndexTime = {}
function tick(delta, elapsedTime) {
  group.rotation.y += 0.0001;

  if (elapsedTime > 3) {
    lightningStrikeList.forEach(lightningStrike => {
      lightningStrike.update(elapsedTime);
    })
    accumulatedTime = elapsedTime - lastUpdateTime;
    if (accumulatedTime > updateInterval) {
      lastUpdateTime = elapsedTime;
      lightningStrikeList.forEach(lightningStrike => {
        if (Math.random()>0.3) {
          return
        }
        const point = pickOne(polyVePoints)
        lightningStrike.rayParameters.destOffset.copy(point);
        if (Math.random()>0.9) {
          const point = pickOne(polyVePoints)
          lightningStrike.rayParameters.sourceOffset.copy(point);
        }
      })
    }

  }
}

// 写个函数从数组中随机出一个
function randomArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
const animation = {
  main,
  tick
}
export default animation;

