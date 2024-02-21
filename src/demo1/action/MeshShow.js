import { gsap } from 'gsap';

class MeshShow {
  constructor(model, camera) {
    this.model = model;
    this.camera = camera;
  }
  aniCamera() {
    gsap.to(this.camera.position, {
      duration: 2, // 动画持续时间，单位为秒
      x: 3,
      y: 1,
      z: 1,
      ease: "power1.out", // 缓动函数，可以根据需求选择不同的效果
    });
  }
  toggleMain() {
    this.model.traverse((object) => {
      if (object.isMesh) {
        object.material.transparent = true;
        object.material.opacity = 0.5;
        object.visible = true
      }
    });
    document.querySelector('.detail').style.display = 'none';
    gsap.to(this.camera.position, {
      duration: 1, // 动画持续时间，单位为秒
      x: 1,
      y: 3,
      z: 1,
      ease: "power1.out", // 缓动函数，可以根据需求选择不同的效果
    });
  }
  // 循环切换分区
  toggle() {
    this.model.traverse((object) => {
      if (object.isMesh) {
        object.material.transparent = true;
        if (object.name === 'Brain_Part_06_Colour_Brain_Texture_0') {
          object.material.opacity = 0.5;
          object.visible = true
        } else {
          object.material.opacity = 0.5;
          object.visible = false
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