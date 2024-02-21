import { PointLight, AmbientLight } from 'three';

function createLights() {

  const ambientLight = new AmbientLight('white', 2);
  const mainLight = new PointLight('white', 0.6, 0);
  mainLight.position.set(0, 0.1, 0);
  return { ambientLight, mainLight };
}

export { createLights };