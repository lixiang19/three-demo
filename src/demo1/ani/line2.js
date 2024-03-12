import * as THREE from 'three';

import LightningStrike from '../lib/LightningStrike.js'
import {createXRayMaterial} from './xRayMaterial.js'
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
polyVePoints = getRandomElementsFromArray(polyVePoints, 0.5)
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
async function createLineAni() {
  const { model, brainData } = await createBrain();
  createModel(model);
  createLineBg()
  group.position.set(0, -100, 0);
  return group;
}



// 创建模型
function createModel(model) {
  // 创建自定义的着色器材质


  let mesh = new THREE.Mesh(model.geometry,  createXRayMaterial());
  // mesh.scale.set(0.9, 0.9, 0.9);
  // mesh.position.set(0, 15, 0);
  group.add(mesh);

}


// 测试线条
function createLineBg() {
  const minRange = 20;
  const nearList = []
  const maxRange =30;

  polyVePoints.forEach((point, index) => {
    pointLineMap[index] = []
    // 遍历剩余的点
    for (let i = index + 1; i < polyVePoints.length; i++) {
      if (i === index) {
        continue
      }
      const otherPoint = polyVePoints[i];
      // 计算距离
      const distance = point.distanceTo(otherPoint);
      // const distance = 1
      // 如果距离在特定范围内，则创建线段
      if (distance >= minRange && distance <= maxRange) {
        if (!edgesMap[`${index}-${i}`]) {
          pointLineMap[index].push(i)
          edgesMap[`${index}-${i}`] = true
          edgesMap[`${i}-${index}`] = true
        }

      }
    }
    pointLineMap[index].forEach((otherIndex) => {
      createOneLine(index, otherIndex)
    })
  });

}
function createOneLine(index, otherIndex) {
  const point = polyVePoints[index]
  const otherPoint = polyVePoints[otherIndex]
  if (!indexWaveMap[index]) {
    indexWaveMap[index] = randomArray(
      [new THREE.Vector3(1.0, 0.0, 0.0),
      new THREE.Vector3(0.0, 1.0, 0.0),
      new THREE.Vector3(0.0, 0.0, 1.0),
      new THREE.Vector3(0.0, 0.0, 0.0),
      ]
    )
  }
  if (!indexWaveMap[otherIndex]) {
    indexWaveMap[otherIndex] = randomArray(
      [new THREE.Vector3(1.0, 0.0, 0.0),
      new THREE.Vector3(0.0, 1.0, 0.0),
      new THREE.Vector3(0.0, 0.0, 1.0),
      new THREE.Vector3(0.0, 0.0, 0.0),
      ]
    )
  }

  const startWaveDir = indexWaveMap[index]
  const endWaveDir = indexWaveMap[otherIndex]
  let matLine = new LineMaterial({
    transparent: true,
    color: 0x6ea0ff,
    linewidth: 0.002, // in pixels
    opacity: 0.05,
    alphaToCoverage: true,
    onBeforeCompile: shader => {
      shader.uniforms.time = { value: 0 };
      shader.uniforms.isShow = { value: true };
      shader.uniforms.startWaveDir = { value: startWaveDir };
      shader.uniforms.endWaveDir = { value: endWaveDir };
      shader.fragmentShader = `
        uniform bool isShow;
      ${shader.fragmentShader}
      `
        .replace(
          `gl_FragColor = vec4( diffuseColor.rgb, alpha );`,
          `
          if (isShow) {
            gl_FragColor = vec4( diffuseColor.rgb, alpha );
          } else {
            discard;
          }
          `
        )
      shader.vertexShader = `
        uniform float time;
        uniform vec3 startWaveDir;
        uniform vec3 endWaveDir;
        
        ${shader.vertexShader}
      `.replace(
        `	vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );`,
        ` vec4 end = modelViewMatrix * vec4(instanceEnd, 1.0);

        // Apply wave effect
        if (startWaveDir.x > 0.5) {
            start.x -= sin(time) * 4.0 ;
        }
        if (endWaveDir.x > 0.5) {
          end.x -= sin(time) * 4.0 ;
        }
       
        if (startWaveDir.y > 0.5) {
         start.y += sin(start.y* 1.0 + time) * 4.0;
        } 
        if (endWaveDir.y > 0.5) {
          end.y += sin(end.y* 1.0 +time) * 4.0;
         } 
   
         if (startWaveDir.z > 0.5) {
          start.z += sin(start.z * 1.0 + time) * 4.0;
       
         } 
          if (endWaveDir.z > 0.5) {
            end.z += sin(end.z * 1.0 + time) * 4.0;
          }


        `
      );
    }


  });
  let geometry = new LineGeometry();
  geometry.setPositions([point.x, point.y, point.z, otherPoint.x, otherPoint.y, otherPoint.z]);
  const line2 = new Line2(geometry, matLine);
  allLineList.push(line2)
  group.add(line2)
}

let lastUpdateTime = 0; // 上次更新时间
// 累积时间
let accumulatedTime = 0;
const updateInterval = 3; // 更新间隔（秒）
let selectedIndices = new Set(); // 当前选中点的索引集合
const lineIndexTime = {}
function tick(delta, elapsedTime) {
  group.rotation.y += 0.0002;
  allLineList.forEach((line, index) => {
    line.material.uniforms.time.value += delta;
    if (index < 200) {
      if (!lineIndexTime[index]) {
        lineIndexTime[index] = {
          timeMax: randomBetween(3, 6),
          time: 0
        }
      }
      lineIndexTime[index].time += delta
      if (lineIndexTime[index].time > lineIndexTime[index].timeMax) {
        line.material.uniforms.isShow.value = !line.material.uniforms.isShow.value
        lineIndexTime[index].time = 0
        lineIndexTime[index].timeMax = randomBetween(3, 6)
      }
    }
  });
}

// 写个函数从数组中随机出一个
function randomArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
const animation = {
  createLineAni,
  tick
}
export default animation;

