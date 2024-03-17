import { filter, random, shuffle, last } from 'lodash-es'
import * as THREE from 'three'
function toVector3(point) {
  return new THREE.Vector3(point.x, point.y, point.z)
}
function getTreeLevel(tree, level) {
  const result = []
  function findLevel(tree, level) {
    tree.forEach(item => {
      if (item.level === level) {
        result.push(item)
      } else {
        findLevel(item.children, level)
      }
    })
  }
  findLevel(tree, level)
  return result
}
function getRandomColor() {
  return Math.random() * 0xffffff;
}
function treeToList(tree, path = [], list = []) {
  // 遍历树的每个节点
  for (const node of tree) {
    // 复制当前路径并添加当前节点的点
    const currentPath = path.concat(node.points);

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
export { filter, last, random, shuffle, getTreeLevel, toVector3, treeToList, getRandomColor }