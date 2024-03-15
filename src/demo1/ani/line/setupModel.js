import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import BrainModel from '../../assets/model/BrainSurfaceMesh.glb?url';
import * as THREE from 'three';

import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;
async function setupModel() {
  const loader = new GLTFLoader();
  const loadedData = await loader.loadAsync(BrainModel);
  const model = loadedData.scene.children[0];
  const modelMap = {
    surfaceModel: null,
    innerModel: null,
    bottomModel: null
  }
  model.traverse((object) => {
    // Brain_Part_02_Colour_Brain_Texture_0下面
    // Brain_Part_06_Colour_Brain_Texture_0001 外面
    // Brain_Part_04_Colour_Brain_Texture_0 里面
    if (object.isMesh) {
      object.geometry.center() // 使模型居中
    }
    if (object.isMesh && object.name === "Brain_Part_06_Colour_Brain_Texture_0001") {
      object.geometry.computeBoundsTree();
      modelMap.surfaceModel = object;
    } else if (object.isMesh && object.name === "Brain_Part_04_Colour_Brain_Texture_0") {
      object.geometry.computeBoundsTree();
      modelMap.innerModel = object;
    } else if (object.isMesh && object.name === "Brain_Part_02_Colour_Brain_Texture_0") {
      object.geometry.computeBoundsTree();
      modelMap.bottomModel = object;
    }
  });
  return modelMap;
}
export default setupModel;