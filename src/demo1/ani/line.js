import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import BrainModel from '../assets/model/brain5000.glb?url';
import dotTexture from '../assets/textures/dotTexture.png?url';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';
import { MeshLine, MeshLineGeometry, MeshLineMaterial } from '@lume/three-meshline'
import polyVe from '../data/polyVe.json'
const pixelRatio = 2
const group = new THREE.Group();
const polyVePoints = polyVe.map(p => new THREE.Vector3(p[0], p[2], -p[1]))
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
async function createLine() {
  const { model, brainData } = await createBrain();
  console.log("🚀 ~ createLine ~ model:", model)


  return group;
}


function tick(delta, elapsedTime) {


}


const animation = {
  createLine,
  tick
}
export default animation;