import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
function createControls(camera, canvas) {
  const controls = new OrbitControls(camera, canvas);

  controls.tick = () => controls.update();
  // controls.addEventListener('change', () => {
  //   console.log('相机位置发生变化');
  //   // 此时可以直接访问camera.position来获取当前的位置
  //   console.log(camera.position.x, camera.position.y, camera.position.z);
  // });

  return controls;
}
export { createControls };