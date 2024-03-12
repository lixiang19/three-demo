import * as THREE from 'three';

import LightningStrike from '../lib/LightningStrike.js'
import {createXRayMaterial} from './xRayMaterial.js'
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import BrainModel from '../assets/model/brainAll.glb?url';
import dotTexture from '../assets/textures/dotTexture.png?url';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';
import { MeshLine, MeshLineGeometry, MeshLineMaterial } from '@lume/three-meshline'
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { Dcel } from 'three-halfedge-dcel';
import { randomBetween, pickOne, getRandomElementsFromArray } from '../utils.js';
const pixelRatio = 2
const group = new THREE.Group();
const edgesMap = {};
let pointLineMap = {}
const indexWaveMap = {}
let lightningStrikeList = []
const allLineList = []
let shaderMaterial = null

let dcel
function setupModel(loadedData) {
  const model = loadedData.scene.children[0];
  let meshModel = null;

  model.traverse((object) => {
    if (object.isMesh) {
      const geometry = object.geometry;

      dcel = new Dcel(geometry);
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
  // createLineBg()
  testDcel()
  return group;
}

function testDcel() {
  console.log("🚀 ~ testDcel ~ dcel", dcel)
  const  polyVePoints = dcel.vertices

  const startIndex =1
  createPoint(polyVePoints[startIndex].point, 0xff0000)
  const face = dcel.faces[startIndex]
  const edge = face.edge
  // createTriangle(edge) 
  let startPoint = edge.vertex.point
  let nextPoint = edge.next.vertex.point
  let prePoint = edge.prev.vertex.point

  dcel.forAdjacentFaces(startIndex,(adjacentFaceIndex)=>{

    const face = dcel.faces[adjacentFaceIndex]
    console.log("🚀 ~ testDcel ~ adjacentFaceIndex", adjacentFaceIndex,face.edge.vertex.point)
    createPoint(face.edge.vertex.point, 0xffff00)
    createTriangle(face.edge, 0x00ff00)
  }) 
}
function createPoint(point, color = 0xffff00) {
 
  const geometry = new THREE.SphereGeometry(0.05, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: color  });
  const sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(point.x, point.y, point.z);
  group.add(sphere);
}
// 获取一个随机颜色
function getRandomColor() {
  return Math.random() * 0xffffff;
}
function createTriangle(edge, color = 0xff0000) {
  const startPoint = edge.vertex.point

  const nextPoint = edge.next.vertex.point
  const otherPoint = edge.prev.vertex.point
  // 画个三角形
  const vertices = new Float32Array([
    startPoint.x, startPoint.y, startPoint.z,
    nextPoint.x, nextPoint.y, nextPoint.z,
    otherPoint.x, otherPoint.y, otherPoint.z,
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  const material = new THREE.MeshBasicMaterial({ color:color });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
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
  const list = polyVePoints.slice(0,100)
  
  list.forEach((point, index) => {
 
    const otherIndex = (index + 1) % polyVePoints.length
    const startPoint = list[index]
    const endPoint = list[otherIndex]
    if (startPoint&&endPoint) {
      createOneLine(startPoint, endPoint)
    }
   
  })
}
function createOneLine(point, otherPoint, color) {

  let matLine = new LineMaterial({
    color: color||0xffffff,
    linewidth: 0.001, // in pixels
    opacity: 1,
    alphaToCoverage: true,
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

