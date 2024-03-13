import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import BrainModel from '../assets/model/brain3.glb?url';

import { createXRayMaterial } from './xRayMaterial.js'
import pointData from '../data/pointData.json'
import linesData from '../data/linesData.json'
const group = new THREE.Group();
let lines = []
let pointMeshs = []
function createTube(curve) {
  // shaderMaterial
  const vertexShader = `
  varying vec2 vUv;
  uniform float time;
  varying float vProgress;
  void main() {
    vUv = uv;
    vProgress = smoothstep(-1., 1., sin(vUv.x*20. - time * 3.));
    vec3 p = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
    `;
  const fragmentShader = `
  uniform float time;
  uniform vec3 color;
  uniform vec3 bgColor;
  varying vec2 vUv;
  varying float vProgress;
  uniform float progress; // 新增uniform变量来控制动画进度
  void main() {
    if (vUv.x > progress) discard; // 如果顶点的位置大于动画进度，则不显示该片元
    vec3 finalColor = mix(color+vec3(0.7),bgColor +vec3(0.5), vProgress);
    gl_FragColor = vec4(finalColor, 1); // 正确设置RGBA值
  }
    `;
  const uniforms = {
    time: { value: 0 },
    progress: { value: 0.0 }, // 初始化progress值为0
    color: { value: new THREE.Color("rgb(255, 255, 255)") },
    bgColor: { value: new THREE.Color("rgb(143, 206, 255)") },// 159, 213, 255 
  };
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const tube = new THREE.TubeGeometry(curve, 64, 0.1, 8, false);
  const mesh = new THREE.Mesh(tube, shaderMaterial);
  return mesh
}
function setupModel(loadedData) {
  const model = loadedData.scene.children[0];
  model.traverse((object) => {
    if (object.isMesh) {
      // object.material.transparent = true;
      // object.material.opacity = 0.1;
      // const material = new THREE.MeshPhongMaterial({
      //   color: 0x469cf8, // 白色，你可以根据需要调整颜色
      //   opacity: 0.1, // 设置透明度，玻璃通常是半透明的，可以根据需要调整
      //   transparent: true, // 开启透明效果
      // });
      const material = createXRayMaterial()
      material.uniforms.p.value = 3.0
      object.material = material;
    }
  });
  return model;
}
async function createBrain() {
  const loader = new GLTFLoader();
  const loadedData = await loader.loadAsync(BrainModel);
  const model = setupModel(loadedData);
  model.position.set(-15, -5, 0);
  return { model, brainData: loadedData };
}
async function addLines() {
  // linesData.forEach((list) => {
  //   const points = list.map(item => new THREE.Vector3(item.x, item.y, item.z))
  //   const curve = new THREE.CatmullRomCurve3(points);
  //   const tube = createTube(curve);
  //   lines.push(tube)
  //   group.add(tube);
  // });
  for (let index = 0; index < linesData.length; index++) {
    const list = linesData[index];
    const points = list.map(item => new THREE.Vector3(item.x, item.y, item.z))
    const curve = new THREE.CatmullRomCurve3(points);
    const tube = createTube(curve);
    lines.push(tube)
    group.add(tube);
    await sleep(1700)
    pointMeshs[index + 1].material = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 3 });
  }

}
function createModel(model) {
  // 创建自定义的着色器材质
  const shaderMaterial = new THREE.MeshBasicMaterial({
    color: 0x4062b7,
    // 透明
    transparent: true,
    opacity: 1,
  });

  let mesh = new THREE.Mesh(model.geometry, shaderMaterial);
  group.add(model);

}
async function createFlow() {
  const { model, brainData } = await createBrain();
  createModel(model);
  createDots();

  setTimeout(() => {
    addLines()
  }, 2500)
  return group;
}
function createDots() {
  const points = pointData.forEach((point, index) => {
    const geometry = new THREE.SphereGeometry(0.2, 32, 32);
    // const material = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 });
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(point);
    pointMeshs.push(sphere)
    group.add(sphere);
  }
  )
}
function tick(delta, time) {
  if (lines.length > 0) {
    lines.forEach((tube) => {
      tube.material.uniforms.progress.value += 0.010;

    });
  }

}
export default { createFlow, tick }