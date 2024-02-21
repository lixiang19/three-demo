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
    undefined, 1, 1, 1
  );
  composer.addPass(bloomPass);
  return composer;
}