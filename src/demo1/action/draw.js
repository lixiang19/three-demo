const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const points = new Set();
import { Clock } from "three";
let isDrawing = false;
let lastPoint = null;
let closestVertex = null;
import * as THREE from 'three'
let clock = new Clock();
import { Points } from '../edit/points.js'
function createTube(curve) {
  // shaderMaterial
  const vertexShader = `
  varying vec2 vUv;
  uniform float time;
  varying float vProgress;
  void main() {
    vUv = uv;
    vProgress = smoothstep(-1., 1., sin(vUv.x*20. - time * 3.));
    vec3 p = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
    `;
  const fragmentShader = `
  uniform float time;
  uniform vec3 color;
  uniform vec3 bgColor;
  varying vec2 vUv;
  varying float vProgress;
  void main() {
    vec3 finalColor = mix(color+vec3(0.7),bgColor +vec3(0.5), vProgress);
    gl_FragColor = vec4(finalColor, 1); // 正确设置RGBA值
  }
    `;
  const uniforms = {
    time: { value: 0 },
    color: { value: new THREE.Color("rgb(255, 255, 255)") },
    bgColor: { value: new THREE.Color("rgb(143, 206, 255)") },// 159, 213, 255 
  };
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const tube = new THREE.TubeGeometry(curve, 64, 0.1, 8, false);
  const mesh = new THREE.Mesh(tube, shaderMaterial);
  return mesh
}

class DrawCurve {
  constructor(scene, camera, model, controls) {
    this.scene = scene;
    this.camera = camera;
    this.model = model;
    this.curveObject = null;
    this.isDrawMode = false;
    this.controls = controls;
    this.curvePoints = [];
    this.lines = [];
    this.lineMaterials = [];
    this.lineGeometries = [];
    this.tubes = [];
    this.pratices = [];
    // const points = list.map(item => new THREE.Vector3(item.x, item.y, item.z))
    // const curve = new THREE.CatmullRomCurve3(points);
    // const tube = createTube(curve);
    // this.tubes.push(tube);
    // this.scene.add(tube);
  }

  tick(delta) {
    // Update the line animation or other tick-related logic here
    if (this.tubes.length > 0) {
      this.tubes.forEach((tube) => {
        tube.material.uniforms.time.value += (delta * 2);
      });
    }
  }

  toggleDrawMode() {
    this.isDrawMode = !this.isDrawMode;
    // this.controls.enabled = !this.isDrawMode;
  
    return this.isDrawMode;
  }

  addPoint(point) {
    // if (this.curvePoints.length > 0) {
    //   const lastPoint = this.curvePoints[this.curvePoints.length - 1];
    //   const distance = lastPoint.distanceTo(point);
    //   if (distance < 0.1) return; // 忽略太近的点
    // }
    this.curvePoints.push(point);
    const points = new Float32Array(this.curvePoints.length * 3);
    for (let i = 0; i < this.curvePoints.length; i++) {
      points[i * 3] = this.curvePoints[i].x;
      points[i * 3 + 1] = this.curvePoints[i].y;
      points[i * 3 + 2] = this.curvePoints[i].z;
    }
    this.lineGeometries[this.lineGeometries.length - 1].setAttribute('position', new THREE.BufferAttribute(points, 3));
    this.lineGeometries[this.lineGeometries.length - 1].setDrawRange(0, this.curvePoints.length);
    this.lineGeometries[this.lineGeometries.length - 1].attributes.position.needsUpdate = true;
  }

  startNewCurve() {
    const material = new THREE.LineBasicMaterial({ color: 0xffffff });
    const geometry = new THREE.BufferGeometry();
    this.lineMaterials.push(material);
    this.lineGeometries.push(geometry);
    const line = new THREE.Line(geometry, material);
    this.lines.push(line);
    this.scene.add(line);
  }

  onMouseMove(event) {
    if (!this.isDrawMode) return;
    if (event.button !== 0) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (isDrawing) {
      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObject(this.model, true);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        this.addPoint(point);
      }
    }
  }

  onMouseDown(event) {
    if (!this.isDrawMode) return;
    // 只监听左键
    if (event.button !== 0) return;
    isDrawing = true;
    this.startNewCurve();
  }

  onMouseUp(event) {
    if (!this.isDrawMode) return;
    if (event.button !== 0) return;
    isDrawing = false;
    if (this.lines.length > 0) {
      // 添加tube
      console.log('线条点位数组', this.curvePoints)
      const curve = new THREE.CatmullRomCurve3(this.curvePoints);
      const tube = createTube(curve);
      this.tubes.push(tube);
      this.scene.add(tube);

      const line = this.lines[this.lines.length - 1];
      this.scene.remove(line);
      this.lines.pop();
      this.lineMaterials.pop();
      this.lineGeometries.pop();
    }
    this.curvePoints = [];
  }

  startListen() {
    window.addEventListener('mousemove', this.onMouseMove.bind(this), false);
    window.addEventListener('mousedown', this.onMouseDown.bind(this), false);
    window.addEventListener('mouseup', this.onMouseUp.bind(this), false);
    this.toggleDrawMode();
  }

  stopListen() {
    this.isDrawMode = false;
    window.removeEventListener('mousemove', this.onMouseMove.bind(this), false);
    window.removeEventListener('mousedown', this.onMouseDown.bind(this), false);
    window.removeEventListener('mouseup', this.onMouseUp.bind(this), false);
  }
}

export { DrawCurve };