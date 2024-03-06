import BrainModel from '../assets/model/brainAll.glb?url';
import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
const group = new THREE.Group();
let brainModel = null;
group.position.set(0, 2, 0);
async function createBrain() {
  const loader = new GLTFLoader();
  const loadedData = await loader.loadAsync(BrainModel);
  const model = setupModel(loadedData);
  return { model, brainData: loadedData };
}
function setupModel(loadedData) {
  const model = loadedData.scene.children[0];
  const material = new THREE.ShaderMaterial({
  vertexShader: `varying vec3 vNormal;

  void main() {
      vNormal = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`, // 之前定义的顶点着色器代码
  fragmentShader: `varying vec3 vNormal;

  void main() {
      // 将法线的每个分量从[-1, 1]映射到[0, 1]
      vec3 normalColor = normalize(vNormal) * 0.5 + 0.5;
      gl_FragColor = vec4(normalColor, 1.0);
  }`, // 之前定义的片元着色器代码
});
  let meshModel = null
  model.traverse((object) => {
    if (object.isMesh) {
      meshModel = object;
      object.material = material;
    }
  });
  meshModel.geometry.rotateX(Math.PI * -0.5);
  meshModel.geometry.rotateY(Math.PI * -0.3);

  return meshModel;
}
async function createMain() {
  const { model, brainData } = await createBrain();
  brainModel = model;
  group.add(brainModel);
  return group;
}
function tick() {

}
export default {
  createMain,
  tick
}