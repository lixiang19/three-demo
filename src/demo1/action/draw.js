const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const points = new Set();
import { Clock } from "three";
let isDrawing = false;
let lastPoint = null;
let closestVertex = null;
import * as THREE from 'three'
let clock = new Clock();
import { Points } from '../components/points.js'
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
    vec3 finalColor = mix(color,bgColor , vProgress);
    gl_FragColor = vec4(finalColor, 1); // 正确设置RGBA值
  }
    `;
  const uniforms = {
    time: { value: 0 },
    color: { value: new THREE.Color("rgb(255, 255, 255)") },
    bgColor: { value: new THREE.Color("rgb(136, 243, 236)") },// 159, 213, 255 
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
    this.curveObject = null; // 维护当前曲线对象的引用
    this.praticeObject = null; // 维护当前曲线对象的引用
    this.isDrawMode = false; // 是否是绘制模式
    this.controls = controls;
    this.curve = [];
    // 支持多条线
    this.curves = [];
    this.tubes = [];
    this.pratices = [];
  }
  tick(delta) {
    if (this.tubes.length > 0) {
      this.tubes.forEach((tube) => {
        tube.material.uniforms.time.value += (delta * 2);
      });
    }
    if (this.praticeObject) {
      this.praticeObject.tick(delta);
    }
  }
  toggleDrawMode() {
    this.isDrawMode = true
    this.controls.enabled = !this.isDrawMode; // 根据绘制模式启用/禁用OrbitControls
    points.clear()
    return this.isDrawMode;
  }
  updateCurve() {
    const curve = new THREE.CatmullRomCurve3(Array.from(points));
    this.curve = curve;
    const tube = createTube(curve);
    if (this.curveObject) {
      this.scene.remove(this.curveObject);
    }
    this.curveObject = tube;
    this.scene.add(this.curveObject);
  }

  onMouseMove(event) {
    if (!this.isDrawMode) return; // 如果不是绘制模式，不执行任何操作

    // 将鼠标位置转换为归一化设备坐标(NDC)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (isDrawing) {
      raycaster.setFromCamera(mouse, this.camera);
      const intersects = raycaster.intersectObject(this.model, true);
      if (intersects.length > 0) {
        const point = intersects[0].point;

        points.add(point);

        if (points.size > 1) {
          this.updateCurve();
        }

      }

    }
  }

  onMouseDown(event) {
    if (!this.isDrawMode) return; // 如果不是绘制模式，不执行任何操作

    isDrawing = true;
  }
  onMouseUp(event) {
    if (!this.isDrawMode) return; // 如果不是绘制模式，不执行任何操作

    isDrawing = false;
    if (this.curveObject) {
      this.curves.push(this.curve);
      this.tubes.push(this.curveObject);
      this.curveObject = null;
    }
    points.clear();
    // if (this.praticeObject) {
    //   this.scene.remove(this.praticeObject.pratice);
    // }
    // const point = new Points(this.curves);
    // point.init()
    // const pratice = point.createParticles();
    // this.praticeObject = point;
    // this.scene.add(pratice);
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