import * as THREE from 'three';
function createSpotLight() {
  // 创建线条材质
  const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffff00 }); // 自发光黄色

  // 创建线条几何体
  const lineGeometry = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    // 第一条线的顶点
    -1.0, 0.0, 0.0,
    1.0, 0.0, 0.0,
  ]);
  lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

  // 创建线条对象
  const line = new THREE.LineSegments(lineGeometry, lineMaterial);
  return line;
}
export { createSpotLight };