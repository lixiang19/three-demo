import * as THREE from 'three';
const randomRange = (min, max) =>
  Math.random() * (max - min) + min;
const density = 10;
// 定义BrainParticleMaterial
const BrainParticleMaterial = new THREE.ShaderMaterial({
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color('rgb(220, 193, 147)') }
  },
  vertexShader: `
    varying vec2 vUv;
    uniform float time;
    attribute float randoms;
    void main() {
      vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = randoms * 2. * (1. / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform float time;
    void main() {
      float disc = length(gl_PointCoord.xy - vec2(0.5));
      float opacity = 0.3 * smoothstep(0.5, 0.4, disc);
      gl_FragColor = vec4(vec3(opacity), 1.);
    }
  `,
  depthTest: false,
  depthWrite: false,
  transparent: true,
  blending: THREE.AdditiveBlending
});
class Points {
  constructor(curves) {
    this.curves = curves;
    this.pratice = null
    this.geometry = null;
    this.myPoints = [];
  }
  init() {
    for (let i = 0; i < this.curves.length; i++) {
      for (let j = 0; j < density; j++) {
        this.myPoints.push({
          currentOffset: Math.random(),
          speed: Math.random() * 0.01,
          curve: this.curves[i],
          curPosition: Math.random(),
        });
      }
    }

  }
  calcPositions(numberOfPoints) {
    const positions = [];
    for (let i = 0; i < numberOfPoints; i++) {
      positions.push(
        randomRange(-1, 1),
        randomRange(-1, 1),
        randomRange(-1, 1),
      );
    }
    return new Float32Array(positions);
  }
  calcRandoms(numberOfPoints) {
    const randoms = [];

    for (let i = 0; i < numberOfPoints; i++) {
      randoms.push(randomRange(3, 20));
    }

    return new Float32Array(randoms);
  }
  createParticles() {
    // 创建粒子几何体和材质
    const curves = this.curves; // 你需要在这里填充曲线数据

    const numberOfPoints = density * curves.length;
    const positions = this.calcPositions(numberOfPoints);
    const randoms = this.calcRandoms(numberOfPoints);

    // 填充positions和randoms数据
    // 这部分需要根据你的具体逻辑来生成粒子的初始位置和大小

    const geometry = new THREE.BufferGeometry();
    this.geometry = geometry;
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('randoms', new THREE.BufferAttribute(randoms, 1));
    const points = new THREE.Points(geometry, BrainParticleMaterial);
    this.pratice = points;
    return points;
  }
  tick(delta) {
    const brainGeoCurPositions = this.geometry.attributes.position.array;
    const myPoints = this.myPoints;
    for (let i = 0; i < myPoints.length; i++) {
      myPoints[i].curPosition += myPoints[i].speed;
      myPoints[i].curPosition = myPoints[i].curPosition % 1;

      const curPosition = myPoints[i].curve.getPointAt(
        myPoints[i].curPosition,
      );
      brainGeoCurPositions[i * 3] = curPosition.x;
      brainGeoCurPositions[i * 3 + 1] = curPosition.y;
      brainGeoCurPositions[i * 3 + 2] = curPosition.z;
    }

    this.geometry.attributes.position.needsUpdate = true;
  }
}
export { Points };