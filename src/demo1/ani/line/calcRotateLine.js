
import { toVector3, random, getTreeLevel } from './util'
import * as THREE from 'three';
import auxiliary from './Auxiliary'


// 这几个中心都是0，这个是不对的，应该是个参数
class CalcRotateLine {
  constructor(originalData, raycaster, meshModel) {
    this.startPoint = toVector3(originalData.point)
    this.endPoint = toVector3(originalData.endPoint)
    this.startNormal = toVector3(originalData.normal).normalize()
    this.raycaster = raycaster
    this.meshModel = meshModel
  }
  createLineArea() {

    const bottomDegList = [60, 80, 100, 110]
    const leftDegList = [280, 300, 320, 340, 1, 20, 30]
    const rightDegList = [150, 160, 170, 180]
    // const bottomDegList = []
    // const leftDegList = [280]
    // const rightDegList = []
    return [
      {
        area: 'bottom',
        degList: bottomDegList,
        lines: this.createLines(bottomDegList)
      },
      {
        area: 'left',
        degList: leftDegList,
        lines: this.createLines(leftDegList)
      },
      {
        area: 'right',
        degList: rightDegList,
        lines: this.createLines(rightDegList)
      }
    ]
  }
  createLines(degList) {
    const lengthRange = [0.1, 0.3] //CONFIG 旋转线的长度范围
    const endPoints = []

    degList.forEach(deg => {
      const rotateEndPoint = this.tryCalcNewRotateEndPoint(deg, lengthRange)
      if (rotateEndPoint) {
        // auxiliary.createLine(this.startPoint, rotateEndPoint, 0x00ff00)
        endPoints.push(rotateEndPoint)
      }
    })
    const items = endPoints.map(p => {

      return {
        point: this.startPoint,
        endPoint: p,
        normal: this.startNormal
      }
    })
    return items
  }
  tryCalcNewRotateEndPoint(deg, lengthRange) {
    let count = 0
    let MAX = 40 // 最大尝试次数
    let newEndPoint = null
    while (!newEndPoint && count < MAX) {
      // let deg = random(ageRange[0], ageRange[1])
      let length = random(lengthRange[0], lengthRange[1])

      const rayP = this.calcNewRotateEndPoint(deg, length)
      const checkRes = this.checkRayP(rayP)
      if (checkRes) {

        newEndPoint = rayP.point

      }
      count++
    }

    return newEndPoint
  }
  checkRayP(rayP) {
    const endPoint = this.endPoint
    // 暂时判断有无，后续可以加入更多判断条件
    if (rayP) {

      if (rayP.point.distanceTo(endPoint) > 0.8) {

        return false
      } else {
        return true
      }
    } else {
      return false
    }
  }


  calcNewRotateEndPoint(deg, length) {

    const startPoint = this.startPoint
    const endPoint = this.endPoint
    const startNormal = this.startNormal

    let originalDirection = new THREE.Vector3().subVectors(endPoint, startPoint).normalize(); //旋转的其实是个方向向量
    let rotationAxis = startNormal.normalize();
    let quaternion = new THREE.Quaternion().setFromAxisAngle(rotationAxis, THREE.MathUtils.degToRad(deg));
    let direction = originalDirection.clone().applyQuaternion(quaternion);
    // auxiliary.createNormalLine(startPoint, direction)
    let newEndPoint = new THREE.Vector3().addVectors(startPoint, direction.multiplyScalar(length));
    const o = new THREE.Vector3(0, 0, 0)
    const newDirection = new THREE.Vector3().subVectors(o, newEndPoint).normalize();

    const rayP = this.getRayP(newEndPoint, newDirection)


    return rayP
  }
  getRayP(rayOrigin, rayDirection) {
    this.raycaster.set(rayOrigin, rayDirection);
    // this.raycaster.firstHitOnly = true
    const intersects = this.raycaster.intersectObject(this.meshModel); // 假设mesh是你的模型对象

    if (intersects.length > 0) {
      const p = intersects[0]
      return p
    } else {
      return null
    }
  }
}
export default CalcRotateLine;  