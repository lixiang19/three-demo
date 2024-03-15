import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
class Auxiliary {
  constructor() {

  }
  setGroup(group) {
    this.group = group;
  }
  createPoint(point, color = 0xffff00) {
    const geometry = new THREE.SphereGeometry(0.005, 32, 32);
    const material = new THREE.MeshBasicMaterial({ color: color });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.set(point.x, point.y, point.z);
    this.group.add(sphere);
  }
  createLine(point, otherPoint, color) {
    let matLine = new LineMaterial({
      color: color || 0xffffff,
      linewidth: 0.002, // in pixels
      transparent: true,
      opacity: 0.3,
      alphaToCoverage: true,
    });
    let geometry = new LineGeometry();
    geometry.setPositions([point.x, point.y, point.z, otherPoint.x, otherPoint.y, otherPoint.z]);
    const line2 = new Line2(geometry, matLine);
    this.group.add(line2)
  }
  createNormalLine(point, normal) {
    const endPoint = new THREE.Vector3().addVectors(point, normal.normalize().multiplyScalar(0.5));
    this.createLine(point, endPoint, 0xff0000)
  }
}
const auxiliary = new Auxiliary()
export default auxiliary;