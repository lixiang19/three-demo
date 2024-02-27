import * as THREE from 'three'
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const points = new Set();
class Dot {
  constructor(scene, camera, model, controls) {
    this.scene = scene;
    this.camera = camera;
    this.model = model;
    this.controls = controls;
    this.isDotMode = false; // 是否是绘制模式
    this.dots = [];
  }
  onMouseDown(e) {
    if (!this.isDotMode) return
    this.setDot(e);
  }
  setDot(event) {
    // 将鼠标位置转换为归一化设备坐标(NDC)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, this.camera);
    const intersects = raycaster.intersectObject(this.model, true);
    console.log("🚀 ~ Dot ~ setDot ~ intersects:", intersects)
    if (intersects.length > 0) {
      const point = intersects[0].point;
      console.log('点位是', point)
      points.add(point);
      if (points.size > 0) {
        this.renderPoint(point);
      }
    }
  }
  tick(delta, elapsedTime) {

    if (this.dots.length > 0) {
      this.dots.forEach(dot => {
        dot.material.emissiveIntensity = Math.abs(Math.sin(elapsedTime * 2)) * 2;
      }
      )
    }
  }
  renderPoint(point) {
    const geometry = new THREE.SphereGeometry(0.3, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1 });
    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(point);
    this.dots.push(sphere);
    this.scene.add(sphere);
  }
  startListen() {
    this.controls.enabled = false;
    window.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    this.isDotMode = true;
  }
  stopListen() {
    this.isDotMode = false;
    this.controls.enabled = true;
    window.removeEventListener('mousedown', this.onMouseDown.bind(this), false);
  }
}
export { Dot };