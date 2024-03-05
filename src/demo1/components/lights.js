import { PointLight, AmbientLight } from 'three';

function createBaseLight() {
  const ambientLight = new AmbientLight('white', 4);

  return ambientLight;
}
function createInnerPointLight() {
  const innerLight = new PointLight('white', 30, 0);
  innerLight.position.set(10, 0, 0);
  return { innerLight };
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