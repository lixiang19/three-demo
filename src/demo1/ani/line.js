import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import BrainModel from '../assets/model/brain5000.glb?url';
import dotTexture from '../assets/textures/dotTexture.png?url';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';
import { MeshLine, MeshLineGeometry, MeshLineMaterial } from '@lume/three-meshline'
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import polyVe from '../data/polyVe.json'
import { randomBetween, getRandomElementsFromArray } from '../utils.js';
const pixelRatio = 2
const group = new THREE.Group();
const edgesMap = {};
let pointLineMap = {}
const allLineList = []
let shaderMaterial = null
// const polyVePoints = polyVe.map(p => new THREE.Vector3(p[0], p[2], -p[1]))
// 函数：生成两数之间的随机数，可以为负数

// 将polyVePoints剔除 30% .filter((p, i) => i % 2 === 0)
let polyVePoints = polyVe.map(p => new THREE.Vector3(p[0], p[2], -p[1]))
polyVePoints = getRandomElementsFromArray(polyVePoints, 0.6)
function setupModel(loadedData) {
  const model = loadedData.scene.children[0];
  let meshModel = null
  model.traverse((object) => {
    if (object.isMesh) {
      meshModel = object;
    }
  });
  return meshModel;
}
async function createBrain() {
  const loader = new GLTFLoader();
  const loadedData = await loader.loadAsync(BrainModel);
  const model = setupModel(loadedData);
  return { model, brainData: loadedData };
}
async function createLineAni() {
  const { model, brainData } = await createBrain();

  createModel(model);
  createLine()

  group.position.set(0, -100, 0);
  return group;
}
// 创建模型
function createModel(model) {
  // 创建自定义的着色器材质
  const shaderMaterial = new THREE.MeshBasicMaterial({
    color: 0x4062b7,
    // 透明
    transparent: true,
    opacity: 0.02,
  });

  let mesh = new THREE.Mesh(model.geometry, shaderMaterial);
  group.add(mesh);

}

// 测试线条
function createLine() {
  const range = 30;
  const nearList = []
  // polyVePoints = [polyVePoints[0], polyVePoints[100], polyVePoints[200]]
  polyVePoints.forEach((point, index) => {
    pointLineMap[index] = {}
    // 遍历剩余的点
    for (let i = index + 1; i < polyVePoints.length; i++) {
      const otherPoint = polyVePoints[i];
      // 计算距离
      const distance = point.distanceTo(otherPoint);
      // const distance = 1
      // 如果距离在特定范围内，则创建线段
      if (distance <= range) {


        const waveDir = randomArray(
          [new THREE.Vector3(1.0, 0.0, 0.0),
          new THREE.Vector3(0.0, 1.0, 0.0),
          new THREE.Vector3(0.0, 0.0, 1.0),
          new THREE.Vector3(0.0, 1.0, 1.0),
          new THREE.Vector3(0.0, 0.0, 0.0),
          ]
        )
        let isWhite = false
        if (index < 5) {
          isWhite = true
          nearList.push(i)

        }
        if (nearList.includes(index)) {
          isWhite = true
        }

        const randShow = 1

        let matLine = new LineMaterial({
          transparent: true,
          color: 0x4e7bdf,
          linewidth: 0.002, // in pixels
          opacity: 0.1,
          alphaToCoverage: true,
      
          onBeforeCompile: shader => {
            shader.uniforms.indexShow = { value: index };
            shader.uniforms.time = { value: 0 };
            shader.uniforms.isWhite = { value: isWhite };
            shader.uniforms.waveDir = { value: waveDir };
            shader.uniforms.randShow = { value: randShow };
            shader.uniforms.lineColor = { value: new THREE.Color(0x4887e0) };
            shader.fragmentShader = `
            uniform bool isWhite; // 控制变量
            uniform float time;
            uniform float randShow;
            uniform vec3 lineColor;
            ${shader.fragmentShader}
            `.replace(
              `vec4 diffuseColor = vec4( diffuse, alpha );`,
              `vec4 diffuseColor = vec4( diffuse, alpha );
              if (isWhite) {
                // 使用正弦函数和时间创建一个周期性变化
                float factor = sin(time * 1.0); // 3.14159是π的近似值，用于转换为弧度
                if (factor > randShow) {
                  diffuseColor = vec4(2.0, 2.0, 2.0, 1.0); // 白色
                }
                
            }`
            )
              .replace(
                `gl_FragColor = vec4( diffuseColor.rgb, alpha );`,
                `
                if (isWhite) {
                  gl_FragColor = vec4(diffuseColor.rgb, 0.2);
                }else {
                  gl_FragColor = vec4(diffuseColor.rgb, alpha);
                }

              `
              )
            shader.vertexShader = `
              uniform float time;
              uniform vec3 waveDir;
              ${shader.vertexShader}
            `.replace(
              `	vec4 end = modelViewMatrix * vec4( instanceEnd, 1.0 );`,
              ` vec4 end = modelViewMatrix * vec4(instanceEnd, 1.0);

              // Apply wave effect
              if (waveDir.x > 0.5) {
                  start.x += sin(start.y * 1.0 + time) * 3.0 ;
                  end.x -= sin(start.y * 1.0 + time)*4.0;
              }
              if (waveDir.y > 0.5) {
                start.y += sin(start.x * 4.0 + time) * 4.0;
                end.y -= sin(end.x * 4.0 + time) *2.0;
            }
            if (waveDir.z > 0.5) {
                start.z += cos(time) * 0.5;
                end.z += cos(time) * 0.5;
            }

              `
            );
          }


        });
        let geometry = new LineGeometry();
        geometry.setPositions([point.x, point.y, point.z, otherPoint.x, otherPoint.y, otherPoint.z]);

        const line2 = new Line2(geometry, matLine);
        line2.scale.set(1, 1, 1);
        group.add(line2)
        pointLineMap[index][i] = line2
        allLineList.push(line2)

      }
    }
  });

}

let lastUpdateTime = 0; // 上次更新时间
const updateInterval = 3; // 更新间隔（秒）
let selectedIndices = new Set(); // 当前选中点的索引集合

function tick(delta, elapsedTime) {
  if (elapsedTime > 3) {
    allLineList.forEach((line) => {
      line.material.uniforms.time.value += delta;
    });
    if (elapsedTime - lastUpdateTime > 4) {
      lastUpdateTime = elapsedTime;
      allLineList.forEach((line) => {
        line.material.uniforms.randShow.value = randomBetween(-1, 1);
      });
    }
  }
}

// 写个函数从数组中随机出一个
function randomArray(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}
const animation = {
  createLineAni,
  tick
}
export default animation;

