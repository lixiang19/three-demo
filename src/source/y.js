

// @author prisoner849

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
camera.position.set(5, 8, 13);
var renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x404040);
document.body.appendChild(renderer.domElement);

var controls = new THREE.OrbitControls(camera, renderer.domElement);

var geometry = new THREE.PlaneBufferGeometry(50, 50, 100, 100);
geometry.rotateX(-Math.PI * .5);
var material = new THREE.ShaderMaterial({
  uniforms: {
    time: {
      value: 0
    }
  },
  vertexShader: vertexShader,
  fragmentShader: fragmentShader,
  extensions: { derivatives: true }
});

var plane = new THREE.Mesh(geometry, material);
scene.add(plane);

var clock = new THREE.Clock();
var time = 0;
var delta = 0;

render();

function render() {
  delta = clock.getDelta();
  time += delta;
  requestAnimationFrame(render);
  material.uniforms.time.value = time;
  renderer.render(scene, camera);
}


var vertexShader = `
uniform float time;
varying vec3 pos;
void main()	{
  pos = position;
  vec3 p = position;
  //p.y = sin(p.x * .1 - time) * cos(p.z * .1 - time) * 5.;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
}
`;
var fragmentShader = `
/* based on http://madebyevan.com/shaders/grid/ */

varying vec3 pos;
uniform float time;

float line(float width, vec3 step){
  vec3 tempCoord = pos / step;
  
  vec2 coord = tempCoord.xz;

  vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord * width);
  float line = min(grid.x, grid.y);
  
  return 1. - min(line, 1.0);
}

void main() {
  float v = line(1., vec3(1.)) + line(1.5, vec3(10.));      
  vec3 c = v * vec3(0., 1., 1.) * (sin(time * 5. - length(pos.xz) * .5) * .5 + .5);
  c = mix(vec3(0.5), c, v);
  
  gl_FragColor = vec4(c, 1.0);
}
`;

