import { toVector3, random, getTreeLevel } from './util'
import * as THREE from 'three';
import auxiliary from './Auxiliary'
// 转轴多发生在下半部分因为上部分有个起点
class CalcRrayLine {
  constructor(originalData, raycaster, meshModel) {
    this.originStartPoint = toVector3(originalData.point)
    this.originEndPoint = toVector3(originalData.endPoint)
    this.originNormal = toVector3(originalData.normal).normalize()
    this.tree = [
      {
        level: 0,
        rayPoints: [],
        lineData: {
          startPoint: toVector3(originalData.point),
          endPoint: toVector3(originalData.endPoint),
          rotateNormal: toVector3(originalData.normal).normalize(),
          rayNormal: toVector3(originalData.normal).normalize()
        },
        points: [],
        children: []
      }
    ]
    this.raycaster = raycaster
    this.meshModel = meshModel

  }
  getChildCount(forkLevel) {

    if (forkLevel <= 1) {
      return random(2, 3)
    } else {
      return 1
    }
  }
  createTree(count = 2) {
    // 先随机分叉次数
    const tree = this.tree
    this.setupRayPoints(tree[0]) // 设置第一层的投影点
    const forkCount = count || random(3, 5)
    for (let index = 0; index < forkCount; index++) {
      const currentLevel = getTreeLevel(tree, index)
      currentLevel.forEach(treeItem => {
        const startPoint = treeItem.lineData.startPoint
        const endPoint = treeItem.lineData.endPoint
        const rotateNormal = treeItem.lineData.rotateNormal
        // 分叉数量
        const childCount = this.getChildCount(treeItem.level)
        for (let i = 0; i < childCount; i++) {
          const secondTreeItem = this.calcChild(startPoint, endPoint, rotateNormal, index + 1)
          if (secondTreeItem) {
            const newRotateNormal = treeItem.rayPoints[treeItem.rayPoints.length - 1].normal
            secondTreeItem.lineData.rotateNormal = newRotateNormal
            this.setupRayPoints(secondTreeItem)
            treeItem.children.push(secondTreeItem)
          }
        }
      })
    }
    return tree
  }
  setupRayPoints(treeItem) {
    const startPoint = treeItem.lineData.startPoint
    const endPoint = treeItem.lineData.endPoint
    const rayNormal = treeItem.lineData.rayNormal
    const rayPoints = this.calcRayPoints(startPoint, endPoint, rayNormal)
    treeItem.rayPoints = rayPoints
    treeItem.points = this.calcCurvePoints(startPoint, endPoint, rayPoints)
    return treeItem
  }
  // 获得投影点
  calcRayPoints(startPoint, endPoint, vertexNormal) {
    const lineCurveDirection = new THREE.LineCurve3(startPoint, endPoint);
    const numberOfPoints = 30; // 取点的精度
    const pointsDirection = lineCurveDirection.getPoints(numberOfPoints);
    const rayPoints = []
    pointsDirection.forEach((point, index) => {
      const rayPoint = point
      const rayOrigin = new THREE.Vector3().addVectors(rayPoint, vertexNormal.normalize().multiplyScalar(0.5)); // 一直以来的bug有一点原来是镜头太近
      const rayDirection = new THREE.Vector3().subVectors(rayPoint, rayOrigin).normalize();
      // auxiliary.createLine(rayOrigin, rayPoint, 0x00ff00)
      this.raycaster.set(rayOrigin, rayDirection);
      this.raycaster.firstHitOnly = true;
      const intersects = this.raycaster.intersectObject(this.meshModel)
      if (intersects.length > 0) {
        if (rayPoints.length > 1) {
          const lastPoint = rayPoints[rayPoints.length - 1].point
          const distance = lastPoint.distanceTo(intersects[0].point)
          if (distance > 0.05) { // 这个距离上个投影不应该那么远
            console.log('距离上个投影点太远')
            return false
          } else {
            rayPoints.push(intersects[0])
          }
        } else {
          rayPoints.push(intersects[0])
        }

      }
    })
    return rayPoints
  }
  // 计算曲线的点TODO: 这个需要大写特写
  calcCurvePoints(startPoint, endPoint, rayPoints) {
    // return [startPoint].concat(rayPoints.map(p => p.point)).concat([endPoint])
    return rayPoints.map(p => p.point)
  }
  calcChild(startPoint, endPoint, rotateNormal, level) {
    let degRange = [-30, 30] // CONFIG: 旋转角度范围
    let lengthRange = [0.1, 0.5] //CONFIG: 旋转长度范围
    const nextLine = new NextLine({
      startPoint,
      endPoint,
      rotateNormal, // 旋转轴现在选取的是起点的法线
      degRange,
      lengthRange,
      raycaster: this.raycaster,
      meshModel: this.meshModel

    })
    const nextLineData = nextLine.start()
    if (nextLineData) {
      const secondTreeItem = {
        level: level,
        rayPoints: [],
        points: [],
        lineData: {
          startPoint: nextLineData.nextStartPoint,
          endPoint: nextLineData.nextEndPoint,
          rotateNormal: null,
          rayNormal: nextLineData.rayNormal
        },
        children: []
      }
      return secondTreeItem
    } else {
      return null
    }

  }
}
class NextLine {
  constructor({ startPoint, endPoint, rotateNormal, degRange, lengthRange, raycaster, meshModel }) {
    this.startPoint = startPoint
    this.endPoint = endPoint
    this.rotateNormal = rotateNormal
    this.degRange = degRange
    this.lengthRange = lengthRange
    this.raycaster = raycaster
    this.meshModel = meshModel
  }
  start() {
    let newEndPoint = null
    let newRayP = null
    let count = 0
    let MAX = 40 // 最大尝试次数
    const degRange = this.degRange
    const lengthRange = this.lengthRange
    while (!newEndPoint && count < MAX) {
      let deg = random(degRange[0], degRange[1])
      // deg = deg <= 0 ? (deg - 10) : (deg + 10)
      const length = random(lengthRange[0], lengthRange[1])
      const rotationLine = this.calcRotationLine(deg, length)
      const checkRes = this.checkRayP(rotationLine.rayP, rotationLine.newEndPoint)
      if (checkRes) {
        newEndPoint = rotationLine.newEndPoint
        newRayP = rotationLine.rayP
      }
      if (count > 20) {
        degRange[0] = degRange[0] * 2
        degRange[1] = degRange[1] * 2
        lengthRange[0] = lengthRange[0] / 2
        lengthRange[1] = lengthRange[1] * 2  // 20次还不行就放宽限制
        console.log('放宽限制')
      }
      count++
    }
    if (newEndPoint) {
      const newNormal = new THREE.Vector3().subVectors(newEndPoint, newRayP.point).normalize()
      // 辅助线
      // const o = new THREE.Vector3(0, 0, 0)
      // auxiliary.createPoint(newRayP.point, 0x00ff00)
      // auxiliary.createLine(this.endPoint, newRayP.point, 0x00ffff)
      // auxiliary.createLine(newRayP.point, o)
      // auxiliary.createPoint(newRayP.point, 0xff00ff)
      return {
        nextStartPoint: this.endPoint,
        nextEndPoint: newRayP.point,
        rayNormal: newNormal
      }
    } else {
      console.log('尝试次数过多')
      return null
    }

  }

  calcRotationLine(deg, length) {
    const rotateNormal = this.rotateNormal
    const startPoint = this.startPoint
    const endPoint = this.endPoint
    const direction = new THREE.Vector3().subVectors(endPoint, startPoint).normalize();
    let newEndPoint = new THREE.Vector3().addVectors(endPoint, direction.multiplyScalar(length));
    const angle = THREE.MathUtils.degToRad(deg); // 将角度转换为弧度
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationAxis(rotateNormal.normalize(), angle);
    // 应用旋转矩阵到newEndPoint
    newEndPoint.applyMatrix4(rotationMatrix);
    const o = new THREE.Vector3(0, 0, 0)
    let newDirection = new THREE.Vector3().subVectors(o, newEndPoint).normalize(); // 0点指向newEndPoint的向量
    const rayP = this.getRayP(newEndPoint, newDirection)



    return {
      newEndPoint,
      rayP
    }
  }
  checkRayP(rayP, newEndPoint) {
    if (!rayP) {
      return false
    } else {
      // 检查rayPoint是否在newEndPoint的前面，太远意味着newEndPoint在模型内部，投影投到对面的面上了，不合适
      const endPoint = this.endPoint
      const distance = rayP.point.distanceTo(newEndPoint)
      const distance2 = rayP.point.distanceTo(endPoint)
      if (distance > 0.6 || distance2 > 0.6) { // 0.6看着写的
        return false
      } else {
        return true
      }
    }
  }
  getRayP(rayOrigin, rayDirection) {
    this.raycaster.set(rayOrigin, rayDirection);
    this.raycaster.firstHitOnly = true
    const intersects = this.raycaster.intersectObject(this.meshModel); // 假设mesh是你的模型对象
    if (intersects.length > 0) {
      const p = intersects[0]
      return p
    } else {
      null
    }
  }
}
export default CalcRrayLine;

