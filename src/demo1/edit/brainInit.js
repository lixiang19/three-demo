import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshShow } from '../action/MeshShow.js'
import BrainModel from '../assets/model/brain3.glb?url';
import { DrawCurve } from '../action/draw.js'
import { posTip } from './tip.js'
import { Dot } from '../action/dot.js'
function setupModel(data) {
  const model = data.scene.children[0];
  model.traverse((object) => {

    if (object.isMesh) {
      const material = new THREE.MeshPhongMaterial({
        color: 0x469cf8, // 白色，你可以根据需要调整颜色
        opacity: 0.1, // 设置透明度，玻璃通常是半透明的，可以根据需要调整
        transparent: true, // 开启透明效果
      });
      object.material = material;
    
    }
  });

  return model;
}
async function createBrain() {
  const loader = new GLTFLoader();
  const loadedData = await loader.loadAsync(BrainModel);
  const brainModel = setupModel(loadedData);
  brainModel.position.set(-15, -5, 0);
  return { brainModel, brainData: loadedData };
}


let drawCurve
let drawDot
let meshShow
let brain
let controls
let group = new THREE.Group()

async function editMain(camera, controls, loop) {
  const { brainModel, brainData } = await createBrain();
  controls  = controls;
  brain = brainModel;
  group.add(brain);
  meshShow = new MeshShow(brain, camera);
  drawCurve = new DrawCurve(group, camera, brain, controls);
  drawDot = new Dot(group, camera, brain, controls);
  loop.updatables.push(drawCurve);
  loop.updatables.push(drawDot);
  const frontalMesh = brain.getObjectByName('frontal_01_-_Default_0')
  loop.updatables.push({
    tick() {
      posTip(frontalMesh, camera)
    }
  })
  addAction();
  return group;
}
function addAction() {
  const actionEditDom = document.getElementById('action_edit');
  actionEditDom.style.display = 'flex';
  const tipDom = document.getElementById('tip');
  tipDom.style.display = 'flex';
  const toggleDrawButton = document.getElementById('btn_draw');
  toggleDrawButton.addEventListener('click', () => {
    switchBtn(toggleDrawButton);
    drawDot.stopListen();
    drawCurve.startListen();
  });
  const toggleCameraButton = document.getElementById('btn_camera');
  toggleCameraButton.addEventListener('click', () => {
    switchBtn(toggleCameraButton);
    // 把画线停了
    drawCurve.stopListen();
    drawDot.stopListen();
   
    meshShow.toggleMain();
  });
  const toggleMeshButton = document.getElementById('btn_mesh');
  toggleMeshButton.addEventListener('click', () => {
    switchBtn(toggleMeshButton);
    drawCurve.stopListen();
    drawDot.stopListen();
    meshShow.toggle();
  });
  const toggleDotButton = document.getElementById('btn_dot');
  toggleDotButton.addEventListener('click', () => {
    switchBtn(toggleDotButton);
    drawCurve.stopListen();
    drawDot.startListen();
  });
}
function editDestroy() {
  const actionEditDom = document.getElementById('action_edit');
  actionEditDom.style.display = 'none';
  const tipDom = document.getElementById('tip');
  tipDom.style.display = 'none';
  drawCurve && drawCurve.stopListen();
  drawDot && drawDot.stopListen();

  group.remove(brain);
  brain = null;
}
function switchBtn(activeBtn) {
  const btns = document.querySelectorAll('.btn');
  btns.forEach(btn => {
    btn.classList.remove('select');
  })
  activeBtn.classList.add('select');
}
export { editMain, editDestroy };