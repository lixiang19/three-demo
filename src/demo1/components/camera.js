import { PerspectiveCamera } from 'three';
import { gsap } from 'gsap';

function createCamera() {
  const camera = new PerspectiveCamera(
    30, // fov = Field Of View
    1, // aspect ratio (dummy value)
    0.1, // near clipping plane
    100, // far clipping plane
  );

  // move the camera back so we can view the scene
  camera.position.set(0, 0, 1);
  // 拉近镜头

  return camera;
}

function animateCamera(camera) {
  // 使用GSAP动画镜头位置
  gsap.to(camera.position, {
    duration: 2, // 动画持续时间，单位为秒
    x: 1,
    y: 3,
    z: 1,
    ease: "power1.out", // 缓动函数，可以根据需求选择不同的效果
  });
}

export { createCamera, animateCamera };