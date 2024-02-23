import { PointLight, AmbientLight } from 'three';
import { BoxGeometry, MeshStandardMaterial, Mesh } from 'three';
function createBaseLight() {
  const ambientLight = new AmbientLight('white', 4);

  return ambientLight;
}
function createInnerPointLight() {
  const innerLight = new PointLight('white', 30, 0);
  innerLight.position.set(10, 0, 0);
  return { innerLight };
}
// 创建一个正方体
function createCube() {
  const geometry = new BoxGeometry(1, 1, 1);
  const material = new MeshStandardMaterial({ color: 'purple' });
  const cube = new Mesh(geometry, material);
  return cube;
}
function createSparkleLights() {
  const light1 = new PointLight('white', 100);
  light1.position.set(-2, 0, 0);
  const light2 = new PointLight('white', 10, 0);
  light2.position.set(2, 0, 0);

  const light3 = new PointLight('white', 10, 0);
  light3.position.set(2, -1, 10);

  return [light1]
}
export { createBaseLight, createInnerPointLight, createSparkleLights };