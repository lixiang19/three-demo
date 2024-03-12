import * as THREE from 'three';

import LightningStrike from '../lib/LightningStrike.js'
import { createXRayMaterial } from './xRayMaterial.js'
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
let meshModel = null;
let camera
let dcel
const raycaster = new THREE.Raycaster();
function setupModel(loadedData) {
  const model = loadedData.scene.children[0];

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
async function createLineAni(ca) {
  camera = ca
  const { model, brainData } = await createBrain();
  createModel(model);
  setDot()
  // createLineBg()
  testDcel()
  testRaycaster()
  return group;
}
function testRaycaster() {


  const startIndex = 51541
  const face = dcel.faces[startIndex]
  console.log("🚀 ~ testRaycaster ~ face", face)
  const vertexPosition = face.edge.vertex.point
  const vertexNormal = face.normal
  var arrowHelper = new THREE.ArrowHelper(vertexNormal.normalize(), vertexPosition, 1, 0xff0000);
  group.add(arrowHelper);

  // 沿着法线画一条线，长度1

  let lineEnd = new THREE.Vector3().addVectors(vertexPosition, vertexNormal.normalize().multiplyScalar(10));
  createOneLine(vertexPosition, lineEnd, 0xff0000)

  const edge = face.edge
  // let nextPoint = edge.next.vertex.point
  let nextPoint = dcel.faces[31628].edge.vertex.point
  // 从vertexPosition到nextPoint画一条线，长度1
  let direction = new THREE.Vector3().subVectors(nextPoint, vertexPosition);

  // 将方向向量标准化，确保其长度为1
  direction.normalize();

  // 计算线的终点：在vertexPosition的基础上加上标准化的方向向量
  let lineEndNext = new THREE.Vector3().addVectors(vertexPosition, direction.multiplyScalar(10));
  createOneLine(vertexPosition, nextPoint, 0x00ff00)
  const lineCurveDirection = new THREE.LineCurve3(vertexPosition, nextPoint);
  projection(lineCurveDirection, vertexNormal)
  // let auxiliaryVector = new THREE.Vector3(0, 1, 0);

  // // 如果法线接近于Y轴，我们改用X轴作为辅助向量，以避免叉积结果接近于零向量
  // if (vertexNormal.y > 0.9) {
  //   auxiliaryVector.set(1, 0, 0);
  // }

  // let tangentVector = new THREE.Vector3().crossVectors(vertexNormal, auxiliaryVector).normalize();

  // // 将这个向量缩放为直线的长度
  // tangentVector.multiplyScalar(50);
  // let lineEnd = new THREE.Vector3().addVectors(vertexPosition, tangentVector);
  // createOneLine(vertexPosition, lineEnd, 0xff0000)
}
function projection(lineCurveDirection, vertexNormal) {
  const numberOfPoints = 50;
  const pointsDirection = lineCurveDirection.getPoints(numberOfPoints);
  const curvesPoints = []
  pointsDirection.forEach((point, index) => {
    const rayPoint = point
    const rayOrigin = new THREE.Vector3().addVectors(rayPoint, vertexNormal.normalize().multiplyScalar(10));
    const rayDirection = new THREE.Vector3().subVectors(rayPoint, rayOrigin).normalize();

    // createOneLine(rayOrigin, rayPoint)
    raycaster.set(rayOrigin, rayDirection);
    var intersects = raycaster.intersectObject(meshModel); // 假设mesh是你的模型对象

    if (intersects.length > 0) {
      // 如果有交点，intersects[0]是最近的交点


      const p = intersects[0].point;
      curvesPoints.push(p)
      // createPoint(p, 0xff0000)
    } else {
      // 没有交点，可以根据需要处理这种情况
    }
  })
  // 画个曲线
  const curve = new THREE.CatmullRomCurve3(curvesPoints);
  const points = curve.getPoints(50);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  const curveObject = new THREE.Line(geometry, material);
  group.add(curveObject);
}
function setDot() {
  window.addEventListener('mousedown', (event) => {
    // 将鼠标位置转换为归一化设备坐标(NDC)
    let mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(meshModel, true);

    if (intersects.length > 0) {
      console.log("🚀 ~ setDot ~ intersects", intersects)
      const point = intersects[0].point;
    }

  }, false);

}
function testDcel() {
  console.log("🚀 ~ testDcel ~ dcel", dcel)
  const polyVePoints = dcel.vertices

  const startIndex = 9151

  const face = dcel.faces[startIndex]
  const edge = face.edge
  console.log("🚀 ~ testDcel ~ edge", edge)
  createTriangle(edge)
  let startPoint = edge.vertex.point
  let nextPoint = edge.next.vertex.point
  let prePoint = edge.prev.vertex.point

  // dcel.forAdjacentFaces(startIndex, (adjacentFaceIndex) => {

  //   const face = dcel.faces[adjacentFaceIndex]
  //   console.log("🚀 ~ testDcel ~ adjacentFaceIndex", adjacentFaceIndex, face.edge.vertex.point)
  //   createPoint(face.edge.vertex.point, 0xffff00)
  //   createTriangle(face.edge, 0x00ff00)
  // })
}
function createPoint(point, color = 0xffff00) {

  const geometry = new THREE.SphereGeometry(0.05, 32, 32);
  const material = new THREE.MeshBasicMaterial({ color: color });
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
  console.log("🚀 ~ createTriangle ~ otherPoint", {
    startPoint,
    nextPoint,
    otherPoint
  })
  // 画个三角形
  const vertices = new Float32Array([
    startPoint.x, startPoint.y, startPoint.z,
    nextPoint.x, nextPoint.y, nextPoint.z,
    otherPoint.x, otherPoint.y, otherPoint.z,
  ]);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  const material = new THREE.MeshBasicMaterial({ color: color });
  const mesh = new THREE.Mesh(geometry, material);
  group.add(mesh);
}
// 创建模型
function createModel(model) {
  // 创建自定义的着色器材质


  let mesh = new THREE.Mesh(model.geometry, createXRayMaterial());
  // mesh.scale.set(0.9, 0.9, 0.9);
  // mesh.position.set(0, 15, 0);
  group.add(mesh);

}


// 测试线条
function createLineBg() {
  const list = polyVePoints.slice(0, 100)

  list.forEach((point, index) => {

    const otherIndex = (index + 1) % polyVePoints.length
    const startPoint = list[index]
    const endPoint = list[otherIndex]
    if (startPoint && endPoint) {
      createOneLine(startPoint, endPoint)
    }

  })
}
function createOneLine(point, otherPoint, color) {

  let matLine = new LineMaterial({
    color: color || 0xffffff,
    linewidth: 0.002, // in pixels
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

