import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

export function createLabelRender() {
  const labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(labelRenderer.domElement);
  return labelRenderer;
}
export function createTip(camera) {
  const div = document.createElement('div');
  div.className = 'label';
  div.style.marginTop = '-1em';
  div.style.width = '100px';
  div.style.height = '100px';
  div.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  div.style.color = 'white';
  div.style.display = 'flex';
  div.style.alignItems = 'center';
  div.style.justifyContent = 'center';
  div.style.borderRadius = '50%';
  div.textContent = 'Your Text';
  const label = new CSS2DObject(div);
  label.position.set(0, 0, 0);

  return label;
}