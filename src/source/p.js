
// @author prisoner849

var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 100);
camera.position.set(20, 5, 30);

var scene = new THREE.Scene();

var light = new THREE.PointLight();
light.position.set(0, 20, 50);
scene.add(light);

var renderer = new THREE.WebGLRenderer({
  antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

controls = new THREE.OrbitControls(camera, renderer.domElement);

var geometry = bendTheCone(0.1, 0.5, 10, THREE.Math.degToRad(320), 50);
var mesh = new THREE.Mesh(geometry, new THREE.MeshNormalMaterial());
scene.add(mesh);

var plane = new THREE.GridHelper(20, 40);
scene.add(plane);

animate();

function bendTheCone(r1, r2, rMain, theta, segments) {
  var geom = new THREE.CylinderGeometry(r1, r2, theta, 16, segments);
  geom.translate(rMain, theta / 2, 0);

  let pos = geom.attributes.position;
  let v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);

    pos.setXY(i, Math.cos(v.y) * v.x, Math.sin(v.y) * v.x);
  }
  // old version with Geometry
  /*geom.vertices.forEach(function(vertex){
    var localTheta = vertex.y;
    var localRadius = vertex.x;
    vertex.x = Math.cos(localTheta) * localRadius;
    vertex.y = Math.sin(localTheta) * localRadius;
  });
  
  geom.computeFaceNormals();*/
  geom.computeVertexNormals();



  return geom;
}

function animate() {
  requestAnimationFrame(animate);
  mesh.rotation.z -= 0.025;
  renderer.render(scene, camera);
}
