import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js';
import * as THREE from 'three';
function createControls(camera, canvas) {
  const controls = new TrackballControls(camera, canvas);

  controls.tick = () => controls.update();
  controls.addEventListener('change', () => {
    // console.log('相机位置发生变化');
    // // 此时可以直接访问camera.position来获取当前的位置
    // console.log(camera.position.x, camera.position.y, camera.position.z);
  });
  controls.rotateSpeed = 3.0;
  // controls.mouseButtons = {
  //   // LEFT: THREE.MOUSE.PAN,
  //   MIDDLE: THREE.MOUSE.DOLLY,
  //   RIGHT: THREE.MOUSE.ROTATE
  // }

  return controls;
}
export { createControls };