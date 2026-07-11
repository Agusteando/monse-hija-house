import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import './style.css';
import { buildPlan } from './plan.js';
import { FirstPersonController } from './firstPerson.js';

const bootLoading = document.getElementById('loading');

function showBootFailure(message) {
  if (!bootLoading) return;
  bootLoading.classList.remove('is-hidden');
  bootLoading.classList.add('has-error');
  bootLoading.innerHTML = `<strong>No se pudo iniciar el modelo</strong><small>${message}</small>`;
}

window.addEventListener('error', (event) => {
  showBootFailure(event.error?.message || event.message || 'Error desconocido');
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason instanceof Error ? event.reason.message : String(event.reason);
  showBootFailure(reason);
});

function requiredElement(id) {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Falta el elemento requerido #${id} en index.html`);
  return element;
}

const viewport = requiredElement('viewport');
const loading = requiredElement('loading');
const labelsButton = requiredElement('labelsButton');
const wallsButton = requiredElement('wallsButton');
const roofButton = requiredElement('roofButton');
const orbitButton = requiredElement('orbitButton');
const walkButton = requiredElement('walkButton');
const exitWalkButton = requiredElement('exitWalkButton');
const exportButton = requiredElement('exportButton');
const fullscreenButton = requiredElement('fullscreenButton');
const themeSelect = requiredElement('themeSelect');
const toolbar = requiredElement('toolbar');
const mobileMenuButton = requiredElement('mobileMenuButton');
const mobileWalkQuickButton = requiredElement('mobileWalkQuickButton');
const mobileMenuClose = requiredElement('mobileMenuClose');
const mobileMenuScrim = requiredElement('mobileMenuScrim');
const walkHelp = requiredElement('walkHelp');
const crosshair = requiredElement('crosshair');
const interactionPrompt = requiredElement('interactionPrompt');
const mobileControls = requiredElement('mobileControls');
const joystick = requiredElement('joystick');
const joystickKnob = requiredElement('joystickKnob');
const lookPad = requiredElement('lookPad');
const mobileInteractButton = requiredElement('mobileInteractButton');
const mobileJumpButton = requiredElement('mobileJumpButton');
const mobileExitButton = requiredElement('mobileExitButton');
const ambientAudio = requiredElement('ambientAudio');

const touchDevice =
  window.matchMedia('(pointer: coarse)').matches ||
  navigator.maxTouchPoints > 0 ||
  'ontouchstart' in window;
document.body.classList.toggle('is-touch', touchDevice);

const ORBIT_FOV = 48;
const WALK_FOV = touchDevice ? 72 : 68;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xece6dc);
scene.fog = new THREE.FogExp2(0xece6dc, 0.017);

const camera = new THREE.PerspectiveCamera(ORBIT_FOV, 1, 0.03, 120);
camera.position.set(16.6, 16.2, 16.8);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, touchDevice ? 1.5 : 2));
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.domElement.tabIndex = 0;
renderer.domElement.setAttribute('aria-label', 'Vista 3D interactiva');
viewport.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(viewport.clientWidth, viewport.clientHeight);
labelRenderer.domElement.style.position = 'absolute';
labelRenderer.domElement.style.inset = '0';
labelRenderer.domElement.style.pointerEvents = 'none';
viewport.appendChild(labelRenderer.domElement);

const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.dampingFactor = 0.065;
orbitControls.minDistance = 6.5;
orbitControls.maxDistance = 34;
orbitControls.minPolarAngle = THREE.MathUtils.degToRad(28);
orbitControls.maxPolarAngle = THREE.MathUtils.degToRad(77);
orbitControls.target.set(6.1, 0.35, 5.2);
orbitControls.touches.ONE = THREE.TOUCH.ROTATE;
orbitControls.touches.TWO = THREE.TOUCH.DOLLY_PAN;
orbitControls.update();

const hemisphere = new THREE.HemisphereLight(0xfffaf0, 0x6d665f, 2.25);
scene.add(hemisphere);

const sun = new THREE.DirectionalLight(0xfff5e4, 3.15);
sun.position.set(-8, 18, -6);
sun.castShadow = true;
sun.shadow.mapSize.set(touchDevice ? 1024 : 2048, touchDevice ? 1024 : 2048);
sun.shadow.camera.left = -17;
sun.shadow.camera.right = 17;
sun.shadow.camera.top = 18;
sun.shadow.camera.bottom = -18;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 55;
sun.shadow.bias = -0.00035;
scene.add(sun);

const fill = new THREE.DirectionalLight(0xcdd8d3, 1.08);
fill.position.set(14, 9, 17);
scene.add(fill);

const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xd9d0c3, roughness: 1 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.set(6.1, -0.27, 5.2);
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(70, 70, 0xb8ada0, 0xcfc5b8);
grid.position.set(6.1, -0.255, 5.2);
grid.material.opacity = 0.16;
grid.material.transparent = true;
scene.add(grid);

const plan = buildPlan(scene);
Object.entries(plan.themes).forEach(([value, theme]) => {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = theme.label;
  themeSelect.append(option);
});
themeSelect.value = 'arena';

function setEnvironment(theme) {
  scene.background = new THREE.Color(theme.sceneBackground);
  scene.fog.color = new THREE.Color(theme.sceneFog);
  groundMaterial.color.set(theme.ground);
  grid.material.color.set(theme.grid);
  grid.material.vertexColors = false;
  sun.color.set(0xfff5e4);
}

setEnvironment(plan.applyTheme('arena'));

let mode = 'orbit';
let mobileHelpTimeout = 0;
const orbitPose = {
  position: camera.position.clone(),
  target: orbitControls.target.clone(),
};

const firstPerson = new FirstPersonController({
  camera,
  domElement: renderer.domElement,
  colliders: plan.colliders,
  bounds: plan.bounds,
  startPosition: plan.entrance,
  getGroundHeight: plan.getGroundHeight,
  pointerLockEnabled: !touchDevice,
  onLockChange(locked) {
    if (!touchDevice) crosshair.classList.toggle('is-visible', locked && mode === 'walk');
  },
  onInteract() {
    plan.interactNearest(camera);
  },
});

function setButtonState(button, active) {
  button.classList.toggle('is-active', active);
  button.setAttribute('aria-pressed', String(active));
}

function closeMobileMenu() {
  toolbar.classList.remove('is-open');
  mobileMenuScrim.classList.remove('is-visible');
  mobileMenuScrim.setAttribute('aria-hidden', 'true');
  mobileMenuButton.setAttribute('aria-expanded', 'false');
}

function openMobileMenu() {
  toolbar.classList.add('is-open');
  mobileMenuScrim.classList.add('is-visible');
  mobileMenuScrim.setAttribute('aria-hidden', 'false');
  mobileMenuButton.setAttribute('aria-expanded', 'true');
}

function resetMobileInput() {
  firstPerson.clearMoveInput();
  joystickKnob.style.transform = 'translate3d(0, 0, 0)';
  joystick.classList.remove('is-active');
  lookPad.classList.remove('is-active');
}

function setMode(nextMode) {
  if (nextMode === mode) return;
  mode = nextMode;
  clearTimeout(mobileHelpTimeout);

  if (mode === 'walk') {
    camera.fov = WALK_FOV;
    camera.updateProjectionMatrix();
    plan.wallGroup.visible = true;
    plan.roofGroup.visible = false;
    setButtonState(wallsButton, true);
    setButtonState(roofButton, false);
    orbitPose.position.copy(camera.position);
    orbitPose.target.copy(orbitControls.target);
    orbitControls.enabled = false;
    setButtonState(orbitButton, false);
    closeMobileMenu();
    document.body.classList.add('walking');
    mobileControls.setAttribute('aria-hidden', touchDevice ? 'false' : 'true');
    walkHelp.classList.add('is-visible');
    if (touchDevice) {
      crosshair.classList.add('is-visible');
      mobileHelpTimeout = window.setTimeout(() => {
        walkHelp.classList.remove('is-visible');
      }, 4300);
    }
    firstPerson.start();
  } else {
    firstPerson.stop();
    resetMobileInput();
    camera.fov = ORBIT_FOV;
    camera.updateProjectionMatrix();
    camera.position.copy(orbitPose.position);
    orbitControls.target.copy(orbitPose.target);
    camera.rotation.set(0, 0, 0);
    orbitControls.enabled = true;
    orbitControls.update();
    setButtonState(orbitButton, true);
    document.body.classList.remove('walking');
    mobileControls.setAttribute('aria-hidden', 'true');
    walkHelp.classList.remove('is-visible');
    crosshair.classList.remove('is-visible');
  }
}

labelsButton.addEventListener('click', () => {
  plan.labelsGroup.visible = !plan.labelsGroup.visible;
  setButtonState(labelsButton, plan.labelsGroup.visible);
  if (touchDevice) closeMobileMenu();
});

wallsButton.addEventListener('click', () => {
  plan.wallGroup.visible = !plan.wallGroup.visible;
  setButtonState(wallsButton, plan.wallGroup.visible);
  if (touchDevice) closeMobileMenu();
});

roofButton.addEventListener('click', () => {
  plan.roofGroup.visible = !plan.roofGroup.visible;
  setButtonState(roofButton, plan.roofGroup.visible);
  if (touchDevice) closeMobileMenu();
});

orbitButton.addEventListener('click', () => {
  setMode('orbit');
  if (touchDevice) closeMobileMenu();
});
walkButton.addEventListener('click', () => setMode('walk'));
mobileWalkQuickButton.addEventListener('click', () => setMode('walk'));
exitWalkButton.addEventListener('click', () => setMode('orbit'));
mobileExitButton.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'mouse') return;
  event.preventDefault();
  setMode('orbit');
});
mobileExitButton.addEventListener('click', () => setMode('orbit'));

themeSelect.addEventListener('change', () => {
  const theme = plan.applyTheme(themeSelect.value);
  setEnvironment(theme);
  if (touchDevice) closeMobileMenu();
});

mobileMenuButton.addEventListener('click', () => {
  if (toolbar.classList.contains('is-open')) {
    closeMobileMenu();
  } else {
    openMobileMenu();
  }
});

mobileMenuClose.addEventListener('click', closeMobileMenu);
mobileMenuScrim.addEventListener('click', closeMobileMenu);

document.addEventListener('pointerdown', (event) => {
  if (!toolbar.classList.contains('is-open')) return;
  if (!event.target.closest('.topbar')) closeMobileMenu();
});

async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' });
    } else {
      await document.exitFullscreen?.();
    }
  } catch {
    // Some mobile browsers intentionally do not expose document fullscreen.
  }
}

fullscreenButton.addEventListener('click', async () => {
  await toggleFullscreen();
  closeMobileMenu();
});

document.addEventListener('fullscreenchange', () => {
  fullscreenButton.textContent = document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa';
});

function downloadBlob(name, blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function sanitizeExportName(value, fallback) {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function createRobloxExportRoot(sourceRoot) {
  const exportRoot = sourceRoot.clone(true);
  exportRoot.name = 'casa-patio';

  // CSS room labels are interface elements, not 3D geometry.
  exportRoot.getObjectByName('labels')?.removeFromParent();

  // Export the complete building even when roof/walls are hidden in the viewer.
  exportRoot.traverse((object) => {
    object.visible = true;
  });

  let meshIndex = 0;
  const usedNames = new Set();
  exportRoot.traverse((object) => {
    if (!object.isMesh) return;

    meshIndex += 1;
    let category = 'building';
    let parent = object.parent;
    while (parent && parent !== exportRoot) {
      if (['walls', 'furniture', 'roof'].includes(parent.name)) {
        category = parent.name;
        break;
      }
      if (parent.name.startsWith('door-')) {
        category = parent.name;
        break;
      }
      parent = parent.parent;
    }

    const baseName = sanitizeExportName(object.name, 'mesh');
    const categoryName = sanitizeExportName(category, 'building');
    let candidate = `${categoryName}_${baseName}_${String(meshIndex).padStart(3, '0')}`;
    let suffix = 2;
    while (usedNames.has(candidate)) {
      candidate = `${categoryName}_${baseName}_${String(meshIndex).padStart(3, '0')}_${suffix}`;
      suffix += 1;
    }
    usedNames.add(candidate);
    object.name = candidate;
  });

  exportRoot.updateMatrixWorld(true);
  return exportRoot;
}

exportButton.addEventListener('click', async () => {
  const originalLabel = exportButton.textContent;
  exportButton.disabled = true;
  exportButton.textContent = 'Preparando GLB…';
  try {
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    const exporter = new GLTFExporter();
    const exportRoot = createRobloxExportRoot(plan.root);
    const glb = await exporter.parseAsync(exportRoot, {
      binary: true,
      onlyVisible: false,
      maxTextureSize: 2048,
    });
    downloadBlob('casa-patio-roblox.glb', new Blob([glb], { type: 'model/gltf-binary' }));
  } catch (error) {
    console.error('No se pudo exportar el GLB para Roblox.', error);
    window.alert(`No se pudo exportar el GLB: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    exportButton.disabled = false;
    exportButton.textContent = originalLabel;
    closeMobileMenu();
  }
});

window.addEventListener('keydown', (event) => {
  if (event.code !== 'Escape') return;
  if (toolbar.classList.contains('is-open')) {
    closeMobileMenu();
    return;
  }
  if (mode === 'walk') setMode('orbit');
});

ambientAudio.loop = true;
ambientAudio.preload = 'auto';
ambientAudio.volume = 0.55;
ambientAudio.muted = false;
ambientAudio.setAttribute('playsinline', '');
ambientAudio.setAttribute('webkit-playsinline', '');

let audioUnlocked = false;
let lastAudioWarning = '';

function reportAudioFailure(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message === lastAudioWarning) return;
  lastAudioWarning = message;
  console.warn(
    'No se pudo iniciar la música. Comprueba que public/audio/song.mp3 exista y que el archivo sea un MP3 válido.',
    error,
  );
}

function tryStartAudio() {
  if (!ambientAudio.paused && !ambientAudio.ended) {
    audioUnlocked = true;
    return;
  }

  ambientAudio.muted = false;
  ambientAudio.volume = 0.55;

  // Mobile Safari must receive play() directly inside a user-activation event.
  // Keeping these listeners active also lets the track resume after an interruption.
  if (ambientAudio.readyState === HTMLMediaElement.HAVE_NOTHING) {
    ambientAudio.load();
  }

  const playback = ambientAudio.play();
  if (!playback || typeof playback.then !== 'function') {
    audioUnlocked = true;
    return;
  }

  playback
    .then(() => {
      audioUnlocked = true;
      lastAudioWarning = '';
    })
    .catch(reportAudioFailure);
}

// iOS versions differ on which gesture phase grants media activation, so cover both phases.
ambientAudio.load();
document.addEventListener('touchstart', tryStartAudio, { capture: true, passive: true });
document.addEventListener('touchend', tryStartAudio, { capture: true, passive: true });
document.addEventListener('pointerdown', tryStartAudio, { capture: true, passive: true });
document.addEventListener('pointerup', tryStartAudio, { capture: true, passive: true });
document.addEventListener('click', tryStartAudio, { capture: true, passive: true });
document.addEventListener('keydown', tryStartAudio, { capture: true });

ambientAudio.addEventListener('error', () => {
  const mediaError = ambientAudio.error;
  reportAudioFailure(
    new Error(
      mediaError
        ? `Error de audio ${mediaError.code}`
        : 'No se encontró una fuente de audio compatible.',
    ),
  );
});

function resumeUnlockedAudio() {
  if (!audioUnlocked || document.visibilityState === 'hidden' || !ambientAudio.paused) return;
  ambientAudio.play().catch(reportAudioFailure);
}

document.addEventListener('visibilitychange', resumeUnlockedAudio);
window.addEventListener('pageshow', resumeUnlockedAudio);

function bindInstantTouchAction(button, action) {
  button.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') return;
    event.preventDefault();
    action();
    button.classList.add('is-pressed');
    button.setPointerCapture?.(event.pointerId);
  });
  const release = () => button.classList.remove('is-pressed');
  button.addEventListener('pointerup', release);
  button.addEventListener('pointercancel', release);
  button.addEventListener('click', (event) => {
    if (event.detail === 0 || event.pointerType === 'mouse') action();
  });
}

bindInstantTouchAction(mobileJumpButton, () => firstPerson.jump());
bindInstantTouchAction(mobileInteractButton, () => firstPerson.interact());

let joystickPointerId = null;
function updateJoystick(event) {
  const ring = joystick.querySelector('.joystick-ring');
  const rect = ring.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  const maxRadius = rect.width * 0.31;
  let dx = event.clientX - centerX;
  let dy = event.clientY - centerY;
  const distance = Math.hypot(dx, dy);
  if (distance > maxRadius) {
    dx = (dx / distance) * maxRadius;
    dy = (dy / distance) * maxRadius;
  }
  joystickKnob.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  firstPerson.setMoveInput(dx / maxRadius, -dy / maxRadius);
}

joystick.addEventListener('pointerdown', (event) => {
  if (mode !== 'walk' || joystickPointerId !== null) return;
  event.preventDefault();
  joystickPointerId = event.pointerId;
  joystick.setPointerCapture?.(event.pointerId);
  joystick.classList.add('is-active');
  updateJoystick(event);
});

joystick.addEventListener('pointermove', (event) => {
  if (event.pointerId !== joystickPointerId) return;
  event.preventDefault();
  updateJoystick(event);
});

function releaseJoystick(event) {
  if (event.pointerId !== joystickPointerId) return;
  joystickPointerId = null;
  firstPerson.clearMoveInput();
  joystickKnob.style.transform = 'translate3d(0, 0, 0)';
  joystick.classList.remove('is-active');
}

joystick.addEventListener('pointerup', releaseJoystick);
joystick.addEventListener('pointercancel', releaseJoystick);
joystick.addEventListener('lostpointercapture', releaseJoystick);

let lookPointerId = null;
let previousLookX = 0;
let previousLookY = 0;

lookPad.addEventListener('pointerdown', (event) => {
  if (mode !== 'walk' || lookPointerId !== null) return;
  event.preventDefault();
  lookPointerId = event.pointerId;
  previousLookX = event.clientX;
  previousLookY = event.clientY;
  lookPad.setPointerCapture?.(event.pointerId);
  lookPad.classList.add('is-active');
});

lookPad.addEventListener('pointermove', (event) => {
  if (event.pointerId !== lookPointerId) return;
  event.preventDefault();
  const deltaX = event.clientX - previousLookX;
  const deltaY = event.clientY - previousLookY;
  previousLookX = event.clientX;
  previousLookY = event.clientY;
  firstPerson.applyLookDelta(deltaX, deltaY, 0.0042);
});

function releaseLook(event) {
  if (event.pointerId !== lookPointerId) return;
  lookPointerId = null;
  lookPad.classList.remove('is-active');
}

lookPad.addEventListener('pointerup', releaseLook);
lookPad.addEventListener('pointercancel', releaseLook);
lookPad.addEventListener('lostpointercapture', releaseLook);

mobileControls.addEventListener('contextmenu', (event) => event.preventDefault());
document.addEventListener(
  'touchmove',
  (event) => {
    if (mode === 'walk') event.preventDefault();
  },
  { passive: false },
);

function resize() {
  const width = Math.max(1, viewport.clientWidth);
  const height = Math.max(1, viewport.clientHeight);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, touchDevice ? 1.5 : 2));
  renderer.setSize(width, height, false);
  labelRenderer.setSize(width, height);
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(viewport);
window.visualViewport?.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => window.setTimeout(resize, 120));
resize();

const clock = new THREE.Clock();
let elapsed = 0;

function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  elapsed += delta;

  plan.updateInteractables(delta);

  if (mode === 'walk') {
    firstPerson.update(delta);
    const candidate = plan.getNearestInteractable(camera);
    if (candidate) {
      const verb = candidate.interactable.isOpen ? 'Cerrar' : 'Abrir';
      interactionPrompt.textContent = touchDevice
        ? `Toca Usar · ${verb} ${candidate.interactable.label}`
        : `E · ${verb} ${candidate.interactable.label}`;
      interactionPrompt.classList.add('is-visible');
      mobileInteractButton.textContent = verb;
      mobileInteractButton.classList.remove('is-disabled');
      mobileInteractButton.setAttribute('aria-disabled', 'false');
    } else {
      interactionPrompt.classList.remove('is-visible');
      mobileInteractButton.textContent = 'Usar';
      mobileInteractButton.classList.add('is-disabled');
      mobileInteractButton.setAttribute('aria-disabled', 'true');
    }
  } else {
    interactionPrompt.classList.remove('is-visible');
    orbitControls.update();
  }

  const tree = plan.furnitureGroup.getObjectByName('patio-tree');
  if (tree) tree.rotation.y = Math.sin(elapsed * 0.35) * 0.012;

  renderer.render(scene, camera);
  if (plan.labelsGroup.visible && mode === 'orbit') {
    labelRenderer.domElement.style.visibility = 'visible';
    labelRenderer.render(scene, camera);
  } else {
    labelRenderer.domElement.style.visibility = 'hidden';
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(() => {
  loading.classList.add('is-hidden');
});
animate();
