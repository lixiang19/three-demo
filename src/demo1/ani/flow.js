import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import BrainModel from '../assets/model/brain.glb?url';
import dotTexture from '../assets/textures/dotTexture.png?url';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';
import { MeshLine, MeshLineGeometry, MeshLineMaterial } from '@lume/three-meshline'
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import polyVe from '../data/polyVe.json'
const group = new THREE.Group();
import { randomBetween, getRandomElementsFromArray } from '../utils.js';
function setupModel(loadedData) {
  const model = loadedData.scene.children[0];
  model.traverse((object) => {
    if (object.isMesh) {
      object.material.transparent = true;
      object.material.opacity = 0.3;
    }
  });
  return model;
}
async function createBrain() {
  const loader = new GLTFLoader();
  const loadedData = await loader.loadAsync(BrainModel);
  const model = setupModel(loadedData);
  return { model, brainData: loadedData };
}
function createModel(model) {
  // 创建自定义的着色器材质
  const shaderMaterial = new THREE.MeshBasicMaterial({
    color: 0x4062b7,
    // 透明
    transparent: true,
    opacity: 1,
  });

  let mesh = new THREE.Mesh(model.geometry, shaderMaterial);
  group.add(model);

}
async function createFlow() {
  const { model, brainData } = await createBrain();
  createModel(model);

  group.position.set(0, -0.5, 0);
  return group;
}
export { createFlow }