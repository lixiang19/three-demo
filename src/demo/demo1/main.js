import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import brainGLB from "./brain3.glb?url";
const scene = new THREE.Scene();
import shaderMaterial2 from "./shader1";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
var axesHelper = new THREE.AxesHelper( 150 );
const clock = new THREE.Clock();
// 创建相机
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// 创建渲染器并设置尺寸
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement); // 将渲染器的DOM元素添加到文档中
const color = new THREE.Color("#503f39");

// 设置渲染器的背景色
renderer.setClearColor(color);
// 配置控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // 启用阻尼效果（惯性），提供更平滑的控制体验
controls.dampingFactor = 0.25; // 阻尼系数
controls.enableZoom = true; // 允许缩放
controls.enablePan = true; // 允许平移
controls.mouseButtons = {
  LEFT: THREE.MOUSE.PAN,
  MIDDLE: THREE.MOUSE.DOLLY,
  RIGHT: THREE.MOUSE.ROTATE
};
// 添加环境光
const ambientLight = new THREE.AmbientLight(0xffffff, 1);
scene.add(ambientLight);
scene.add( axesHelper );
// 添加平行光
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 0).normalize();
scene.add(directionalLight);

// 设置相机位置
camera.position.z = 5;

// 创建GLTF加载器
const loader = new GLTFLoader();
// 存储加载的GLTF模型
let gltfModel;
let modelParts = [];


const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
float noise(vec2 p){
    return fract(sin(dot(p ,vec2(12.9898,78.233))) * 43758.5453);
}

// 光线流动效果的片段着色器
uniform float time;
varying vec2 vUv;

void main() {
    // 创建基于噪声和时间的动态纹理
    float n = noise(vUv * 10.0 + time);
    
    // 创建颜色，基于噪声来调整颜色的亮度
    vec3 color = mix(vec3(0.1, 0.2, 0.8), vec3(0.4, 0.7, 1.0), n);

    // 输出最终颜色
    gl_FragColor = vec4(color, 1.0);
}
`;
const shaderMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        time: { value: 0.0 }
    }
});
// 加载GLB文件
loader.load(brainGLB, function (gltf) {
  console.log(gltf)

    // 将模型添加到场景中
    gltfModel = gltf.scene;
    gltfModel.traverse((child) => {
      if (child.isMesh) {
          // 如果子对象是Mesh，那么它就是模型的一个分区
          modelParts.push(child);
          child.material.color.set("0xffffff");
      }
  });
  
  // 打印所有分区
  console.log(modelParts);
//   const partToHighlight = modelParts[2];
// partToHighlight.material = shaderMaterial;

const partToHighlight2 = modelParts[3]; // 假设你已经有了模型的分区数组
partToHighlight2.material = shaderMaterial2;
let minY = Infinity;
let maxY = -Infinity;
const geometry = partToHighlight2.geometry;
console.log(geometry);
geometry.computeBoundingBox(); // 确保计算了边界盒
minY = geometry.boundingBox.min.y;
maxY = geometry.boundingBox.max.y;
console.log(minY, maxY);
    scene.add(gltfModel);
     // 调整相机视角以适应模型
     const box = new THREE.Box3().setFromObject(gltfModel);
     const center = box.getCenter(new THREE.Vector3());
     const size = box.getSize(new THREE.Vector3());
     const maxDim = Math.max(size.x, size.y, size.z);
     const fov = camera.fov * (Math.PI / 180);
     let cameraZ = Math.abs(maxDim / 4 * Math.tan(fov * 2));
 
     cameraZ *= 10; // 根据模型大小调整相机距离
     camera.position.z = center.z + cameraZ;
 
     const minZ = box.min.z;
     const cameraToFarEdge = (minZ < 0) ? -minZ + cameraZ : cameraZ - minZ;
 
     camera.far = cameraToFarEdge * 3;
     camera.updateProjectionMatrix();
 
     // 更新场景的世界坐标
     gltfModel.updateMatrixWorld();
 
 
}, undefined, function (error) {
    console.error(error);
});
const composer = new EffectComposer(renderer);

// 创建RenderPass
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

// 创建UnrealBloomPass
const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight), // 分辨率
    1.5, // 强度
    0.4, // 半径
    0.85 // 阈值
);
composer.addPass(bloomPass);
// 创建动画循环
function animate() {
    requestAnimationFrame(animate);
    shaderMaterial.uniforms.time.value = clock.getElapsedTime();

    let duration = 5000;
    // 计算填充进度，范围从0到1
    let progress = (performance.now() % duration) / duration;
    // 更新着色器uniform变量
    shaderMaterial2.uniforms.uTime.value = progress;
   // 更新控制器
   controls.update();
    
   // 渲染场景和相机
    // 可以在这里添加一些动画或模型的旋转代码
    // example: gltf.scene.rotation.y += 0.01;

       
    // 使用composer渲染场景，而不是直接使用renderer
    composer.render();
}

// 调用动画循环函数
animate();

// 处理窗口尺寸变化
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('click', onClick, false);
// 创建Raycaster
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// 点击事件监听器
function onClick(event) {
    // 将屏幕上的鼠标位置转换为归一化坐标(-1 到 +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // 通过鼠标位置更新射线
    raycaster.setFromCamera(mouse, camera);

    // 计算与射线相交的物体数组
    const intersects = raycaster.intersectObjects(gltfModel.children, true);

    if (intersects.length > 0) {
        // 获取第一个相交的物体
        const object = intersects[0].object;

        // 创建一个新的高亮材质
        const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });

        // 保存原始材质
        object.userData.originalMaterial = object.material;

        // 应用高亮材质
        object.material = highlightMaterial;

        // 在一定时间后恢复原始材质
        setTimeout(() => {
            if (object.userData.originalMaterial) {
                object.material = object.userData.originalMaterial;
            }
        }, 1500);
    }
}