import { createCamera,aniCameraLight,aniCameraSparkleEnter, aniCameraFlow, animateCamera, aniCameraLine, aniCameraSparkle } from './components/camera.js';
import * as Three from 'three';
import aniLight from './ani/light.js';
import { createScene } from './components/scene.js';
import { createBaseLight, createLineLight,createInnerPointLight, createSparkleEnterLights } from './components/lights.js';
import { createRenderer } from './systems/renderer.js';
import { Resizer } from './systems/Resizer.js';
import { Loop } from './systems/Loop.js';
import { createControls } from './systems/controls.js';
import { editMain, editDestroy } from './edit/brainInit.js'
import * as THREE from 'three';
import { createComposer,aniFlowBloom,aniEditBloom, aniLightBloom,aniSparkEnterBloom, aniSparkBloom, aniLineBloom } from './systems/composerRender.js'
import aniSparkEnter from './ani/sparkleEnter.js'
import sparkAnimation from './ani/sparkle.js'
import sparkEnterAnimation from './ani/sparkleEnter.js'
import lineAnimation from './ani/line.js'
import flowAni from './ani/flow.js'

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
    // 添加坐标系
    // const axesHelper = new THREE.AxesHelper(200);
    // scene.add(axesHelper);
  }
  
  async editInit() {
    animateCamera()
    aniEditBloom()
    aniGroup = await editMain(camera, controls, loop)
 

    scene.add(aniGroup);
  }

  async aniFlowInit() {
    aniGroup = await flowAni.createFlow()
    scene.add(aniGroup);
    aniCameraFlow()
    aniFlowBloom()
    loop.updatables.push(flowAni);
  }
  async aniSparkInit() {
    aniGroup = await sparkAnimation.createSparkle()
    scene.add(aniGroup);
    aniSparkBloom()
    aniCameraSparkle()
    loop.updatables.push(sparkAnimation);
  }
  async aniSparkEnterInit() {
    // 加几个灯
    // const lights = createSparkleEnterLights()
    // lights.forEach(light => {
    //   scene.add(light)
    // })
    // 场景修改
    scene.background = new THREE.Color("#a7b6d2");
    scene.fog = new THREE.Fog(0xa7b6d2, 300, 1300);

    aniCameraSparkleEnter()
    aniSparkEnterBloom()
    aniGroup = await aniSparkEnter.createSparkle(camera)
    scene.add(aniGroup);
    // 加个 圆柱体

    
 


    loop.updatables.push(aniSparkEnter);
  }
  async aniLightInit() {
    aniGroup = await aniLight.main()
    scene.add(aniGroup);
    const lights = createLineLight()
    lights.forEach(light => {
      scene.add(light)
    })
    aniCameraLight()
    aniLightBloom()
    await sleep(2000)
    loop.updatables.push(aniLight);
  }
  // 线条动画
  async aniLineInit() {
    // scene.background = new THREE.Color("#494f5c");
    aniGroup = await lineAnimation.createLineAni()
    scene.add(aniGroup);
    const lights = createLineLight()
    lights.forEach(light => {
      scene.add(light)
    })
    aniCameraLine()
    aniLineBloom()
    await sleep(2000)
    loop.updatables.push(lineAnimation);
  }

  render() {
    renderer.render(scene, camera);
  }
  start() {
    loop&&loop.start();
  }
  // 清除其他的动画
  async clearAni() {
    if (aniGroup) {
      scene.remove(aniGroup)
      aniGroup = null
    }
    editDestroy()
    scene.background = new Three.Color('black');
    scene.fog = null
    loop.updatables = []
    loop.updatables.push(controls);
    await sleep(500)
  }

  stop() {
    loop.stop();
  }
}

export { World };