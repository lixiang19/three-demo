import * as THREE from 'three';
import { createXRayMaterial } from '../xRayMaterial.js'
export default function renderBrain(modelMap) {
  const group = new THREE.Group();
  const surfaceModel = modelMap.surfaceModel;
  const innerModel = modelMap.innerModel;
  const bottomModel = modelMap.bottomModel;
  const xRayMaterial = createXRayMaterial();
  const surfaceMesh = new THREE.Mesh(surfaceModel.geometry, xRayMaterial);
  const innerMesh = new THREE.Mesh(innerModel.geometry, xRayMaterial);
  const bottomMesh = new THREE.Mesh(bottomModel.geometry, xRayMaterial);
  group.add(surfaceMesh);
  // group.add(innerMesh);
  // group.add(bottomMesh);
  return group;
}