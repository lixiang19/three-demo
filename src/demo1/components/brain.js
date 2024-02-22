import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import brainGltf from "../assets/model/brain.glb?url";
import BrainModel from '../assets/model/brain3.glb?url';
import * as THREE from 'three';

import { setupModel } from './setupModel.js';


async function createBrain() {
  const loader = new GLTFLoader();
  const loadedData = await loader.loadAsync(BrainModel);

  const brain = setupModel(loadedData);
  console.log("🚀 ~ createBrain ~ brain:", brain)

  brain.position.set(-10, -10, 0);

  return { brain, brainData: loadedData };
}
export { createBrain };