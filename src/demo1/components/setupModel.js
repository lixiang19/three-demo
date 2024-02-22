import * as THREE from 'three';
function setupModel(data) {

  const model = data.scene.children[0];
  model.traverse((object) => {

    if (object.isMesh) {
      // object.material.transparent = true;
      // // object.material.wireframe = true;

      // object.material.opacity = 0.5;
      const material = new THREE.MeshPhysicalMaterial({
        color: 0x469cf8, // 白色，你可以根据需要调整颜色
        metalness: 0, // 玻璃通常不是金属材质，所以金属感为0
        roughness: 0, // 玻璃表面非常光滑，因此粗糙度很低
        opacity: 0.3, // 设置透明度，玻璃通常是半透明的，可以根据需要调整
        transparency: 0.5, // 设置透明度，玻璃通常是半透明的，可以根据需要调整
        transparent: true, // 开启透明效果
        reflectivity: 1, // 反射率高，增强玻璃的反射效果
        refractionRatio: 0.18 // 斯涅尔定律的折射率，用于模拟光通过材质的折射
      });
      console.log("🚀 ~ model.traverse ~ object.name:", object.name)
      // if (object.name === 'frontal_01_-_Default_0') {
      //   material.color = new THREE.Color(0x00ff00);
      // }
      object.material = material;
    }
  });

  return model;
}
export { setupModel };