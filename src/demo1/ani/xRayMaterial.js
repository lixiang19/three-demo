import fragment from './fragment.glsl?raw'
import vertex from './vertex.glsl?raw'
import * as THREE from 'three'
function createXRayMaterial() {
  const xRayMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      glowColor: { value: new THREE.Color(0x3d71ca) },
      viewVector: { value: new THREE.Vector3(0, 0, 0) },
      c: { value: 1.0 },
      p: { value: 4.0 },
      offsetY: { value: 0.0 },
      teColor: { value: new THREE.Color(0x000000) }
    },
  
    vertexShader: vertex,
    fragmentShader: fragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  return xRayMaterial
}
export { createXRayMaterial }