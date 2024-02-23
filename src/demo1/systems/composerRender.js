import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import * as THREE from 'three';
export function createComposer(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);

  // 创建RenderPass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);
  // 创建UnrealBloomPass
  const bloomPass = new UnrealBloomPass(
    undefined,
    1.5, // 强度
    0.4, // 半径
    0.85 // 阈值
  );
  composer.addPass(bloomPass);
  composer.setPixelRatio(2);
  return composer;
}