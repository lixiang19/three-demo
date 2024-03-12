import { World } from './demo1/World.js';

window.sleep = function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function main() {
  const container = document.querySelector('#scene-container');
  const world = new World(container);
  world.start()
  window.world = world;
  await world.aniLineInit();
}


main();
