import { createCamera } from './components/camera.js';
import { createCube } from './components/cube.js';
import { createScene } from './components/scene.js';
import { createLights } from './components/lights.js';
import { createRenderer } from './systems/renderer.js';
import { Resizer } from './systems/Resizer.js';
import { Loop } from './systems/Loop.js';
import { createControls } from './systems/controls.js';
let loop;

let camera;
let renderer;
let scene;

class World {
  // 1. Create an instance of the World app
  constructor(container) {
    camera = createCamera();
    scene = createScene();
    renderer = createRenderer();
    container.append(renderer.domElement);
    loop = new Loop(camera, scene, renderer);
    const cube = createCube();
    const { ambientLight, mainLight } = createLights();

    const controls = createControls(camera, renderer.domElement);

    loop.updatables.push(controls);

    controls.addEventListener('change', () => {
      renderer.render(scene, camera);
    });
    scene.add(ambientLight, mainLight, cube);

    const resizer = new Resizer(container, camera, renderer);

  }

  // 2. Render the scene
  render() {
    renderer.render(scene, camera);
  }
  start() {
    loop.start();
  }

  stop() {
    loop.stop();
  }
}

export { World };