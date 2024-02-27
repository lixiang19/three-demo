import * as THREE from 'three';
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import BrainModel from '../assets/model/brain5000.glb?url';
import dotTexture from '../assets/textures/dotTexture.png?url';
import { ConvexHull } from 'three/addons/math/ConvexHull.js';
import { MeshLine, MeshLineGeometry, MeshLineMaterial } from '@lume/three-meshline'
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

  // // 创建两种材料
  // let material1 = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // 红色
  // let material2 = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // 绿色

  // // 假设我们想要将第一个面（两个三角形构成）使用第二种材料
  // // BoxBufferGeometry有12个面（2个三角形构成一个面），所以有24个三角形
  // // 我们需要为这些顶点分组，以便单独应用材料

  // // 一个面由6个顶点索引构成（因为一个面是由两个三角形构成，每个三角形3个顶点）
  // // 这里我们直接操作索引，将第一个面的6个顶点单独分组
  // model.geometry.addGroup(0, 600, 0); // 第一个参数是起始索引，第二个是计数，第三个是材料索引

  // // 对于geometry的其余部分，我们使用第二种材料
  // // 由于一个BoxBufferGeometry总共有36个顶点索引（12个面 * 3个顶点 * 2），我们将剩余的都分配给第二种材料
  // model.geometry.addGroup(600, 50000, 1); // 从第7个顶点开始，到最后，使用材料2

  // // 使用MeshFaceMaterial（在新版Three.js中可能直接传递一个材料数组）来应用多个材料
  // let materials = [material1, material2];
  // let mesh = new THREE.Mesh(model.geometry, materials);
  // group.add(mesh);
  // group.add(pointsObj);

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


  drawLine(model, group);
  return group;
}
function drawLine(model, group) {
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
    opacity: 0.5,
    sizeAttenuation: true,

    lineWidth: 0.1,
  })
  Object.values(edgesMap).forEach(([start, end]) => {
    const startPosition = new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'), start);
    const endPosition = new THREE.Vector3().fromBufferAttribute(geometry.getAttribute('position'), end);
    // const edgeGeometry = new THREE.BufferGeometry().setFromPoints([startPosition, endPosition]);
    // const line = new THREE.Line(edgeGeometry, lineMaterial);
    // group.add(line);

    const meshGeometry = new MeshLineGeometry()
    meshGeometry.setPoints([startPosition, endPosition])
    const meshLine = new MeshLine(meshGeometry, material)
    group.add(meshLine)
  });

}

function tick(delta, elapsedTime) {


}


const animation = {
  createLine,
  tick
}
export default animation;