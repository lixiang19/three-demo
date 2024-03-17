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
import { toVector3, last } from './line/util'
import { mockList } from './line/MockData.js'
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { getTubeList } from './line/calcTubeList.js'
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;
import CalcRotateLine from './line/calcRotateLine.js';
import CalcRrayLine from './line/calcRrayLine.js';
import setupModel from './line/setupModel.js';
import renderBrain from './line/renderBrain.js';
import auxiliary from './line/Auxiliary.js';
const group = new THREE.Group();
let camera
const lines = []
const raycaster = new THREE.Raycaster();
import renderTube from './line/tube.js';
function setDot() {
  window.addEventListener('mousedown', (event) => {
    // 将鼠标位置转换为归一化设备坐标(NDC)
    let mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(modelMap.innerModel, true);

    if (intersects.length > 0) {
      console.log("🚀 ~ setDot ~ intersects", intersects[0])
      const point = intersects[0].point;
    }

  }, false);

}
let modelMap = {}
async function createLineAni(ca) {
  camera = ca
  modelMap = await setupModel();
  const brainGroup = renderBrain(modelMap);
  group.add(brainGroup);
  setDot()
  auxiliary.setGroup(group);
  auxiliary.createPoint(new THREE.Vector3(0.0), 0xff0000)
  renderTopLine()
  // renderInnerLine()
  return group;
}
function renderInnerLine() {
  const originalData = {
    point: {
      "x": 0.1288703150967558,
      "y": -0.11639261224620095,
      "z": 0.3516183582830761
    },
    endPoint: {
      "x": 0.15693421509889594,
      "y": 0.0766590104668281,
      "z": 0.2783399813277559
    },
    normal: {
      "x": -0.44249302704736854,
      "y": -0.4494172824044304,
      "z": 0.7665713592318606
    }
  }
  auxiliary.createPoint(toVector3(originalData.point), 0xff0000)
  auxiliary.createPoint(toVector3(originalData.endPoint), 0xff0000)
  const calcRrayLine = new CalcRrayLine(originalData, raycaster, modelMap.innerModel);
  const tree = calcRrayLine.createTree(1);
  const tubeList = getTubeList(tree);
  renderTubes(tubeList);
}
function renderTopLine() {
  const originalData = {
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
  // const calcRrayLine = new CalcRrayLine(originalData, raycaster, modelMap.surfaceModel);
  // const tree = calcRrayLine.createTree(4);
  const calcRotateLine = new CalcRotateLine(originalData, raycaster, modelMap.surfaceModel);
  const areaLines = calcRotateLine.createLineArea();
  const areaFork = {
    bottom() {
      return random(1, 2)
    },
    left() {
      return random(2, 4)
    },
    right() {
      return random(2, 4)
    }
  }
  areaLines.forEach(areaLine => {
    areaLine.lines.forEach((item, index) => {
      const forkCount = areaFork[areaLine.area]()
      const calcRrayLine = new CalcRrayLine(item, raycaster, modelMap.surfaceModel);
      const tree = calcRrayLine.createTree(forkCount);
      const tubeList = getTubeList(tree);
      renderTubes(tubeList);

    })
  })
}
function renderTubes(tubeList) {
  tubeList.forEach((tube) => {
    group.add(tube);
    lines.push(tube);
  });
}
function tick() {
  // if (lines.length > 0) {
  //   lines.forEach((tube) => {
  //     tube.material.uniforms.progress.value += 0.001;
  //     if (tube.material.uniforms.progress.value > 1.3) {
  //       tube.material.uniforms.progress.value = 0;
  //     }
  //   });
  // }
}
const animation = {
  createLineAni,
  tick
}
export default animation;

