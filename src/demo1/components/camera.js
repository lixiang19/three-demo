import { PerspectiveCamera } from 'three';
import { gsap } from 'gsap';
let camera
function createCamera() {
  camera = new PerspectiveCamera(
    45, // fov = Field Of View
    1, // aspect ratio (dummy value)
    0.1, // near clipping plane
    1000, // far clipping plane
  );


  camera.position.set(0, 0, 0);


  return camera;
}

function animateCamera() {

  gsap.to(camera.position, {
    duration: 2,
    x: 70,
    y: 10,
    z: 30,
    ease: "power1.out",
  });
  camera.updateProjectionMatrix();
}
function aniCameraSparkle() {
  // 使用GSAP动画镜头位置
  gsap.to(camera.position, {
    duration: 2,
    x: -22,
    y: 2,
    z: 12,
    ease: "power1.out",
  });
  camera.updateProjectionMatrix();
}
function aniCameraLine() {
  gsap.to(camera.position, {
    duration: 2,
    x: 1.7,
    y: 18,
    z: 429,
    ease: "power1.out",
  });
  camera.updateProjectionMatrix();
}
function aniCameraFlow() {
  gsap.to(camera.position, {
    duration: 2,
    x: -3.6,
    y: 0.01,
    z: 0.43,
    ease: "power1.out",
  });
  camera.updateProjectionMatrix();
}
export { createCamera, aniCameraFlow, animateCamera, aniCameraLine, aniCameraSparkle };