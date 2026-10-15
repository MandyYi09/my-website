import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { createSculpture, setReferenceTexture } from './sculpture.js';

// Use the project's own sculpture, materials and painted face.
try {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  document.body.append(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 80);
  const environment = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(environment, .04).texture;
  environment.dispose();
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#dce5c8', '#18251d', 1.4));
  for (const [color, intensity, position] of [
    ['#ffdea4', 3.3, [-5, 11, 7]],
    ['#a5d9d0', 1.05, [6, 6, 4]],
    ['#dcab66', 3.2, [2, 9, -5]]
  ]) {
    const light = new THREE.DirectionalLight(color, intensity);
    light.position.set(...position);
    scene.add(light);
  }
  const texture = await new THREE.TextureLoader().loadAsync('cloud-gate-concept.png');
  setReferenceTexture(texture);
  const { root, parts } = createSculpture();
  scene.add(root);
  new ResizeObserver(() => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.position.set(.8, 5.2, Math.max(17.8, 17 / camera.aspect));
    camera.lookAt(0, 4.45, 0);
    camera.updateProjectionMatrix();
  }).observe(document.body);
  let ready = false;
  let lastFrame = 0;
  renderer.setAnimationLoop(now => {
    if (document.hidden || now - lastFrame < 1000 / 24) return;
    lastFrame = now;
    const time = now / 1000;
    root.rotation.y = Math.sin(time * .22) * .35;
    parts.clouds.children.forEach((cloud, i) => { cloud.position.y = Math.sin(time * .35 + i * .9) * .055; });
    renderer.render(scene, camera);
    if (!ready) {
      ready = true;
      parent.postMessage({ type: 'portfolio-preview', event: 'ready' }, location.origin);
    }
  });
} catch (error) {
  // The gallery keeps its image if WebGL, the model or its CDN cannot load.
  console.warn('Sculpture preview unavailable', error);
}
