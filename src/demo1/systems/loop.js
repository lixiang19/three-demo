import { Clock } from "three";
const clock = new Clock();

class Loop {
  constructor(camera, scene, renderer, composer) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;
    this.updatables = [];
    this.composer = composer;

  }

  start() {
    this.renderer.setAnimationLoop(() => {
      // render a frame
      this.tick();
      // this.renderer.render(this.scene, this.camera);
      this.composer.render();

    });
  }

  stop() {
    this.renderer.setAnimationLoop(null);
  }
  tick() {

    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();
    for (const object of this.updatables) {
      object.tick(delta, elapsedTime);
    }
  }
}

export { Loop };