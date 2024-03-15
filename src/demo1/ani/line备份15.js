import * as THREE from 'three';

import LightningStrike from '../lib/LightningStrike.js'
import { createXRayMaterial } from './xRayMaterial.js'
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import BrainModel from '../assets/model/brainNew.glb?url';
import { filter, random, shuffle } from 'lodash-es'

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
/**
 * 多段式投影的思路我认为是正确的。
 * 但是第二段的方向和法线的方向现在计算都有问题，肯定还有更好的效果算法。
 */
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
function toVector3(point) {
  return new THREE.Vector3(point.x, point.y, point.z)
}
function renderTube(points) {
  const curve = new THREE.CatmullRomCurve3(points);
  const tube = createTube(curve);
  lines.push(tube)
  group.add(tube);

}
function createTube(curve) {
  const tubeGeometry = new THREE.TubeGeometry(curve, 200, 0.01, 8, false);

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
      // float stripe = step(0.5, fract(vUv.x * 2.0));
      // vec3 c = mix(color, emissive, stripe);
      // gl_FragColor = vec4(color, 1.0);
      vec3 finalColor = color + emissive;
      gl_FragColor = vec4(finalColor, 1.0); // 设置片元的颜色和透明度
    }
  `;
  const uniforms = {
    time: { value: 0 },
    progress: { value: 1.0 }, // 初始化progress值为0
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
  console.log("🚀 ~ setupModel ~ meshModel", meshModel)
  return meshModel;
}

async function createBrain() {
  const loader = new GLTFLoader();
  const loadedData = await loader.loadAsync(BrainModel);
  const model = setupModel(loadedData);
  return { model, brainData: loadedData };
}
const data1 = {
  point: {
    "x": -7.993107463081934,
    "y": 1.5482057900914548,
    "z": 0.0019183781257332555
  },
  endPoint: {
    "x": -6.139877488880918,
    "y": 4.650270274567724,
    "z": 0.9985661733127174
  },
  normal: {
    "x": -0.8904099856370942,
    "y": 0.4535326493055783,
    "z": -0.020816717564576866
  }
}
async function createLineAni(ca) {
  camera = ca
  const { model, brainData } = await createBrain();
  setDot()
  createModel(model);

  createPoint(new THREE.Vector3(0, 0, 0), 0xff0000)
  setTimeout(() => {
    createTrees(data1)
  }, 1000)
  return group;
}
function createTrees(data1) {
  createTree(data1, 3)
  const startPoint = toVector3(data1.point)
  const endPoint = toVector3(data1.endPoint)
  const normal = toVector3(data1.normal).normalize()
  createOneLine(startPoint, endPoint, 0x00ff00)

  // createPoint(endPoint, 0x00ff00)
  // 0-360,每隔5度
  for (let i = 10; i < 350; i += 30) {
    const newEndPoint = calcRotateLine(startPoint, endPoint, normal, i)
    createTree({
      point: startPoint,
      endPoint: newEndPoint,
      normal
    }, 3)
  }
  // const newEndPoint = calcRotateLine(startPoint, endPoint, normal, 30)
  // createTree({
  //   point: startPoint,
  //   endPoint: newEndPoint,
  //   normal
  // }, 4)
}
// 根据level取树对应层级的数组，tree的子节点在children中，tree本身是个数组
function getTreeLevel(tree, level) {
  const result = []
  function findLevel(tree, level) {
    tree.forEach(item => {
      if (item.level === level) {
        result.push(item)
      } else {
        findLevel(item.children, level)
      }
    })
  }
  findLevel(tree, level)

  return result
}
function filterRayPoints(rayPoints) {
  return rayPoints.filter(p => p.distanceTo(new THREE.Vector3(0, 0, 0)) > 2)
}
function createTree(originData, count) {
  const tree = [
    {
      level: 0,
      rayPoints: [],
      lineData: {
        startPoint: toVector3(originData.point),
        endPoint: toVector3(originData.endPoint),
        normal: toVector3(originData.normal).normalize()
      },
      points: [],
      children: []
    }
  ] // 先写成先收集在渲染
  for (let index = 0; index < count; index++) {
    const currentLevel = getTreeLevel(tree, index)

    currentLevel.forEach(treeItem => {
      const startPoint = treeItem.lineData.startPoint
      const endPoint = treeItem.lineData.endPoint
      const startNormal = treeItem.lineData.normal
      const rayPoints = calcRayPoints(startPoint, endPoint, startNormal)
      treeItem.rayPoints = rayPoints
      treeItem.points = filterRayPoints([startPoint].concat(rayPoints.map(p => p.point)).concat([endPoint]))
      const newNormal = rayPoints[rayPoints.length - 1].normal
      let degList = shuffle([-30, 5, -20, 30, 20]).slice(0, 2)
      if (index === 0) {
        degList = [30, -30]
      }
      // const degList = [30, -30]
      degList.forEach((angle) => {
        const { secondStartPoint, secondEndPoint } = calcNextLine(startPoint, endPoint, newNormal, angle)
        const secondRayPoints = calcRayPoints(secondStartPoint, secondEndPoint, newNormal)
        const secondTreeItem = {
          level: index + 1,
          rayPoints: secondRayPoints,
          points: filterRayPoints([secondStartPoint].concat(secondRayPoints.map(p => p.point)).concat([secondEndPoint])),
          lineData: {
            startPoint: secondStartPoint,
            endPoint: secondEndPoint,
            normal: newNormal
          },
          children: []
        }
        treeItem.children.push(secondTreeItem)
      })
    })
  }
  // 渲染
  renderTree(tree)
}

async function renderTree(tree) {
  const children = []
  for (const treeItem of tree) {
    renderTube(treeItem.points); // 渲染当前项目
    if (treeItem.children.length > 0) {
      children.push(...treeItem.children)
    }
  }
  // await sleep(1000); // 确保等待1秒
  await renderTree(children); // 递归渲染子项目
}
function renderNormal(point, normal) {
  const endPoint = new THREE.Vector3().addVectors(point, normal.normalize().multiplyScalar(5));
  createOneLine(point, endPoint, 0xff0000)

}
function calcRotateLine(startPoint, endPoint, startNormal, deg) {
  const LENGTH = 6
  let originalDirection = new THREE.Vector3().subVectors(endPoint, startPoint).normalize(); //旋转的其实是个方向向量
  let rotationAxis = startNormal.normalize();
  let quaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, THREE.MathUtils.degToRad(deg));
  let direction = originalDirection.clone().applyQuaternion(quaternion);
  let newEndPoint = new THREE.Vector3().addVectors(startPoint, direction.multiplyScalar(LENGTH));

  // renderNormal(startPoint, startNormal)

  // createPoint(newEndPoint, 0xff0000)
  // createOneLine(startPoint, newEndPoint, 0x00ffff)

  // createOneLine(newEndPoint, new THREE.Vector3(0, 0, 0), 0xffffff)
  const o = new THREE.Vector3(0, 0, 0)
  const newDirection = new THREE.Vector3().subVectors(o, newEndPoint).normalize();
  const secondEndP = getRayP(newEndPoint, newDirection)

  // createPoint(secondEndP.point, 0xff00ff)
  createOneLine(startPoint, secondEndP.point, 0x3c00ff)
  return secondEndP.point
}
function checkInMesh(point) {

}
function calcNextLine(startPoint, endPoint, startNormal, deg) {
  // renderNormal(startPoint, startNormal)
  // 先计算startPoint和endPoint连线的延长线，
  const LENGTH = 4
  const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
  let newEndPoint = new THREE.Vector3().addVectors(endPoint, direction.multiplyScalar(LENGTH));
  // createOneLine(endPoint, newEndPoint, 0x00ffff)
  // newEndPoint需要绕着startNormal旋转30度
  const angle = THREE.MathUtils.degToRad(deg); // 将角度转换为弧度
  const rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationAxis(startNormal.normalize(), angle);
  // 应用旋转矩阵到newEndPoint
  newEndPoint.applyMatrix4(rotationMatrix);

  const o = new THREE.Vector3(0, 0, 0)
  let newDirection = new THREE.Vector3().subVectors(o, newEndPoint).normalize();
  let secondEndP = getRayP(newEndPoint, newDirection)
  // if (!secondEndP) {
  //   // 证明起点rayOrigin在模型内部,延长一下newEndPoint的位置
  //   newEndPoint = new THREE.Vector3().addVectors(newEndPoint, direction.multiplyScalar(2));
  //   newDirection = new THREE.Vector3().subVectors(o, newEndPoint).normalize();
  //   secondEndP = getRayP(newEndPoint, newDirection)
  // }
  const secondStartPoint = endPoint
  // createPoint(secondEndP.point, 0xff00ff)
  // createOneLine(secondStartPoint, secondEndP.point, 0x3c00ff)
  // createPoint(newEndPoint, 0xff0000)
  // createOneLine(endPoint, newEndPoint, 0x00ffff)
  // createOneLine(newEndPoint, new THREE.Vector3(0, 0, 0), 0xffffff)
  return {
    secondStartPoint,
    secondEndPoint: secondEndP.point
  }
}
// 判断奇数
function isOdd(num) {
  return num % 2
}
function getRayP(rayOrigin, rayDirection) {
  raycaster.set(rayOrigin, rayDirection);
  // raycaster.firstHitOnly = false
  const intersects = raycaster.intersectObject(meshModel); // 假设mesh是你的模型对象

  if (intersects.length > 0) {
    // if (isOdd(intersects.length)) {
    //   return false
    // }
    const p = intersects[0]
    return p
  } else {
    return null
  }
}
function calcRayPoints(startPoint, endPoint, vertexNormal) {
  const lineCurveDirection = new THREE.LineCurve3(startPoint, endPoint);
  const numberOfPoints = 30; // 取点的精度
  const pointsDirection = lineCurveDirection.getPoints(numberOfPoints);
  const rayPoints = []
  pointsDirection.forEach((point, index) => {
    const rayPoint = point
    const rayOrigin = new THREE.Vector3().addVectors(rayPoint, vertexNormal.normalize().multiplyScalar(10));
    const rayDirection = new THREE.Vector3().subVectors(rayPoint, rayOrigin).normalize();
    raycaster.set(rayOrigin, rayDirection);
    raycaster.firstHitOnly = true;
    var intersects = raycaster.intersectObject(meshModel); // 假设mesh是你的模型对象
    if (intersects.length > 0) {
      // 这里排除距离00点太近的点
      // if (intersects[0].point.distanceTo(new THREE.Vector3(0, 0, 0)) > 2) {
      //   rayPoints.push(intersects[0])
      // }
      rayPoints.push(intersects[0])
    }
  })
  return rayPoints
}


function getControlPoint(v1, v2) {
  // const cpLength = v1.distanceTo(v2) / THREE.MathUtils.randFloat(0.1, 1.0);
  const cpLength = 2
  console.log("🚀 ~ getControlPoint ~ cpLength:", cpLength)
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

  const geometry = new THREE.SphereGeometry(0.1, 32, 32);
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



function createOneLine(point, otherPoint, color) {

  let matLine = new LineMaterial({
    color: color || 0xffffff,
    linewidth: 0.002, // in pixels
    transparent: true,
    opacity: 0.3,
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
      tube.material.uniforms.progress.value += 0.005;
      // tube.material.uniforms.time += 0.1
      // if (tube.material.uniforms.progress.value > 1.5) {
      //   tube.material.uniforms.progress.value = 0
      // }
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
