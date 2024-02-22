import * as THREE from 'three';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
function createPointAni(model) {

  const group = new THREE.Group();

  // Create a torus know with basic geometry & material
  const geometry = new THREE.TorusKnotGeometry(4, 1.3, 100, 16);
  const torusKnot = new THREE.Mesh(geometry);

  // Instantiate a sampler so we can use it later
  const sampler = new MeshSurfaceSampler(model).build();

  // Array used to store all points coordinates
  const vertices = [];
  // Create a dummy Vector to store the sampled coordinates
  const tempPosition = new THREE.Vector3();
  // Loop to sample a coordinate for each points
  for (let i = 0; i < 5000; i++) {
    // Sample a random position in the torus
    sampler.sample(tempPosition);
    // Push the coordinates of the sampled coordinates into the array
    // vertices.push(tempPosition.x, tempPosition.y, tempPosition.z);
    // 把坐标扩大10倍
    vertices.push(tempPosition.x * 30, tempPosition.y * 30, tempPosition.z * 30);
  }

  // Create a geometry for the points
  const pointsGeometry = new THREE.BufferGeometry();
  // Define all points positions from the previously created array
  pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  // Define the matrial of the points
  const pointsMaterial = new THREE.PointsMaterial({
    color: 0xff61d5,
    size: 0.03
  });
  // Create an instance of points based on the geometry & material
  const points = new THREE.Points(pointsGeometry, pointsMaterial);
  // Add them into the main group
  group.add(points);

  return group;
}
export { createPointAni };