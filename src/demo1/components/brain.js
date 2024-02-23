import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import BrainModel from '../assets/model/brain3.glb?url';
import * as THREE from 'three'; // brain3

import { setupModel } from './setupModel.js';

async function createBrain() {
  const loader = new GLTFLoader();
  const loadedData = await loader.loadAsync(BrainModel);
  console.log("🚀 ~ createBrain ~ loadedData:", loadedData)

  const brainModel = setupModel(loadedData);

  brainModel.position.set(-10, -10, 0);

  return { brainModel, brainData: loadedData };
}
export { createBrain };