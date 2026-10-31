import * as THREE from './source/vendor/three.module.js';
import { createAthleteModel } from './source/athlete-model.mjs';
import { loadCapturedMotions, capturedDuration, sampleCapturedMotion } from './source/captured-motion.mjs';
import { rowingGrip } from './source/equipment-grip.mjs';
import { createWrappedHand, placeTennisHand } from './source/tennis-hand.mjs';
import context from '../render-context.js?v=preview-load-3';
import { warmupScene, settleFirstFrame, createFrameGate } from '../warmup-scene.js?v=gpu-gate-2';

const send = context.report;
try {
  await loadCapturedMotions(['rowing-full']);
  await context.waitUntilVisible();
  send({ event: 'progress', stage: 'prepare' });
  const duration = capturedDuration('rowing-full');
  const renderer = new THREE.WebGLRenderer({ canvas: context.canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 50);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x6f7d59, 2.5));
  const light = new THREE.DirectionalLight(0xffffff, 3);
  light.position.set(-3, 5, 4);
  scene.add(light);
  const turntable = new THREE.Group(); scene.add(turntable);
  const startingAngle = Math.PI / 4;
  turntable.rotation.y = startingAngle;
  const group = new THREE.Group(); turntable.add(group);
  const skin = new THREE.MeshStandardMaterial({ color: 0xae805f, roughness: .83 });
  const body = new THREE.MeshStandardMaterial({ color: 0x6c8058, roughness: .65 });
  const prop = new THREE.MeshStandardMaterial({ color: 0x9c8060, roughness: .8 });
  const athlete = createAthleteModel(THREE, { body, skin, gender: 'male' });
  athlete.setSport('rowing', 'rowing-full'); group.add(athlete.root);
  const anchors = { head: new THREE.Object3D(), pelvis: new THREE.Object3D(), feet: [new THREE.Object3D(), new THREE.Object3D()] };
  const coords = Array.from({ length: 12 }, () => new THREE.Vector3());
  const hands = [-1, 1].map(side => {
    const hand = createWrappedHand(THREE, skin, side, rowingGrip); group.add(hand.root); return hand;
  });
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16), new THREE.MeshStandardMaterial({ color: 0x9cb5ae, roughness: .8 }));
  hull.scale.set(1.05, .08, .21); hull.position.set(-.2, .08, 0); group.add(hull);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(.25, .055, .35), prop); group.add(seat);
  const rails = [-.12, .12].map(z => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(.78, .025, .025), prop); rail.position.set(.04, .3, z); group.add(rail); return rail;
  });
  const up = new THREE.Vector3(0, 1, 0);
  const shaftAxis = new THREE.Vector3();
  const sculls = [-1, 1].map(side => {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(.018, .018, 1, 12), prop);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(rowingGrip.radius, rowingGrip.radius, .15, 16), prop);
    const blade = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), new THREE.MeshStandardMaterial({ color: side < 0 ? 0xc2d8e1 : 0xe7d9b7, roughness: .6 }));
    blade.scale.set(.23, .055, .12);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.045, .012, 8, 16), prop);
    const support = new THREE.Mesh(new THREE.CylinderGeometry(.012, .012, 1, 10), prop);
    group.add(shaft, handle, blade, ring, support);
    return { shaft, handle, blade, ring, support, side };
  });
  function apply(time) {
    const sample = sampleCapturedMotion('rowing-full', time);
    coords.forEach((point, i) => point.fromArray(sample.coords[i]));
    anchors.head.position.fromArray(sample.headPosition);
    anchors.head.quaternion.fromArray(sample.headRotation);
    anchors.pelvis.quaternion.fromArray(sample.pelvisRotation);
    anchors.feet.forEach((foot, i) => foot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...sample.toePositions[i]).sub(coords[10 + i]).normalize()));
    athlete.update(coords, sample, anchors);
    seat.position.copy(coords[6]).add(coords[7]).multiplyScalar(.5); seat.position.y -= .075;
    rails.forEach(rail => { rail.position.y = seat.position.y - .045; });
    sculls.forEach((item, i) => {
      const attachment = sample.oars[i];
      const start = new THREE.Vector3(...attachment.start), end = new THREE.Vector3(...attachment.end);
      shaftAxis.fromArray(attachment.axis);
      item.shaft.position.copy(start).add(end).multiplyScalar(.5);
      item.shaft.scale.y = rowingGrip.oarLength;
      item.shaft.quaternion.setFromUnitVectors(up, shaftAxis);
      item.handle.position.fromArray(attachment.hand.center); item.handle.quaternion.copy(item.shaft.quaternion);
      item.blade.position.copy(end);
      item.ring.position.fromArray(attachment.pivot);
      const base = new THREE.Vector3(-.13, .1, item.side * .2), direction = item.ring.position.clone().sub(base);
      item.support.position.copy(base).add(item.ring.position).multiplyScalar(.5);
      item.support.scale.y = direction.length(); item.support.quaternion.setFromUnitVectors(up, direction.normalize());
      placeTennisHand(THREE, hands[i], attachment.hand);
    });
    return sample;
  }
  // Frame the athlete and boat, rather than the distant blade tips. The full
  // body stays visible through the turn while the oars may extend past the card.
  const framingPoints = [];
  for (let t = 0; t <= duration; t += .08) {
    const sample = sampleCapturedMotion('rowing-full', t);
    for (const point of [...sample.coords, sample.headPosition]) framingPoints.push(new THREE.Vector3(...point));
    framingPoints.push(new THREE.Vector3(...sample.headPosition).addScaledVector(up, .18));
  }
  for (const x of [-1.25, .85]) for (const z of [-.21, .21]) framingPoints.push(new THREE.Vector3(x, .08, z));
  const pivot = new THREE.Box3().setFromPoints(framingPoints).getCenter(new THREE.Vector3());
  group.position.copy(pivot).negate();
  const view = new THREE.Vector3(.24, .20, 1).normalize();
  camera.position.copy(view); camera.lookAt(0, 0, 0); camera.updateMatrixWorld();
  const inverseView = camera.quaternion.clone().invert();
  const projected = [];
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 16) {
    for (const point of framingPoints) projected.push(point.clone().sub(pivot).applyAxisAngle(up, angle).applyQuaternion(inverseView));
  }
  const viewBounds = new THREE.Box3().setFromPoints(projected);
  const viewCenter = viewBounds.getCenter(new THREE.Vector3());
  const center = viewCenter.clone().applyQuaternion(camera.quaternion);
  function resize() {
    renderer.setSize(context.width, context.height, false); camera.aspect = context.width / context.height;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    let distance = 1;
    for (const point of projected) {
      const p = point.clone().sub(viewCenter);
      distance = Math.max(distance, p.z + (Math.abs(p.x) + .08) / (tan * camera.aspect * .96), p.z + (Math.abs(p.y) + .08) / (tan * .96));
    }
    camera.position.copy(center).addScaledVector(view, distance); camera.lookAt(center); camera.updateProjectionMatrix();
  }
  context.resize = resize; resize();
  apply(0);
  send({ event: 'progress', stage: 'render' });
  await warmupScene(renderer, scene, camera, context);
  await context.waitUntilVisible();
  renderer.render(scene, camera);
  await settleFirstFrame(renderer);
  send({ event: 'ready' });
  const gate = createFrameGate(renderer);
  let previous, elapsed = 0;
  const animate = now => {
    if (context.hidden) return;
    if (previous !== undefined && now - previous < 1000 / (context.fps || 20) - .5) return;
    if (!gate.ready()) return;
    // Use real elapsed seconds: rendering at 30 fps must not slow the capture.
    if (previous !== undefined) elapsed += (now - previous) / 1000;
    previous = now;
    turntable.rotation.y = startingAngle + (elapsed % 60) / 60 * Math.PI * 2;
    apply(elapsed % duration); renderer.render(scene, camera); gate.submitted();
  };
  context.visibility = () => { previous = undefined; renderer.setAnimationLoop(context.hidden ? null : animate); };
  context.visibility();
} catch (error) { send({ event: 'error' }); console.warn('SportX rowing preview unavailable', error); }
