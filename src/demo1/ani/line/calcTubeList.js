import * as THREE from 'three';
import { last } from './util'
import renderTube from './tube.js'
import auxiliary from './Auxiliary.js';
function connect(currentPath, node) {
  // auxiliary.createPoint(points[0], 0x00ff00)
  return currentPath.concat([
    node.points[0]
  ]);
}

function treeToList(tree, path = [], list = []) {
  for (const node of tree) {

    const currentPath = connect(path, node);
    if (node.children && node.children.length > 0) {
      // 如果当前节点有子节点，递归遍历子节点
      treeToList(node.children, currentPath, list);
    } else {
      // 如果当前节点没有子节点，将当前路径添加到列表中
      list.push(currentPath);
    }
  }
  return list;
}

const startControlMap = new Map();
function insertBezier(list) {

  var curvePoints = [list[0]];
  for (var i = 0; i < list.length - 1; i++) {
    var start = list[i];
    var end = list[i + 1];
    var control = startControlMap.get(start)
    if (!control) {
      control = getControlPoint(start, end);
      startControlMap.set(start, control);
    }
    // auxiliary.createPoint(control, 0x00ffff)
    curvePoints.push(control);
    curvePoints.push(end);
  }

  return curvePoints;
}
function getControlPoint(v1, v2) {
  const cpLength = v1.distanceTo(v2) / THREE.MathUtils.randFloat(2.0, 4.0);


  var dirVec = new THREE.Vector3().copy(v2).sub(v1).normalize();
  var northPole = new THREE.Vector3(0, 0, 1); // this is original axis where point get sampled
  var axis = new THREE.Vector3().crossVectors(northPole, dirVec).normalize(); // get axis of rotation from original axis to dirVec
  var axisTheta = dirVec.angleTo(northPole); // get angle
  var rotMat = new THREE.Matrix4().makeRotationAxis(axis, axisTheta); // build rotation matrix

  var minz = Math.cos(THREE.MathUtils.degToRad(45)); // cone spread in degrees
  var z = THREE.MathUtils.randFloat(minz, 1);
  var theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
  var r = Math.sqrt(1 - z * z);
  var cpPos = new THREE.Vector3(r * Math.cos(theta), r * Math.sin(theta), z);
  cpPos.multiplyScalar(cpLength); // length of cpPoint
  cpPos.applyMatrix4(rotMat); // rotate to dirVec
  cpPos.add(v1); // translate to v1
  return cpPos;
};
function getTubeList(tree) {
  const list = treeToList(tree)
  console.log("🚀 ~ file: calcTubeList.js ~ line 132 ~ getTubeList ~ list", list)
  const tubeList = []
  for (const item of list) {
    const points = insertBezier(item)
    const tube = renderTube(points, new THREE.Color("rgb(255, 0, 158)"));
    tubeList.push(tube)
  }
  return tubeList
}



export { getTubeList }
