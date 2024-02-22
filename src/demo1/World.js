import { createCamera, animateCamera } from './components/camera.js';
import { createCube } from './components/cube.js';
import { createScene } from './components/scene.js';
import { createLights } from './components/lights.js';
import { createRenderer } from './systems/renderer.js';
import { posTip } from './components/tip.js'
import { Resizer } from './systems/Resizer.js';
import { Loop } from './systems/Loop.js';
import { createControls } from './systems/controls.js';
import { createSpotLight } from './components/SpotLight.js'
import { DrawCurve } from './action/draw.js'
import * as THREE from 'three';
import { createComposer } from './systems/composerRender.js'
import { createBrain } from './components/brain.js'
import { MeshShow } from './action/MeshShow.js'
import { Dot } from './action/dot.js'
import { createPointAni } from './ani/pointAni.js'
// https://github.com/Mamboleoo/SurfaceSampling
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

    const { ambientLight, mainLight } = createLights();

    controls = createControls(camera, renderer.domElement);
    scene.add(ambientLight, mainLight);
    loop.updatables.push(controls);

  }
  async init() {
    const { brain, brainData } = await createBrain();

    scene.add(brain);
    meshShow = new MeshShow(brain, camera);

    const mesh6 = brain.getObjectByName('frontal_01_-_Default_0')

    // loop.updatables.push(tip);
    drawCurve = new DrawCurve(scene, camera, brain, controls);
    drawDot = new Dot(scene, camera, brain, controls);
    loop.updatables.push(drawCurve);
    loop.updatables.push(drawDot);
    loop.updatables.push({
      tick() {
        posTip(mesh6, camera)
      }
    });

    // const pointAniGroup = createPointAni(brain);
    // scene.add(pointAniGroup);
  }
  // 2. Render the scene
  render() {
    renderer.render(scene, camera);
  }
  start() {
    loop.start();
    setTimeout(() => {
      animateCamera(camera);
      this.addAction();
    }, 300)
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