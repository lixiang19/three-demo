

// @author hofk

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(-8, 10, 20);
var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
var controls = new THREE.OrbitControls(camera, renderer.domElement);

var light = new THREE.DirectionalLight(0xffffff, 0.6);
light.position.setScalar(10);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

var helper = new THREE.GridHelper(20, 20);
scene.add(helper);

var detail = 7
var profileShape1 = [];

for (var i = 0; i < detail + 1; i++) {

  profileShape1.push(0.5 * Math.cos(i / detail * Math.PI * 2), 0.5 * Math.sin(i / detail * Math.PI * 2));

}

var contour1 = [
  -3, 4,
  0, 4,
  4, 4,
  2, 1,
  4, -2,
  0, -3,
  -4, -3,
  -4, 0
];

var profileShape2 = [-1, 1, 1, 1, 1, -1, -1, -1];

var contour2 = [
  4, 0,
  4, 8,
  8, 8,
  12, 8,
  12, 2, // here only to show that angle of 180° vertikal works  
  12, 0,
];

var materials = [ // rainbow-colored

  new THREE.MeshPhongMaterial({ color: 0xfa0001, side: THREE.DoubleSide }),
  new THREE.MeshPhongMaterial({ color: 0xff7b00, side: THREE.DoubleSide }),
  new THREE.MeshPhongMaterial({ color: 0xf9f901, side: THREE.DoubleSide }),
  new THREE.MeshPhongMaterial({ color: 0x008601, side: THREE.DoubleSide }),
  new THREE.MeshPhongMaterial({ color: 0x01bbbb, side: THREE.DoubleSide }),
  new THREE.MeshPhongMaterial({ color: 0x250290, side: THREE.DoubleSide }),
  new THREE.MeshPhongMaterial({ color: 0xfc4ea5, side: THREE.DoubleSide }),
  new THREE.MeshPhongMaterial({ color: 0x83058a, side: THREE.DoubleSide }),
  new THREE.MeshPhongMaterial({ color: 0x83058a, side: THREE.DoubleSide })

]

var material = materials[2].clone();
material.wireframe = true;

//..................................................... contourClosed, openEnded, profileMaterial
var geometry1 = ProfiledContourMMgeometry(profileShape1, contour1, false, false, true);
var fullProfile1 = new THREE.Mesh(geometry1, materials);
fullProfile1.position.z = 6;
scene.add(fullProfile1);

var fullProfile12 = new THREE.Mesh(geometry1, material);
fullProfile12.position.z = -8;
scene.add(fullProfile12);

var geometry13 = ProfiledContourMMgeometry(profileShape1, contour1);
var fullProfile13 = new THREE.Mesh(geometry13, materials);
fullProfile13.position.x = -5;
scene.add(fullProfile13);

var geometry2 = ProfiledContourMMgeometry(profileShape2, contour2, false, true);
var fullProfile2 = new THREE.Mesh(geometry2, materials);
fullProfile2.scale.set(0.5, 0.5, 0.5);
scene.add(fullProfile2);

render();

function render() {

  requestAnimationFrame(render);
  renderer.render(scene, camera);

}

function ProfiledContourMMgeometry(profileShape, contour, contourClosed, openEnded, profileMaterial) {

  contourClosed = contourClosed !== undefined ? contourClosed : true;
  openEnded = openEnded !== undefined ? openEnded : false;
  openEnded = contourClosed === true ? false : openEnded;
  profileMaterial = profileMaterial !== undefined ? profileMaterial : false;

  if (contourClosed) contour.push(contour[0], contour[1]);

  var hs1 = contour.length / 2;
  var rs1 = profileShape.length / 2;
  var hs = hs1 - 1; // height segments 
  var rs = rs1 - 1; // radius segments

  var faceCount = hs * rs * 2 + (openEnded ? 0 : rs * 2);
  var posCount = hs1 * rs1 + (openEnded ? 0 : 2);

  var g = new THREE.BufferGeometry();
  g.indices = new Uint32Array(faceCount * 3);
  g.positions = new Float32Array(posCount * 3);

  g.setIndex(new THREE.BufferAttribute(g.indices, 1));
  g.addAttribute('position', new THREE.BufferAttribute(g.positions, 3));

  var a, b1, c1, b2, c2;
  var i1, i2;
  var xc0, yc0, xc1, yc1, xc2, yc2, xSh, xDiv;
  var dx0, dy0, dx2, dy2;
  var e0x, e0y, e0Length, e2x, e2y, e2Length, ex, ey, eLength;
  var phi, bend;
  var x, y, z;
  var vIdx, posIdx;
  var epsilon = 0.000001;
  var idx = 0;

  for (var i = 0; i < hs; i++) {

    if (profileMaterial) g.addGroup(idx, rs * 6, i); // MultiMaterial support

    i1 = i + 1;

    for (var j = 0; j < rs; j++) {

      // 2 faces / segment,  3 vertex indices
      a = rs1 * i + j;
      c1 = rs1 * i1 + j; // left 
      b1 = c1 + 1;
      //c2 = b1;         // right
      b2 = a + 1;

      g.indices[idx] = a; // left 
      g.indices[idx + 1] = b1;
      g.indices[idx + 2] = c1;

      g.indices[idx + 3] = a; // right 
      g.indices[idx + 4] = b2,
        g.indices[idx + 5] = b1; // = c2

      if (!profileMaterial) g.addGroup(idx, 6, j); // MultiMaterial support

      idx += 6;

    }

  }

  if (!openEnded) {

    g.addGroup(idx, rs * 3, rs); // MultiMaterial support

    a = hs1 * rs1;

    for (var j = 0; j < rs; j++) {

      g.indices[idx] = a;
      g.indices[idx + 1] = j + 1;
      g.indices[idx + 2] = j;

      idx += 3;

    }

    g.addGroup(idx, rs * 3, rs + 1); // MultiMaterial support

    a += 1;

    for (var j = rs1 + 1; j > 2; j--) {

      g.indices[idx] = a;
      g.indices[idx + 1] = a - j;
      g.indices[idx + 2] = a - j + 1;

      idx += 3;

    }

  }

  for (var i = 0; i < hs1; i++) {

    i2 = 2 * i;

    xc1 = contour[i2];
    yc1 = contour[i2 + 1];

    if (i === 0) {

      xc0 = contour[(hs - 1) * 2]; // penultimate point
      yc0 = contour[(hs - 1) * 2 + 1];

    } else {

      xc0 = contour[i2 - 2]; 	// previous point
      yc0 = contour[i2 - 1];

    }

    if (i === hs) {

      xc2 = contour[2];			// second point
      yc2 = contour[3];

    } else {

      xc2 = contour[i2 + 2]; 	// next point
      yc2 = contour[i2 + 3];

    }

    if (!contourClosed) {

      if (i === 0) {

        // direction
        dx2 = xc2 - xc1;
        dy2 = yc2 - yc1;

        // unit vector
        e2Length = Math.sqrt(dx2 * dx2 + dy2 * dy2);

        e2x = dx2 / e2Length;
        e2y = dy2 / e2Length;

        // orthogonal
        ex = e2y;
        ey = -e2x;

      }

      if (i === hs) {

        // direction

        dx0 = xc1 - xc0;
        dy0 = yc1 - yc0;

        // unit vector
        e0Length = Math.sqrt(dx0 * dx0 + dy0 * dy0);

        e0x = dx0 / e0Length;
        e0y = dy0 / e0Length;

        // orthogonal
        ex = e0y;
        ey = -e0x;

      }

      xDiv = 1;
      bend = 1;

    }

    if ((i > 0 && i < hs) || contourClosed) {

      // directions

      dx0 = xc0 - xc1;
      dy0 = yc0 - yc1;

      dx2 = xc2 - xc1;
      dy2 = yc2 - yc1;

      if (Math.abs((dy2 / dx2) - (dy0 / dx0)) < epsilon) { // prevent 0

        dy0 += epsilon;

      }

      if (Math.abs((dx2 / dy2) - (dx0 / dy0)) < epsilon) { // prevent 0

        dx0 += epsilon;

      }

      // unit vectors

      e0Length = Math.sqrt(dx0 * dx0 + dy0 * dy0);

      e0x = dx0 / e0Length;
      e0y = dy0 / e0Length;

      e2Length = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      e2x = dx2 / e2Length;
      e2y = dy2 / e2Length;

      // direction transformed 

      ex = e0x + e2x;
      ey = e0y + e2y;

      eLength = Math.sqrt(ex * ex + ey * ey);

      ex = ex / eLength;
      ey = ey / eLength;

      phi = Math.acos(e2x * e0x + e2y * e0y) / 2;

      bend = Math.sign(dx0 * dy2 - dy0 * dx2); // z cross -> curve bending

      xDiv = Math.sin(phi);

    }

    for (var j = 0; j < rs1; j++) {

      xSh = profileShape[j * 2];

      x = xc1 + xSh / xDiv * bend * ex;
      y = yc1 + xSh / xDiv * bend * ey;
      z = profileShape[j * 2 + 1];	 // ySh

      vIdx = rs1 * i + j;

      posIdx = vIdx * 3;

      g.positions[posIdx] = x;
      g.positions[posIdx + 1] = y;
      g.positions[posIdx + 2] = z;

    }

  }

  if (!openEnded) {

    g.positions[hs1 * rs1 * 3] = contour[0];
    g.positions[hs1 * rs1 * 3 + 1] = contour[1];
    g.positions[hs1 * rs1 * 3 + 2] = 0;

    g.positions[hs1 * rs1 * 3 + 3] = contour[hs * 2];
    g.positions[hs1 * rs1 * 3 + 4] = contour[hs * 2 + 1];
    g.positions[hs1 * rs1 * 3 + 5] = 0;

  }

  g.computeVertexNormals();

  return g;

}

