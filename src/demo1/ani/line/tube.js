import * as THREE from "three";
function renderTube(points) {
  const curve = new THREE.CatmullRomCurve3(points);
  const tubeGeometry = new THREE.TubeGeometry(curve, 200, 0.001, 8, false);

  const vertexShader = `
  varying vec2 vUv;
  uniform float time;
  varying float vProgress;

  void main() {
    vUv = uv;

    vec3 p = position;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
    `;
  const fragmentShader = `
    uniform float time;
    uniform vec3 color;
    uniform vec3 emissive; // 新增emissive变量来控制发光颜色
    varying vec2 vUv;
    varying float vProgress;
    uniform float progress; // 用于控制动画进度的uniform变量
    void main() {
      if (vUv.x > progress) discard; // 如果顶点的位置大于动画进度，则不显示该片元
      // float stripe = step(0.5, fract(vUv.x * 2.0));
      // vec3 c = mix(color, emissive, stripe);
      // gl_FragColor = vec4(color, 1.0);
      vec3 finalColor = color + emissive;
      gl_FragColor = vec4(finalColor, 1.0); // 设置片元的颜色和透明度
    }
  `;
  const uniforms = {
    time: { value: 0 },
    progress: { value: 1.0 }, // 初始化progress值为0
    color: { value: new THREE.Color("rgb(205, 127, 50)") },
    emissive: { value: new THREE.Color("rgb(248, 226, 158)") },// 159, 213, 255

  };
  const shaderMaterial = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const tube = new THREE.Mesh(tubeGeometry, shaderMaterial);
  return tube;
}
export default renderTube;