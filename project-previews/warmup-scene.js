// Keep only one submitted animation frame per renderer. Workers must not keep
// filling the shared GPU queue when the GPU is slower than their animation clock.
export function createFrameGate(renderer) {
  const gl = renderer.getContext();
  let pending;
  return {
    ready() {
      if (gl.isContextLost()) return false;
      if (!pending) return true;
      const status = gl.clientWaitSync(pending, 0, 0);
      if (status === gl.TIMEOUT_EXPIRED) return false;
      gl.deleteSync(pending); pending = undefined;
      return status !== gl.WAIT_FAILED;
    },
    submitted() { pending = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush(); }
  };
}

// Prime GPU resources in small batches while the parent keeps the screenshot.
export async function warmupScene(renderer, scene, camera, context) {
  await context?.waitUntilVisible();
  await renderer.compileAsync(scene, camera);
  // A transparent loading iframe can suspend worker rAF until it is revealed.
  // Initialization must finish independently of that visibility decision.
  const nextFrame = () => new Promise(resolve => setTimeout(resolve, 16));
  const meshes = [];
  const textures = new Set();
  scene.traverseVisible(object => {
    if (!object.isMesh) return;
    meshes.push(object);
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
    }
  });
  for (const texture of textures) {
    await context?.waitUntilVisible();
    renderer.initTexture(texture);
    await nextFrame();
  }
  // Texture/shader preparation alone does not upload geometry buffers.
  for (const mesh of meshes) mesh.visible = false;
  try {
    for (let i = 0; i < meshes.length; i += 3) {
      await context?.waitUntilVisible();
      const batch = meshes.slice(i, i + 3);
      batch.forEach(mesh => { mesh.visible = true; });
      renderer.render(scene, camera);
      batch.forEach(mesh => { mesh.visible = false; });
      await nextFrame();
    }
  } finally {
    meshes.forEach(mesh => { mesh.visible = true; });
  }
}

// render() submits commands; it does not mean the first frame has finished on
// the GPU. Poll a fence without blocking either the worker or the browsing UI.
export function settleFirstFrame(renderer) {
  const gl = renderer.getContext();
  const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  if (!fence) return Promise.reject(new Error('Could not prepare preview frame'));
  gl.flush();
  return new Promise((resolve, reject) => {
    const started = performance.now();
    const check = () => {
      const state = gl.clientWaitSync(fence, 0, 0);
      if (state === gl.ALREADY_SIGNALED || state === gl.CONDITION_SATISFIED) {
        gl.deleteSync(fence); resolve();
      } else if (state === gl.WAIT_FAILED || gl.isContextLost() || performance.now() - started > 10000) {
        gl.deleteSync(fence); reject(new Error('Preview frame did not finish'));
      } else setTimeout(check, 16);
    };
    check();
  });
}
