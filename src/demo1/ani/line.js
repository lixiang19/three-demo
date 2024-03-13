import * as THREE from 'three';

import LightningStrike from '../lib/LightningStrike.js'
import { createXRayMaterial } from './xRayMaterial.js'
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import BrainModel from '../assets/model/brainNew.glb?url';


import dotTexture from '../assets/textures/dotTexture.png?url';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';
import { MeshLine, MeshLineGeometry, MeshLineMaterial } from '@lume/three-meshline'
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { Dcel } from 'three-halfedge-dcel';
import { randomBetween, pickOne, getRandomElementsFromArray } from '../utils.js';

import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;
const pixelRatio = 2
const group = new THREE.Group();
const edgesMap = {};
let pointLineMap = {}
const indexWaveMap = {}
let lightningStrikeList = []
const allLineList = []
let lines = []
let shaderMaterial = null
let meshModel = null;
let camera
let dcel
function createTube(curve) {
  const tubeGeometry = new THREE.TubeGeometry(curve, 200, 0.005, 8, false);

  const vertexShader = `
  varying vec2 vUv;
  uniform float time;
  varying float vProgress;

  void main() {
    vUv = uv;

    vec3 p = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
    `;
  const fragmentShader = `
    uniform float time;
    uniform vec3 color;
    uniform vec3 emissive; // 新增emissive变量来控制发光颜色
    varying vec2 vUv;
    varying float vProgress;
    uniform float progress; // 用于控制动画进度的uniform变量
    void main() {
      if (vUv.x > progress) discard; // 如果顶点的位置大于动画进度，则不显示该片元
      if (vUv.x < 0.01) discard; //
      // 直接将emissive颜色添加到color上，使其始终影响最终颜色，而与进度无关
      vec3 finalColor = color + emissive;
      gl_FragColor = vec4(finalColor, 1.0); // 设置片元的颜色和透明度
    }
  `;
  const uniforms = {
    time: { value: 0 },
    progress: { value: 0.0 }, // 初始化progress值为0
    color: { value: new THREE.Color("rgb(205, 127, 50)") },
    emissive: { value: new THREE.Color("rgb(248, 226, 158)") },// 159, 213, 255

  };
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const tube = new THREE.Mesh(tubeGeometry, shaderMaterial);
  return tube
}
const raycaster = new THREE.Raycaster();
function setupModel(loadedData) {
  const model = loadedData.scene.children[0];

  model.traverse((object) => {
    if (object.isMesh) {
      const geometry = object.geometry;
      object.geometry.center()
      // object.geometry.rotateX(Math.PI * -0.5);
      // object.geometry.rotateY(Math.PI * -0.3);


      dcel = new Dcel(geometry);
      object.geometry.computeBoundsTree();
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
  // testDcel()
  testRaycaster()

  return group;
}
function getControlPoint(v1, v2) {
  const cpLength = v1.distanceTo(v2) / THREE.MathUtils.randFloat(1.0, 4.0);
  var dirVec = new THREE.Vector3().copy(v2).sub(v1).normalize();
  var northPole = new THREE.Vector3(0, 0, 1); // this is original axis where point get sampled
  var axis = new THREE.Vector3().crossVectors(northPole, dirVec).normalize(); // get axis of rotation from original axis to dirVec
  var axisTheta = dirVec.angleTo(northPole); // get angle
  var rotMat = new THREE.Matrix4().makeRotationAxis(axis, axisTheta); // build rotation matrix

  var minz = Math.cos(THREE.MathUtils.degToRad(45)); // cone spread in degrees
  var z = THREE.MathUtils.randFloat(minz, 1);
  var theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
  var r = Math.sqrt(1 - z * z);
  var cpPos = new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), z);
  cpPos.multiplyScalar(cpLength); // length of cpPoint
  cpPos.applyMatrix4(rotMat); // rotate to dirVec
  cpPos.add(v1); // translate to v1
  return cpPos;
};
function renderLine(startIndex, degs) {
  const face = dcel.faces[startIndex]
  const LINE_LENGTH = 3
  const edge = face.edge
  const vertexPosition = face.edge.vertex.point
  const vertexNormal = face.normal
  let nextPoint = edge.next.vertex.point
  // let lineEnd = new THREE.Vector3().addVectors(vertexPosition, vertexNormal.normalize().multiplyScalar(10));
  // createOneLine(vertexPosition, lineEnd, 0xff0000)

  let originalDirection = new THREE.Vector3().subVectors(nextPoint, vertexPosition).normalize();
  let lineEndNext = new THREE.Vector3().addVectors(vertexPosition, originalDirection.multiplyScalar(LINE_LENGTH));
  // createOneLine(vertexPosition, lineEndNext, 0x00ff00)
  const lineCurveDirection = new THREE.LineCurve3(vertexPosition, lineEndNext);
  projection(lineCurveDirection, vertexNormal)
  const degList = []
  for (let index = 0; index < 20; index++) {
    const startDeg = degs[0]
    const endDeg = degs[1]
    const deg = randomBetween(startDeg, endDeg)
    degList.push(deg)
  }
  //  [30, 60, 90, 110, 150, 180, 210, 240, 270, 300, 330]
  degList.forEach((deg) => {
    let rotationAxis = vertexNormal.normalize();
    let quaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, THREE.MathUtils.degToRad(deg));
    let direction = originalDirection.clone().applyQuaternion(quaternion);
    let lineEnd = new THREE.Vector3().addVectors(vertexPosition, direction.multiplyScalar(LINE_LENGTH));
    const lineCurve = new THREE.LineCurve3(vertexPosition, lineEnd);
    projection(lineCurve, vertexNormal)
  })
}
function testRaycaster() {
  const startIndex = 51548
  renderLine(startIndex, [-90, 90])


  renderLine(14562, [180, 270])
  // 沿着法线画一条线，长度1

  // let lineEnd = new THREE.Vector3().addVectors(vertexPosition, vertexNormal.normalize().multiplyScalar(10));
  // createOneLine(vertexPosition, lineEnd, 0xff0000)


  // 计算线的终点：在vertexPosition的基础上加上标准化的方向向量

  // createOneLine(vertexPosition, lineEndNext, 0x00ff00)

  // let rotationAxis = vertexNormal.normalize();
  // let quaternion30 = new THREE.Quaternion().setFromAxisAngle(rotationAxis, THREE.MathUtils.degToRad(260));
  // let direction30 = originalDirection.clone().applyQuaternion(quaternion30);
  // let lineEnd30 = new THREE.Vector3().addVectors(vertexPosition, direction30.multiplyScalar(10));
  // createOneLine(vertexPosition, lineEnd30, 0xffff00); // 使用不同的颜色来区分
  // const lineCurveDirection30 = new THREE.LineCurve3(vertexPosition, lineEnd30);
  // projection(lineCurveDirection30, vertexNormal)
}
function projection(lineCurveDirection, vertexNormal) {
  const numberOfPoints = 15;
  const pointsDirection = lineCurveDirection.getPoints(numberOfPoints);
  const curvesPoints = []
  pointsDirection.forEach((point, index) => {
    const rayPoint = point
    const rayOrigin = new THREE.Vector3().addVectors(rayPoint, vertexNormal.normalize().multiplyScalar(10));
    const rayDirection = new THREE.Vector3().subVectors(rayPoint, rayOrigin).normalize();

    // createOneLine(rayOrigin, rayPoint)
    raycaster.set(rayOrigin, rayDirection);
    raycaster.firstHitOnly = true;
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
  if (curvesPoints.length > 0) {
    // 把curvesPoints的点，每两个之间加个控制点getControlPoint
    const controlPoints = []
    for (let i = 0; i < curvesPoints.length - 2; i++) {
      controlPoints.push(curvesPoints[i])
      controlPoints.push(getControlPoint(curvesPoints[i], curvesPoints[i + 1]))
    }

    const curve = new THREE.CatmullRomCurve3(controlPoints);

    const tube = createTube(curve);

    group.add(tube);
    lines.push(tube)
  }

  // const points = curve.getPoints(50);
  // const geometry = new THREE.BufferGeometry().setFromPoints(points);
  // const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  // const curveObject = new THREE.Line(geometry, material);
  // group.add(curveObject);
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

  if (lines.length > 0) {
    lines.forEach((tube) => {
      tube.material.uniforms.progress.value += 0.010;
      // tube.material.uniforms.time += 0.1
      if (tube.material.uniforms.progress.value > 1.5) {
        tube.material.uniforms.progress.value = 0
      }
      // tube.material.uniforms.time.value += 0.1

    });
  }
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

