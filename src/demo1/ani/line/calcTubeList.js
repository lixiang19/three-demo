import * as THREE from 'three';
import { last } from './util'
import renderTube from './tube.js'
function connect(currentPath, points, smoothingFactor = 0.4) {
  // 根据传入数组长度和平滑因子来确定删除点的数量
  const deleteCount = Math.ceil(smoothingFactor * Math.min(currentPath.length, points.length));

  if (currentPath.length === 0) {
    return points;
  }
  if (currentPath.length < deleteCount || points.length < deleteCount) {
    console.error('点太少了，不够画曲线的');
    return currentPath.concat(points);
  }


  // 删除currentPath末尾的deleteCount个点
  const modifiedCurrentPath = currentPath.slice(0, -deleteCount);

  // 删除points头部的deleteCount个点
  const modifiedPoints = points.slice(deleteCount);

  // 获取贝塞尔曲线的起始点（currentPath处理后的最后一个点）
  const startPoint = modifiedCurrentPath[modifiedCurrentPath.length - 1];
  // 获取贝塞尔曲线的终点（points处理后的第一个点）
  const endPoint = modifiedPoints[0];

  // 控制点（points原始数组的第一个点）
  const controlPoint1 = points[0];
  // 因为是Cubic贝塞尔，需要第二个控制点，这里假设与第一个控制点相同
  const controlPoint2 = points[0];

  // 创建贝塞尔曲线
  const curve = new THREE.CubicBezierCurve3(startPoint, controlPoint1, controlPoint2, endPoint);
  // 获取曲线上的点（这里假设我们想要相同数量的点作为平滑过渡）
  const curvePoints = curve.getPoints(100);

  // 将处理后的currentPath、曲线点和处理后的points拼接
  // 再把modifiedCurrentPath和modifiedPoints多剔除一些点
  const finalModifiedCurrentPath = modifiedCurrentPath.slice(0, -2);
  const finalModifiedPoints = modifiedPoints.slice(2);
  const finalPath = finalModifiedCurrentPath.concat(curvePoints, finalModifiedPoints);

  // 返回最终路径
  return finalPath;
}
function treeToList(tree, path = [], list = []) {
  for (const node of tree) {
    const currentPath = connect(path, node.points);
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
function getTubeList(tree) {
  const list = treeToList(tree)
  const tubeList = []
  for (const item of list) {
    const tube = renderTube(item, new THREE.Color("rgb(255, 226, 158)"));
    tubeList.push(tube)
  }
  return tubeList
}
export { getTubeList }