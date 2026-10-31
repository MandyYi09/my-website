import * as THREE from '../sportx/source/vendor/three.module.js';
import context from '../render-context.js?v=align-local-1';
import { warmupScene, settleFirstFrame, createFrameGate } from '../warmup-scene.js?v=gpu-gate-2';
import { getReference, links } from './reference.mjs';

// Same four reference movements and proportions as Align Studio's embed mode.
// No practice UI, tracking model, camera or external CDN is loaded by this cover.
try {
  const sequence = ['reach', 'warrior', 'tree', 'side'];
  const targets = sequence.map(id => getReference(id));
  const coords = targets[0].map(point => new THREE.Vector3(...point));
  await context.waitUntilVisible();
  const renderer = new THREE.WebGLRenderer({ canvas: context.canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(1);
  const scene = new THREE.Scene(), group = new THREE.Group(); scene.add(group);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6f7d59, 2.5));
  const light = new THREE.DirectionalLight(0xffffff, 3); light.position.set(-3, 5, 4); scene.add(light);
  const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x6c8058, shininess: 24 });
  const jointMaterial = new THREE.MeshPhongMaterial({ color: 0xd8ecad, shininess: 28 });
  const headMaterial = new THREE.MeshPhongMaterial({ color: 0x869974, shininess: 28 });
  const joints = new THREE.InstancedMesh(new THREE.SphereGeometry(.075, 12, 8), jointMaterial, 12);
  const bones = new THREE.InstancedMesh(new THREE.CylinderGeometry(.058, .067, 1, 10), bodyMaterial, links.length);
  joints.instanceMatrix.setUsage(THREE.DynamicDrawUsage); bones.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  joints.frustumCulled = bones.frustumCulled = false;
  group.add(joints, bones);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.145, 16, 12), headMaterial); head.scale.y = 1.18;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(.055, .07, .18, 10), bodyMaterial);
  const torso = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), bodyMaterial); torso.scale.set(.22, .35, .12);
  group.add(head, neck, torso);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.4, 40), new THREE.MeshBasicMaterial({ color: 0xafbda1, transparent: true, opacity: .28 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = .02; scene.add(floor);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.18, 1.19, 48), new THREE.MeshBasicMaterial({ color: 0x96aa81, side: THREE.DoubleSide, transparent: true, opacity: .5 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .03; scene.add(ring);
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 100);
  context.resize = () => {
    renderer.setSize(context.width, context.height, false);
    camera.aspect = context.width / context.height;
    camera.position.set(0, 1.36, Math.max(5.6, 4.7 / camera.aspect));
    camera.lookAt(0, 1.36, 0); camera.updateProjectionMatrix();
  };
  context.resize();
  const item = new THREE.Object3D(), direction = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const shoulder = new THREE.Vector3(), hip = new THREE.Vector3(), axis = new THREE.Vector3();
  function applyPose(elapsed, dt) {
    const target = targets[Math.floor(elapsed / 3.2) % targets.length], alpha = 1 - Math.exp(-5 * dt);
    coords.forEach((point, index) => {
      point.x += (target[index][0] - point.x) * alpha;
      point.y += (target[index][1] - point.y) * alpha;
      point.z += (target[index][2] - point.z) * alpha;
      item.position.copy(point); item.quaternion.identity(); item.scale.set(1, 1, 1); item.updateMatrix(); joints.setMatrixAt(index, item.matrix);
    });
    links.forEach(([a, b], index) => {
      direction.subVectors(coords[b], coords[a]); const length = direction.length();
      item.position.copy(coords[a]).add(coords[b]).multiplyScalar(.5);
      item.scale.set(1, length, 1); item.quaternion.setFromUnitVectors(up, direction.normalize()); item.updateMatrix(); bones.setMatrixAt(index, item.matrix);
    });
    joints.instanceMatrix.needsUpdate = bones.instanceMatrix.needsUpdate = true;
    shoulder.copy(coords[0]).add(coords[1]).multiplyScalar(.5); hip.copy(coords[6]).add(coords[7]).multiplyScalar(.5);
    axis.copy(shoulder).sub(hip).normalize();
    head.position.copy(shoulder).addScaledVector(axis, .31); neck.position.copy(shoulder).addScaledVector(axis, .12);
    head.quaternion.setFromUnitVectors(up, axis); neck.quaternion.copy(head.quaternion);
    torso.position.copy(shoulder).add(hip).multiplyScalar(.5); torso.rotation.z = -Math.atan2(shoulder.x - hip.x, shoulder.y - hip.y);
  }
  applyPose(0, 0);
  await warmupScene(renderer, scene, camera, context); await context.waitUntilVisible();
  renderer.render(scene, camera); await settleFirstFrame(renderer); context.report({ event: 'ready' });
  const gate = createFrameGate(renderer);
  let previous, elapsed = 0;
  function animate(now) {
    if (context.hidden || (previous !== undefined && now - previous < 1000 / (context.fps || 20) - .5) || !gate.ready()) return;
    const dt = previous === undefined ? 0 : (now - previous) / 1000; previous = now; elapsed += dt;
    applyPose(elapsed, dt); renderer.render(scene, camera); gate.submitted();
  }
  context.visibility = () => { previous = undefined; renderer.setAnimationLoop(context.hidden ? null : animate); };
  context.visibility();
} catch (error) { context.report({ event: 'error' }); console.warn('Align Studio preview unavailable', error); }
