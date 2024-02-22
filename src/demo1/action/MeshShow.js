import { gsap } from 'gsap';
import * as THREE from 'three';
class MeshShow {
  constructor(model, camera) {
    this.model = model;
    this.camera = camera;
  }
  aniCamera() {
    gsap.to(this.camera.position, {
      duration: 2, // 动画持续时间，单位为秒
      x: 30,
      y: 0,
      z: -80,
      ease: "power1.out", // 缓动函数，可以根据需求选择不同的效果
    });
  }
  toggleMain() {
    this.model.traverse((object) => {
      if (object.isMesh) {
        object.material.opacity = 0.3;
        object.material.color = new THREE.Color(0x469cf8);
      }
    });
    document.querySelector('.detail').style.display = 'none';
    gsap.to(this.camera.position, {
      duration: 1, // 动画持续时间，单位为秒
      x: 70,
      y: 10,
      z: 40,
      ease: "power1.out", // 缓动函数，可以根据需求选择不同的效果
    });
  }
  // 循环切换分区
  toggle() {
    this.model.traverse((object) => {
      if (object.isMesh) {

        if (object.name === 'frontal_01_-_Default_0') {
          object.material.opacity = 0.5;
          object.material.color = new THREE.Color(0x00ff00);

        }

      }
    });
    this.aniCamera();
    setTimeout(() => {
      document.querySelector('.detail').style.display = 'block';
    }, 1800)
  }
}
export { MeshShow };