import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import brainGltf from "../assets/model/brain.glb?url";
import * as THREE from 'three';

import { setupModel } from './setupModel.js';


async function createBrain() {
  const loader = new GLTFLoader();
  const loadedData = await loader.loadAsync(brainGltf);

  const brain = setupModel(loadedData);

  brain.position.set(0, -0.5, 0);

  return { brain, brainData: loadedData };
}
export { createBrain };