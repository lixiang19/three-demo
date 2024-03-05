import { createCamera, aniCameraFlow, animateCamera, aniCameraLine, aniCameraSparkle } from './components/camera.js';

import { createScene } from './components/scene.js';
import { createBaseLight, createInnerPointLight, createSparkleLights } from './components/lights.js';
import { createRenderer } from './systems/renderer.js';
import { Resizer } from './systems/Resizer.js';
import { Loop } from './systems/Loop.js';
import { createControls } from './systems/controls.js';
import { editMain, editDestroy } from './edit/brainInit.js'
import * as THREE from 'three';
import { createComposer, aniSparkEnterBloom, aniSparkBloom, aniLineBloom } from './systems/composerRender.js'

import sparkAnimation from './ani/sparkle.js'
import sparkEnterAnimation from './ani/sparkleEnter.js'
import lineAnimation from './ani/line.js'
import { createFlow } from './ani/flow.js'

let loop;
let camera;
let renderer;
let scene;
let controls
let composer

let aniGroup
class World {
  constructor(container) {
    // 初始化所以基础的东西
    camera = createCamera();
    scene = createScene();
    renderer = createRenderer();
    container.append(renderer.domElement);
    const resizer = new Resizer(container, camera, renderer);
    composer = createComposer(renderer, scene, camera);
    loop = new Loop(camera, scene, renderer, composer);
    const ambientLight = createBaseLight();
    controls = createControls(camera, renderer.domElement);
    scene.add(ambientLight);
    loop.updatables.push(controls);

  }
  async editInit() {
    animateCamera()
    aniGroup = await editMain(camera, controls, loop)
    const { innerLight } = createInnerPointLight();
    aniGroup.add(innerLight);

    scene.add(aniGroup);
  }
  async aniFlowInit() {
    aniGroup = await createFlow()
    scene.add(aniGroup);
    aniCameraFlow()
  }
  async aniSparkInit() {
    aniGroup = await sparkAnimation.createSparkle()
    scene.add(aniGroup);
    aniSparkBloom()
    aniCameraSparkle()
    loop.updatables.push(sparkAnimation);
  }
  async aniSparkEnterInit() {
    aniGroup = await sparkEnterAnimation.createSparkle()
    scene.add(aniGroup);
    aniSparkEnterBloom()
    aniCameraSparkle()
    loop.updatables.push(sparkEnterAnimation);
  }
  async aniLineInit() {
    aniGroup = await lineAnimation.createLineAni()
    scene.add(aniGroup);

    aniCameraLine()
    aniLineBloom()
    await sleep(2000)
    loop.updatables.push(lineAnimation);
  }

  render() {
    renderer.render(scene, camera);
  }
  start() {
    loop.start();
  }
  // 清除其他的动画
  clearAni() {
    if (aniGroup) {
      scene.remove(aniGroup)
      aniGroup = null
    }
    editDestroy()

    loop.updatables = []
    loop.updatables.push(controls);
  }

  stop() {
    loop.stop();
  }
}

export { World };