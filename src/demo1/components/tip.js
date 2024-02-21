import * as THREE from 'three';
function transPos(mesh) {
  if (mesh) {
    // 获取网格的几何体
    const geometry = mesh.geometry;

    // 确保几何体的顶点位置数据已经更新
    geometry.verticesNeedUpdate = true;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    // 访问第一个顶点
    // 注意：这里取决于几何体的类型，如果是BufferGeometry，访问方式会有所不同
    let vertex;
    if (geometry instanceof THREE.BufferGeometry) {
      // 如果是BufferGeometry，需要这样访问顶点
      // 创建一个Vector3来存储顶点坐标
      vertex = new THREE.Vector3();
      // 从几何体的position属性中获取顶点数据
      const positionAttribute = geometry.attributes.position;
      // 获取第一个顶点的坐标
      vertex.fromBufferAttribute(positionAttribute, 100);
    } else if (geometry instanceof THREE.Geometry) {
      // 如果是旧版的Geometry，直接从vertices数组中获取
      vertex = geometry.vertices[0];
    }

    // 将顶点坐标从局部空间转换到世界空间
    vertex.applyMatrix4(mesh.matrixWorld);


    return vertex;
  } else {
    console.log('Mesh not found');
  }
}
export function posTip(model, camera) {
  const halfWidth = window.innerWidth / 2;
  const halfHeight = window.innerHeight / 2;
  const position = transPos(model);

  const vectSphere = new THREE.Vector3(position.x, position.y, position.z);
  const posiSphere = vectSphere.project(camera);;
  const style = {
    left: posiSphere.x * halfWidth + halfWidth,
    top: -posiSphere.y * halfHeight + halfHeight,
  }
  document.querySelector('.tip').style.transform = `translate(${style.left}px, ${style.top}px)`;
}