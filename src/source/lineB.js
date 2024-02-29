import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import BrainModel from '../assets/model/brain5000.glb?url';
import dotTexture from '../assets/textures/dotTexture.png?url';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';
import polyVe from '../data/polyVe.json'
const pixelRatio = 2
const group = new THREE.Group();
const polyVePoints = polyVe.map(p => new THREE.Vector3(p[0], p[2], -p[1]))
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
async function createLine() {
  const { model, brainData } = await createBrain();
  const positions = model.geometry.attributes.position.array;
  const points = [];
  for (let i = 0; i < positions.length; i += 3) {
    points.push(new THREE.Vector3(positions[i], positions[i + 1], positions[i + 2]));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.PointsMaterial({ size: 0.1 });
  const pointsObj = new THREE.Points(geometry, material);
  // group.add(model);
  group.add(pointsObj);

  // const edges = new THREE.EdgesGeometry(model.geometry);

  // // 创建一个LineBasicMaterial来定义线条的颜色等属性
  // const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

  // // 使用LineSegments将边缘渲染成线框
  // const wireframe = new THREE.LineSegments(edges, lineMaterial);
  // group.add(wireframe);

  // const wireframeGeometry = new THREE.WireframeGeometry(model.geometry);

  // // 创建一个LineBasicMaterial来定义线条的颜色等属性
  // const wireframeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

  // // 使用LineSegments将wireframeGeometry渲染成线框
  // const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
  // group.add(wireframe);

  let convexHull = new ConvexHull().setFromPoints(points);
  console.log("🚀 ~ createLine ~ convexHull:", convexHull)
  a(model, group);
  return group;
}
function a(model, group) {
  const geometry = model.geometry
  const edgesMap = {};

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
          edgesMap[key] = [start, end];
        }
      });
    }
  }

  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xfff000 });

  Object.values(edgesMap).forEach(([start, end]) => {
    const startPosition = new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'), start);
    const endPosition = new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'), end);
    const edgeGeometry = new THREE.BufferGeometry().setFromPoints([startPosition, endPosition]);
    const line = new THREE.Line(edgeGeometry, lineMaterial);
    group.add(line);
  });

}
function processMesh(mesh, group) {
  const geometry = mesh.geometry;
  console.log("🚀 ~ processMesh ~ geometry:", geometry)

  // 确保是BufferGeometry
  if (!(geometry instanceof THREE.BufferGeometry)) {
    console.warn('Geometry is not an instance of THREE.BufferGeometry.');
    return;
  }

  // 获取顶点位置属性
  const positionAttribute = geometry.getAttribute('position');
  console.log("🚀 ~ processMesh ~ positionAttribute:", positionAttribute)
  const faces = []
  // 如果几何体使用索引来定义形状
  if (geometry.index) {
    const indices = geometry.index.array;
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i];
      const b = indices[i + 1];
      const c = indices[i + 2];

      // 获取每个顶点的位置
      const vA = new THREE.Vector3().fromBufferAttribute(positionAttribute, a);
      const vB = new THREE.Vector3().fromBufferAttribute(positionAttribute, b);
      const vC = new THREE.Vector3().fromBufferAttribute(positionAttribute, c);
      faces.push({ a: vA, b: vB, c: vC })

      // 在这里，vA, vB, vC代表一个面的三个顶点
      // 你可以在这里处理这些顶点
    }
  } else {
    // 如果几何体没有使用索引
    for (let i = 0; i < positionAttribute.count; i += 3) {
      const vA = new THREE.Vector3().fromBufferAttribute(positionAttribute, i);
      const vB = new THREE.Vector3().fromBufferAttribute(positionAttribute, i + 1);
      const vC = new THREE.Vector3().fromBufferAttribute(positionAttribute, i + 2);
      faces.push({ a: vA, b: vB, c: vC })
      // 与上面相同，处理顶点
    }
  }
  // 遍历几何体的所有面，找到所有唯一的边缘
  const edgesMap = {};
  const edgeIndices = [
    [face.a, face.b],
    [face.b, face.c],
    [face.c, face.a]
  ];

  edgeIndices.forEach(([start, end]) => {
    const key = start < end ? `${start}_${end}` : `${end}_${start}`;
    if (!edgesMap[key]) {
      edgesMap[key] = [start, end];
    }
  });
});
console.log("🚀 ~ processMesh ~ edgesMap:", edgesMap)
// 为每条边缘创建一个线段
Object.values(edgesMap).forEach(([start, end]) => {

  const lineGeometry = new THREE.BufferGeometry().setFromPoints([
    start,
    end
  ]);
  const line = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({ color: 0xffffff }));
  group.add(line);
});
}
function tick(delta, elapsedTime) {


}


const animation = {
  createLine,
  tick
}
export default animation;