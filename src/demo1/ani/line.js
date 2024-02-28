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
const pixelRatio = 2
const group = new THREE.Group();
const edgesMap = {};
let pointLineMap = {}
const allLineList = []
let shaderMaterial = null
// const polyVePoints = polyVe.map(p => new THREE.Vector3(p[0], p[2], -p[1]))

// 将polyVePoints剔除 30%
const polyVePoints = polyVe.map(p => new THREE.Vector3(p[0], p[2], -p[1])).filter((p, i) => i % 2 === 0)

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
  console.log("🚀 ~ createLine ~ model:", model)

  createPoints(model);

  // createModel(model);
  createLineTest()
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
    opacity: 0.3,
  });

  let material2 = new THREE.MeshBasicMaterial({

    // 透明
    transparent: true,
    opacity: 0,
  });

  let materials = [shaderMaterial, material2];
  // 顶点总数量
  console.log("🚀 ~ createModel ~ model.geometry.attributes.position.count", model.geometry.attributes.position.count)
  model.geometry.addGroup(0, 2000, 0)
  model.geometry.addGroup(2000, model.geometry.attributes.position.count, 1)
  let mesh = new THREE.Mesh(model.geometry, materials);
  group.add(mesh);

}
// 测试线条
function createLineTest() {
  const range = 30;
  const vertexShader = `
  uniform float time;
  uniform vec3 waveDir; // 波动方向
  
  void main() {
      vec3 pos = position;
  
      if (waveDir.x > 0.5) {
          pos.x += sin(pos.y*10.0+time)+ 2.0;
      }
      if (waveDir.y > 0.5) {
          pos.y += sin(pos.x*4.0+time)+ 2.0;
      }
      if (waveDir.z > 0.5) {
          pos.z += cos(time) * 0.0;
      }
      
      gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }`; // pos.x * 2.0 +

  const fragmentShader = `
  uniform bool isWhite; // 控制变量
  void main() {
    vec3 color;
    float alpha;
    if (isWhite) {
      color = vec3(1.0); // 白色
      alpha = 1.0; // 不透明
    } else {
      color = vec3(0.0, 0.0, 0.5); // 蓝色
      alpha = 0.5; // 半透明
    }
    gl_FragColor = vec4(color, alpha);
  }
`;
  polyVePoints.forEach((point, index) => {
    pointLineMap[index] = {}
    // 遍历剩余的点
    for (let i = index + 1; i < polyVePoints.length; i++) {
      const otherPoint = polyVePoints[i];
      // 计算距离
      const distance = point.distanceTo(otherPoint);
      // 如果距离在特定范围内，则创建线段
      if (distance <= range) {

        // 创建线段并添加到组中
        // const curve = new THREE.CatmullRomCurve3(Array.from([point, otherPoint]));
        // const tube = new THREE.TubeGeometry(curve, 64, 0.1, 8, false);
        // const mesh = new THREE.Mesh(tube, shaderMaterial);

        // 随机改变waveDir
        const waveDir = randomArray(
          [new THREE.Vector3(1.0, 0.0, 0.0),
          new THREE.Vector3(0.0, 1.0, 0.0),
          new THREE.Vector3(0.0, 0.0, 1.0),
          new THREE.Vector3(0.0, 0.0, 0.0),]
        )
        const uniforms = {
          time: { value: 0.0 },
          waveDir: { value: waveDir },
          isWhite: { value: false } // 初始状态为蓝色
        };
        const newshaderMaterial = new THREE.ShaderMaterial({
          uniforms,
          vertexShader,
          fragmentShader,
          side: THREE.DoubleSide,
          transparent: true,

        });
        let matLine = new LineMaterial({
          transparent: true,
          color: 0x4e7bdf,
          linewidth: 0.002, // in pixels
          opacity: 0.1,
          alphaToCoverage: true,
          onBeforeCompile: shader => {

            shader.uniforms.time = { value: 1.0 };
            shader.vertexShader = 'uniform float time;\n' + shader.vertexShader;
            // shader.uniforms.waveDir = { value: new THREE.Vector3(1, 0, 0) };
            // shader.vertexShader = `
            //   uniform float time;
            //   uniform vec3 waveDir;
            //   ${shader.vertexShader}
            // `.replace(
            //   `#include <begin_vertex>`,
            //   `#include <begin_vertex>
            //     float angle = 0.0;
            //     if (waveDir.x > 0.5) {
            //         angle = sin(position.y*10.0+time);
            //     }
            //     if (waveDir.y > 0.5) {
            //         angle = sin(position.x*4.0+time);
            //     }
            //     if (waveDir.z > 0.5) {
            //         angle = cos(time) * 0.0;
            //     }
            //     mat3 rotationMatrix = mat3(
            //         vec3( cos(angle), 0, sin(angle)),
            //         vec3( 0, 1, 0),
            //         vec3( -sin(angle), 0, cos(angle))
            //     );
            //     transformed = rotationMatrix * transformed;
            //   `
            // );
          }

          // vertexColors: true,
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
// 创建粒子点
function createPoints(model) {
  const geometry = new THREE.BufferGeometry().setFromPoints(polyVePoints);
  const material = new THREE.PointsMaterial({ size: 1 });
  const pointsObj = new THREE.Points(geometry, material);
  group.add(pointsObj);
}
function createLine(model) {
  const geometry = model.geometry


  // 检查几何体是否使用了索引
  if (geometry.index) {
    const indices = geometry.index.array;

    for (let i = 0; i < indices.length; i += 3) {
      const edgeIndices = [
        [indices[i], indices[i + 1]],
        [indices[i + 1], indices[i + 2]],
        [indices[i + 2], indices[i]]
      ];

      edgeIndices.forEach(([start, end]) => {
        const key = start < end ? `${start}_${end}` : `${end}_${start}`;
        if (!edgesMap[key]) {
          // 加一层判断，在polyVePoints中的点才画线
          const startPosition = new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'), start);
          const endPosition = new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'), end);
          if (polyVePoints.some(p => p.equals(startPosition)) && polyVePoints.some(p => p.equals(endPosition))) {
            edgesMap[key] = [start, end];
          }

          // edgesMap[key] = [start, end];
        }
      });
    }
  }

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xfff000 });
  const material = new MeshLineMaterial({
    color: new THREE.Color(0x386acb),
    transparent: true,
    opacity: 0.1,

    lineWidth: 0.4,
  })

  Object.values(edgesMap).forEach(([start, end]) => {
    const startPosition = new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'), start);
    const endPosition = new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'), end);
    const meshGeometry = new MeshLineGeometry()
    meshGeometry.setPoints([startPosition, endPosition])
    let finnalMaterial = material
    // if (Math.random() > 0.9) {
    //   finnalMaterial = new MeshLineMaterial({
    //     color: new THREE.Color(0xe0f3ea),
    //     transparent: true,
    //     opacity: 0.7,
    //     lineWidth: 0.4,
    //   })
    // }
    const meshLine = new MeshLine(meshGeometry, finnalMaterial)
    group.add(meshLine)

  });

}
let lastUpdateTime = 0; // 上次更新时间
const updateInterval = 1; // 更新间隔（秒）
let selectedIndices = new Set(); // 当前选中点的索引集合
const material1 = new MeshLineMaterial({
  color: new THREE.Color(0x386acb),
  transparent: true,
  opacity: 0.1,
  lineWidth: 1,
})
const material2 = new MeshLineMaterial({
  color: new THREE.Color(0xffffff),
  transparent: true,
  opacity: 0.7,
  lineWidth: 1,
})
function tick(delta, elapsedTime) {
  if (elapsedTime > 3) {
    allLineList.forEach((line) => {

      line.material.uniforms.time.value += 0.05;
    });
  }

  // shaderMaterial.uniforms.time.value += 0.05;
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