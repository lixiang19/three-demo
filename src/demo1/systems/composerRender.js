import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import * as THREE from 'three';
let bloomPass = null
export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  // 创建RenderPass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  // 创建UnrealBloomPass
  bloomPass = new UnrealBloomPass(
    undefined,
    1.5, // 强度
    0.4, // 半径
    0.85 // 阈值
  );
  // const  = new UnrealBloomPass(
  //   undefined,
  //   6, // 强度
  //   0.3, // 半径
  //   0.3// 阈值
  // );
  composer.addPass(bloomPass);
  composer.setPixelRatio(2);
  return composer;
}
export function aniLineBloom() {
  bloomPass.strength = 6
  bloomPass.threshold = 0.1
  bloomPass.radius = 1
}
export function aniSparkBloom() {
  bloomPass.strength = 1
  bloomPass.threshold = 0.4
  bloomPass.radius = 0.85
}
export function aniSparkEnterBloom() {
  bloomPass.strength = 1
  bloomPass.threshold = 1
  bloomPass.radius = 0.85
}