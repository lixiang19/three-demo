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
    x: 49,
    y: 13,
    z: -0.8,

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
    duration: 0.1,
    // x: 2,
    // y: 27,
    // z: -8,
    // x: -1,
    // y: 21,
    // z: -11,
    x: 2.3,
    y: -0.02,
    z: 0.33
  });
  // 镜头向y轴正向平移

  camera.updateProjectionMatrix();
}
function aniCameraLight() {
  gsap.to(camera.position, {
    duration: 2,
    x: 1,
    y: 28,
    z: -1.3,
    ease: "power1.out",
  });
  camera.updateProjectionMatrix();
}
function aniCameraFlow() {
  gsap.to(camera.position, {
    duration: 2,
    x: 22,
    y: 14,
    z: 42,
    ease: "power1.out",
  });
  camera.updateProjectionMatrix();
}
function aniCameraSparkleEnter() {
  // camera.position.z = 1000;
  gsap.to(camera.position, {
    duration: 1,
    z: 1000,
    ease: "power1.out",
  });
  gsap.to(camera.position, {
    duration: 3,
    delay: 1,
    z: 500,
    ease: "power1.out",
  });

}
export { createCamera, aniCameraLight, aniCameraSparkleEnter, aniCameraFlow, animateCamera, aniCameraLine, aniCameraSparkle };