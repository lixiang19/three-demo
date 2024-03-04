import { createCamera, aniCameraFlow, animateCamera, aniCameraLine, aniCameraSparkle } from './components/camera.js';
import { createCube } from './components/cube.js';
import { createScene } from './components/scene.js';
import { createBaseLight, createInnerPointLight, createSparkleLights } from './components/lights.js';
import { createRenderer } from './systems/renderer.js';
import { posTip } from './components/tip.js'
import { Resizer } from './systems/Resizer.js';
import { Loop } from './systems/Loop.js';
import { createControls } from './systems/controls.js';
import { createSpotLight } from './components/SpotLight.js'
import { DrawCurve } from './action/draw.js'
import * as THREE from 'three';
import { createComposer, aniLineBloom } from './systems/composerRender.js'
import { createBrain } from './components/brain.js'
import { MeshShow } from './action/MeshShow.js'
import { Dot } from './action/dot.js'
import { createPointAni } from './ani/pointAni.js'
import sparkAnimation from './ani/sparkle.js'
import lineAnimation from './ani/line.js'
import { createFlow } from './ani/flow.js'
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
// https://github.com/Mamboleoo/SurfaceSampling
// https://www.shutterstock.com/zh/video/search/similar/1058269939
let loop;
let camera;
let renderer;
let scene;
let controls
let composer
let drawCurve
let drawDot
let labelRender
let meshShow
let brain
class World {
  // 1. Create an instance of the World app
  constructor(container) {
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
  async init() {
    const { brainModel, brainData } = await createBrain();
    const { innerLight } = createInnerPointLight();
    scene.add(innerLight);
    brain = brainModel;
    scene.add(brain);
    meshShow = new MeshShow(brain, camera);
    animateCamera(camera);

    drawCurve = new DrawCurve(scene, camera, brain, controls);
    drawDot = new Dot(scene, camera, brain, controls);
    loop.updatables.push(drawCurve);
    loop.updatables.push(drawDot);
    const frontalMesh = brain.getObjectByName('frontal_01_-_Default_0')
    loop.updatables.push({
      tick() {
        posTip(frontalMesh, camera)
      }
    })
    this.addAction();
  }
  async aniFlowInit() {
    const group = await createFlow()
    scene.add(group);
    aniCameraFlow(camera)
  }
  async aniSparkInit() {
    const group = await sparkAnimation.createSparkle()
    scene.add(group);
    aniCameraSparkle(camera)
    loop.updatables.push(sparkAnimation);
  }
  async aniLineInit() {

    const group = await lineAnimation.createLineAni()
    // 创建个正方形
    scene.add(group);
    // scene.background = new THREE.Color(0x0e2049);
    aniCameraLine(camera)
    loop.updatables.push(lineAnimation);
    aniLineBloom()
    // scene.fog = new THREE.FogExp2(0x2c89e0, 0.001);
    // scene.fog = new THREE.Fog(0x2c89e0, 0.1, 1000);

  }
  // 2. Render the scene
  render() {
    renderer.render(scene, camera);
  }
  start() {
    loop.start();
    setTimeout(() => {
      this.addAniAction()
    }, 300)
  }
  addAniAction() {
    const btn = document.getElementById('btn_ani_sparkle');
    btn.addEventListener('click', () => {
      // 先把老的brain删除了
      scene.remove(brain);
      loop.updatables = []
      this.aniSparkInit()
    })
  }
  addAction() {
    const toggleDrawButton = document.getElementById('btn_draw');
    toggleDrawButton.addEventListener('click', () => {
      this.switchBtn(toggleDrawButton);
      drawDot.stopListen();
      drawCurve.startListen();
    });
    const toggleCameraButton = document.getElementById('btn_camera');
    toggleCameraButton.addEventListener('click', () => {
      this.switchBtn(toggleCameraButton);
      // 把画线停了
      drawCurve.stopListen();
      drawDot.stopListen();
      controls.enabled = true
      meshShow.toggleMain();
    });
    const toggleMeshButton = document.getElementById('btn_mesh');
    toggleMeshButton.addEventListener('click', () => {
      this.switchBtn(toggleMeshButton);
      drawCurve.stopListen();
      drawDot.stopListen();
      meshShow.toggle();
    });
    const toggleDotButton = document.getElementById('btn_dot');
    toggleDotButton.addEventListener('click', () => {
      this.switchBtn(toggleDotButton);
      drawCurve.stopListen();
      drawDot.startListen();
    });
  }
  switchBtn(activeBtn) {
    const btns = document.querySelectorAll('.btn');
    btns.forEach(btn => {
      btn.classList.remove('select');
    })
    activeBtn.classList.add('select');
  }
  stop() {
    loop.stop();
  }
}

export { World };