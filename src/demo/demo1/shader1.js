import * as THREE from "three";
// 顶点着色器
const vertexShader = `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// 片元着色器
const fragmentShader = `
  uniform float uTime;
  uniform float uBottomY;
  uniform float uTopY;
  varying vec3 vPosition;
  void main() {
    // 计算mesh的实际高度
    float height = uTopY - uBottomY;
    // 计算当前片元的相对高度
    float relativeHeight = (vPosition.y - uBottomY) / height;
    // 根据时间和相对高度计算颜色填充的进度
    float fillProgress = step(uTime, relativeHeight);
    // 应用颜色填充
    gl_FragColor = mix(vec4(1.0, 1.0, 1.0, 1.0), vec4(0.0, 0.0, 1.0, 1.0), fillProgress);
  }
`;

// 着色器材质
const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  uniforms: {
    uTime: { value: 0.0 },
    uBottomY: { value: -0.77 }, // 设置为mesh的最低点Y坐标
    uTopY: { value: 50 } // 设置为mesh的最高点Y坐标
  }
});

export default shaderMaterial;