import { PointLight, AmbientLight } from 'three';
import * as THREE from 'three';
function createBaseLight() {
  const ambientLight = new AmbientLight('white',10);
  return ambientLight;
}
function createInnerPointLight() {
  const innerLight = new PointLight('white', 30, 0);
  innerLight.position.set(10, 0, 0);
  return { innerLight };
}

function createLineLight() {
  // 加个聚光灯
  const ambientLight = new AmbientLight('white',10);

  return [ambientLight]

}
function createSparkleEnterLights() {

  const directionalLight = new THREE.DirectionalLight( 0xffffff,1 );
  directionalLight.castShadow  = true;
  directionalLight.position.set( 0, 100, 0 );
  directionalLight.shadow.mapSize.width = 5120; // default
  directionalLight.shadow.mapSize.height = 5120; // default
  directionalLight.shadow.camera.near = 0.5; // default
  directionalLight.shadow.camera.far = 500; // default
  const d = 50; // 根据场景大小调整这个值
  directionalLight.shadow.camera.left = -d;
  directionalLight.shadow.camera.right = d;
  directionalLight.shadow.camera.top = d;
  directionalLight.shadow.camera.bottom = -d;
  




  return [ directionalLight]
}
export { createBaseLight, createLineLight,createInnerPointLight, createSparkleEnterLights };