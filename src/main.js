import { World } from './demo1/World.js';

// create the main function
function main() {
  const container = document.querySelector('#scene-container');

  // 1. Create an instance of the World app
  const world = new World(container);

  // 2. Render the scene
  world.start()
}

// call main to start the app
main();