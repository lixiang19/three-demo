import { filter, random, shuffle } from 'lodash-es'
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
export { filter, random, shuffle, getTreeLevel, toVector3, getRandomColor }