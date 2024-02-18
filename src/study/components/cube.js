import { BoxGeometry, Mesh, MeshStandardMaterial, TextureLoader } from 'three';
import { MathUtils } from 'three';
import uvTestVw from '../assets/textures/uv-test-bw.png';
function createMaterial() {
  // create a "standard" material
  const textureLoader = new TextureLoader();
  const texture = textureLoader.load(
    uvTestVw
  );
  const material = new MeshStandardMaterial({ map: texture });

  return material;
}

const radiansPerSecond = MathUtils.degToRad(30);
function createCube() {
  // create a geometry
  const geometry = new BoxGeometry(2, 2, 2);


  const material = createMaterial();
  // create a Mesh containing the geometry and material
  const cube = new Mesh(geometry, material);

  cube.rotation.set(-0.5, -0.1, 0.8);
  cube.tick = (delta) => {
    // increase the cube's rotation each frame
    cube.rotation.z += radiansPerSecond * delta;
    cube.rotation.x += radiansPerSecond * delta;
    cube.rotation.y += radiansPerSecond * delta;
  };

  return cube;
}

export { createCube };