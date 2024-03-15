import * as THREE from 'three';

import LightningStrike from '../lib/LightningStrike.js'
import { createXRayMaterial } from './xRayMaterial.js'
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import BrainModel from '../assets/model/BrainSurfaceMesh.glb?url';
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
  points.forEach((point, index) => {
    // createPoint(point)
  })
  const curve = new THREE.CatmullRomCurve3(points);
  const tube = createTube(curve);
  lines.push(tube)
  group.add(tube);

}
function createTube(curve) {
  const tubeGeometry = new THREE.TubeGeometry(curve, 200, 0.001, 8, false);

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

    // Brain_Part_02_Colour_Brain_Texture_0下面
    // Brain_Part_06_Colour_Brain_Texture_0001 外面
    // Brain_Part_04_Colour_Brain_Texture_0 里面
    if (object.isMesh && object.name === "Brain_Part_06_Colour_Brain_Texture_0001") {

      const geometry = object.geometry;
      object.geometry.center()
      // object.geometry.rotateX(Math.PI * -0.5);
      // object.geometry.rotateY(Math.PI * -0.3);


      // dcel = new Dcel(geometry);
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
    "x": 0.07875881616881569,
    "y": 0.16895576781042668,
    "z": -0.507447591730245
  },
  endPoint: {
    "x": 0.3148477202116762,
    "y": 0.08916859784034509,
    "z": -0.4574122092170475
  },
  normal: {
    "x": 0.2977913545927033,
    "y": 0.520199542064117,
    "z": -0.800178626169686
  }
}
const data2 = {
  point: {
    "x": -9.525335754942944,
    "y": 5.126066431324745,
    "z": -86.40493479857992
  },
  endPoint: {
    "x": -26.61317507143707,
    "y": 8.923917767135357,
    "z": -80.51237172670508
  },
  normal: {
    "x": -0.20353181386982763,
    "y": 0.0768931681507227,
    "z": -0.9758325877521297
  }

}
async function createLineAni(ca) {
  camera = ca
  const { model, brainData } = await createBrain();
  setDot()
  createModel(model);

  createPoint(new THREE.Vector3(0, 0, 0), 0xff0000)
  createPoint(toVector3(data1.point), 0x00ff00)
  createTrees(data1)
  return group;
}
function createTrees(data1) {
  createTree(data1, 5)
  const startPoint = toVector3(data1.point)
  const endPoint = toVector3(data1.endPoint)
  const normal = toVector3(data1.normal).normalize()
  createOneLine(startPoint, endPoint, 0x00ff00)
  const backList = [10, 50, 70, 110, 130, 140]
  backList.forEach((deg) => {
    const newEndPoint = calcRotateLine(startPoint, endPoint, normal, deg)
    if (newEndPoint) {
      createTree({
        point: startPoint,
        endPoint: newEndPoint,
        normal,
      }, 2, 0.2)
    }
  })
  const frontList = [150, 170, 200, 230, 270, 290, 330, 250]
  frontList.forEach((deg) => {
    const newEndPoint = calcRotateLine(startPoint, endPoint, normal, deg)
    if (newEndPoint) {
      createTree({
        point: startPoint,
        endPoint: newEndPoint,
        normal,
      }, 4)
    }
  })
  // const newEndPoint = calcRotateLine(startPoint, endPoint, normal, 10)
  // createTree({
  //   point: startPoint,
  //   endPoint: newEndPoint,
  //   normal
  // }, 3)
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
  return rayPoints
}
function createTree(originData, count, LENGTH = 0.3) {
  const tree = [
    {
      level: 0,
      rayPoints: [],
      lineData: {
        startPoint: toVector3(originData.point),
        endPoint: toVector3(originData.endPoint),
        rotateNormal: toVector3(originData.normal).normalize(),
        rayNormal: toVector3(originData.normal).normalize()
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
      const rotateNormal = treeItem.lineData.rotateNormal
      const rayNormal = treeItem.lineData.rayNormal
      const rayPoints = calcRayPoints(startPoint, endPoint, rayNormal)
      treeItem.rayPoints = rayPoints
      treeItem.points = filterRayPoints([startPoint].concat(rayPoints.map(p => p.point)).concat([endPoint]))

      const newRotateNormal = rayPoints[rayPoints.length - 1].normal
      // 旋转的角度

      let degList = [random(-40, 40), random(-10, 10)]
      // if (index = 0) {
      //   degList = [20 + random(-40, 40), 20 + random(-40, 40)]
      // }
      // const degList = [10]
      degList.forEach((angle) => {
        const { secondStartPoint, secondEndPoint, secondRayNormal, inMesh } = calcNextLine(startPoint, endPoint, rotateNormal, angle, LENGTH)
        if (inMesh) {
          return
        }
        const secondRayPoints = calcRayPoints(secondStartPoint, secondEndPoint, secondRayNormal)
        const secondTreeItem = {
          level: index + 1,
          rayPoints: secondRayPoints,
          points: filterRayPoints([secondStartPoint].concat(secondRayPoints.map(p => p.point)).concat([secondEndPoint])),
          lineData: {
            startPoint: secondStartPoint,
            endPoint: secondEndPoint,
            rotateNormal: newRotateNormal,
            rayNormal: secondRayNormal
          },
          degList,
          children: []
        }
        treeItem.children.push(secondTreeItem)
      })
    })
  }
  // 渲染
  console.log(tree)
  renderTree(tree)

}

async function renderTree(tree) {

  for (const treeItem of tree) {
    renderTube(treeItem.points); // 渲染当前项目
    if (treeItem.children.length > 0) {

      await renderTree(treeItem.children); // 递归渲染子项目
    }
  }
  // await sleep(1000); // 确保等待1秒

}
function renderNormal(point, normal) {
  const endPoint = new THREE.Vector3().addVectors(point, normal.normalize().multiplyScalar(0.5));
  createOneLine(point, endPoint, 0xff0000)

}
function calcRotateLine(startPoint, endPoint, startNormal, deg) {
  const LENGTH = random(0.05, 0.1)
  let originalDirection = new THREE.Vector3().subVectors(endPoint, startPoint).normalize(); //旋转的其实是个方向向量
  let rotationAxis = startNormal.normalize();
  let quaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, THREE.MathUtils.degToRad(deg));
  let direction = originalDirection.clone().applyQuaternion(quaternion);
  let newEndPoint = new THREE.Vector3().addVectors(startPoint, direction.multiplyScalar(LENGTH));

  renderNormal(startPoint, startNormal)

  // createPoint(newEndPoint, 0xff0000)
  // createOneLine(startPoint, newEndPoint, 0x00ffff)

  // createOneLine(newEndPoint, new THREE.Vector3(0, 0, 0), 0xffffff)
  const o = new THREE.Vector3(0, 0, 0)
  const newDirection = new THREE.Vector3().subVectors(o, newEndPoint).normalize();
  const [secondEndP] = getRayP(newEndPoint, newDirection)
  if (secondEndP) {
    // createPoint(secondEndP.point, 0xff00ff)
    createOneLine(startPoint, secondEndP.point, 0x3c00ff)
    return secondEndP.point
  } else {
    return null
  }

}
function checkInMesh(point) {

}
function calcNextLine(startPoint, endPoint, rotateNormal, deg, LENGTH = 0.3) {
  // renderNormal(startPoint, startNormal)
  // 先计算startPoint和endPoint连线的延长线，
  // 这个线一定要长，得出模型
  const length = random(0.1, 0.5)
  const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
  let newEndPoint = new THREE.Vector3().addVectors(endPoint, direction.multiplyScalar(length));

  // newEndPoint需要绕着startNormal旋转30度
  const angle = THREE.MathUtils.degToRad(deg); // 将角度转换为弧度
  const rotationMatrix = new THREE.Matrix4();
  rotationMatrix.makeRotationAxis(rotateNormal.normalize(), angle);
  // 应用旋转矩阵到newEndPoint
  newEndPoint.applyMatrix4(rotationMatrix);

  const o = new THREE.Vector3(0, 0, 0)
  let newDirection = new THREE.Vector3().subVectors(o, newEndPoint).normalize();
  let [secondEndP, inMesh] = getRayP(newEndPoint, newDirection)

  if (!secondEndP) {
    // 证明起点rayOrigin在模型内部,延长一下newEndPoint的位置
    newEndPoint = new THREE.Vector3().addVectors(newEndPoint, direction.multiplyScalar(2));
    newDirection = new THREE.Vector3().subVectors(o, newEndPoint).normalize();
    secondEndP = getRayP(newEndPoint, newDirection)[0]
    console.log('延长了')
    inMesh = false
  }

  // 
  const newNormal = new THREE.Vector3().subVectors(newEndPoint, secondEndP.point).normalize()
  const secondStartPoint = endPoint
  // createPoint(secondEndP.point, 0xff00ff)
  // createOneLine(secondStartPoint, secondEndP.point, 0x3c00ff)
  // createPoint(newEndPoint, 0xff0000)
  // createOneLine(endPoint, newEndPoint, 0x00ffff)
  // createOneLine(newEndPoint, new THREE.Vector3(0, 0, 0), 0xffffff)
  // renderNormal(secondStartPoint, newNormal)

  if (secondEndP.point.distanceTo(newEndPoint) > 1) {
    console.log('距离', secondEndP.point.distanceTo(newEndPoint))
    // 这是找到对面去了
    inMesh = true
  }
  return {
    secondStartPoint,
    secondEndPoint: secondEndP.point,
    secondRayNormal: newNormal,
    inMesh
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

    const p = intersects[0]
    return [p, false]
  } else {
    return [null, true]
  }
}
function calcRayPoints(startPoint, endPoint, vertexNormal) {
  const lineCurveDirection = new THREE.LineCurve3(startPoint, endPoint);
  const numberOfPoints = 30; // 取点的精度
  const pointsDirection = lineCurveDirection.getPoints(numberOfPoints);
  const rayPoints = []
  pointsDirection.forEach((point, index) => {
    const rayPoint = point
    const rayOrigin = new THREE.Vector3().addVectors(rayPoint, vertexNormal.normalize().multiplyScalar(0.5)); // 一直以来的bug有一点原来是镜头太近
    const rayDirection = new THREE.Vector3().subVectors(rayPoint, rayOrigin).normalize();
    // createOneLine(rayOrigin, rayPoint, 0x00ff00)
    raycaster.set(rayOrigin, rayDirection);
    // raycaster.firstHitOnly = true;
    var intersects = raycaster.intersectObject(meshModel); // 假设mesh是你的模型对象
    // console.log("🚀 ~ pointsDirection.forEach ~ intersects:", intersects)
    if (intersects.length > 0) {
      // 这里排除距离00点太近的点
      // if (intersects[0].point.distanceTo(new THREE.Vector3(0, 0, 0)) > 2) {
      //   rayPoints.push(intersects[0])
      // }
      // 这里其实应该选取离00中心更远的投影点

      if (rayPoints.length > 1) {
        const lastPoint = rayPoints[rayPoints.length - 1].point
        const distance = lastPoint.distanceTo(intersects[0].point)
        if (distance > 0.05) {

          return
        }
      }
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

  const geometry = new THREE.SphereGeometry(0.005, 32, 32);
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
