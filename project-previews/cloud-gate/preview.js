import * as THREE from '../sportx/source/vendor/three.module.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import context from '../render-context.js?v=preview-load-3';
import { warmupScene, settleFirstFrame, createFrameGate } from '../warmup-scene.js?v=gpu-gate-2';
const report = context.report;
// Use the project's own sculpture, materials and painted face.
try {
  await context.waitUntilVisible();
  const renderer = new THREE.WebGLRenderer({ canvas: context.canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
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
  // Geometry and procedural textures are generated once by the build tool,
  // never on the visitor's main thread. Decompression runs through a stream.
  const response = await fetch(new URL('sculpture-preview.glb.gz?v=20261030', import.meta.url));
  if (!response.ok) throw new Error('Sculpture asset unavailable: ' + response.status);
  const total = Number(response.headers.get('Content-Length')) || 0;
  let loaded = 0, lastReport = 0;
  report({ event: 'progress', stage: 'download', loaded, total });
  const download = response.body.pipeThrough(new TransformStream({
    transform(chunk, controller) {
      loaded += chunk.byteLength;
      const now = performance.now();
      if (now - lastReport > 100 || loaded === total) {
        report({ event: 'progress', stage: 'download', loaded, total });
        lastReport = now;
      }
      controller.enqueue(chunk);
    }
  }));
  const binary = await new Response(download.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  report({ event: 'progress', stage: 'prepare' });
  const model = await new GLTFLoader().parseAsync(binary, new URL('./', import.meta.url).href);
  const root = model.scene;
  const cloudTime = { value: 0 };
  root.traverse(object => {
    if (object.userData.animatedClouds) {
      // One draw per cloud material, with the original independent floating phases.
      if (!object.geometry.hasAttribute('_cloudphase')) throw new Error('Missing cloud animation phases');
      object.material.onBeforeCompile = shader => {
        shader.uniforms.cloudTime = cloudTime;
        shader.vertexShader = 'attribute float _cloudphase;\nuniform float cloudTime;\n' + shader.vertexShader;
        shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
          '#include <begin_vertex>\ntransformed.y += sin(cloudTime * .35 + _cloudphase) * .055;');
      };
      object.material.customProgramCacheKey = () => 'floating-clouds-v1';
      object.geometry.computeBoundingSphere();
      object.geometry.boundingSphere.radius += .055;
    }
    if (object.isMesh) object.matrixAutoUpdate = false;
  });
  scene.add(root);
  context.resize = () => {
    renderer.setSize(context.width, context.height, false);
    camera.aspect = context.width / context.height;
    camera.position.set(.8, 5.2, Math.max(17.8, 17 / camera.aspect));
    camera.lookAt(0, 4.45, 0);
    camera.updateProjectionMatrix();
  };
  context.resize();
  report({ event: 'progress', stage: 'render' });
  await warmupScene(renderer, scene, camera, context);
  await context.waitUntilVisible();
  renderer.render(scene, camera);
  await settleFirstFrame(renderer);
  report({ event: 'ready' });
  const gate = createFrameGate(renderer);
  let lastFrame = 0;
  let elapsed = 0, previous;
  const animate = now => {
    if (context.hidden || now - lastFrame < 1000 / (context.fps || 20) - .5) return;
    if (!gate.ready()) return;
    lastFrame = now;
    if (previous !== undefined) elapsed += (now - previous) / 1000;
    previous = now;
    const time = elapsed;
    root.rotation.y = Math.sin(time * .22) * .35;
    cloudTime.value = time;
    renderer.render(scene, camera);
    gate.submitted();
  };
  context.visibility = () => { previous = undefined; lastFrame = 0; renderer.setAnimationLoop(context.hidden ? null : animate); };
  context.visibility();
} catch (error) {
  report({ event: 'error' });
  // The gallery keeps its image if WebGL, the model or its CDN cannot load.
  console.warn('Sculpture preview unavailable', error);
}
