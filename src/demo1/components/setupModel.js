function setupModel(data) {

  const model = data.scene.children[0];
  model.traverse((object) => {

    if (object.isMesh) {
      object.material.transparent = true;
      // if (object.name === 'Brain_Part_06_Colour_Brain_Texture_0') {
      //   // object.visible = false
      //   object.material.opacity = 0.9;
      // } else {
      //   object.material.opacity = 0.1;
      //   object.visible = false
      // }
      object.material.opacity = 0.4;
    }
  });
  return model;
}
export { setupModel };