import { PointLight, AmbientLight } from 'three';

function createLights() {

  const ambientLight = new AmbientLight('white', 4);
  const mainLight = new PointLight('white', 30, 0);
  mainLight.position.set(10, 0, 0);
  return { ambientLight, mainLight };
}

export { createLights };