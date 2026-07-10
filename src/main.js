import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import './style.css';
import { buildPlan } from './plan.js';
import { FirstPersonController } from './firstPerson.js';

const viewport = document.querySelector('#viewport');
const loading = document.querySelector('#loading');
const labelsButton = document.querySelector('#labelsButton');
const wallsButton = document.querySelector('#wallsButton');
const roofButton = document.querySelector('#roofButton');
const orbitButton = document.querySelector('#orbitButton');
const walkButton = document.querySelector('#walkButton');
const exitWalkButton = document.querySelector('#exitWalkButton');
const exportButton = document.querySelector('#exportButton');
const themeSelect = document.querySelector('#themeSelect');
const walkHelp = document.querySelector('#walkHelp');
const crosshair = document.querySelector('#crosshair');
const interactionPrompt = document.querySelector('#interactionPrompt');

const ORBIT_FOV = 48;
const WALK_FOV = 68;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xece6dc);
scene.fog = new THREE.FogExp2(0xece6dc, 0.017);

const camera = new THREE.PerspectiveCamera(ORBIT_FOV, 1, 0.03, 120);
camera.position.set(16.6, 16.2, 16.8);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(viewport.clientWidth, viewport.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.domElement.tabIndex = 0;
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
orbitControls.update();

const hemisphere = new THREE.HemisphereLight(0xfffaf0, 0x6d665f, 2.25);
scene.add(hemisphere);

const sun = new THREE.DirectionalLight(0xfff5e4, 3.15);
sun.position.set(-8, 18, -6);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
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
  onLockChange(locked) {
    crosshair.classList.toggle('is-visible', locked && mode === 'walk');
  },
  onInteract() {
    plan.interactNearest(camera);
  },
});

function setButtonState(button, active) {
  button.classList.toggle('is-active', active);
  button.setAttribute('aria-pressed', String(active));
}

function setMode(nextMode) {
  if (nextMode === mode) return;
  mode = nextMode;

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
    document.body.classList.add('walking');
    walkHelp.classList.add('is-visible');
    crosshair.classList.add('is-visible');
    firstPerson.start();
  } else {
    firstPerson.stop();
    camera.fov = ORBIT_FOV;
    camera.updateProjectionMatrix();
    camera.position.copy(orbitPose.position);
    orbitControls.target.copy(orbitPose.target);
    camera.rotation.set(0, 0, 0);
    orbitControls.enabled = true;
    orbitControls.update();
    setButtonState(orbitButton, true);
    document.body.classList.remove('walking');
    walkHelp.classList.remove('is-visible');
    crosshair.classList.remove('is-visible');
  }
}

labelsButton.addEventListener('click', () => {
  plan.labelsGroup.visible = !plan.labelsGroup.visible;
  setButtonState(labelsButton, plan.labelsGroup.visible);
});

wallsButton.addEventListener('click', () => {
  plan.wallGroup.visible = !plan.wallGroup.visible;
  setButtonState(wallsButton, plan.wallGroup.visible);
});

roofButton.addEventListener('click', () => {
  plan.roofGroup.visible = !plan.roofGroup.visible;
  setButtonState(roofButton, plan.roofGroup.visible);
});

orbitButton.addEventListener('click', () => setMode('orbit'));
walkButton.addEventListener('click', () => setMode('walk'));
exitWalkButton.addEventListener('click', () => setMode('orbit'));

themeSelect.addEventListener('change', () => {
  const theme = plan.applyTheme(themeSelect.value);
  setEnvironment(theme);
});

function downloadFile(name, contents, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

exportButton.addEventListener('click', () => {
  const exporter = new OBJExporter();
  const obj = exporter.parse(plan.root);
  downloadFile('casa-patio-roblox.obj', obj);
});

window.addEventListener('keydown', (event) => {
  if (event.code === 'Escape' && mode === 'walk') {
    setMode('orbit');
  }
});

const ambientAudio = new Audio('/audio/song.mp3');
ambientAudio.loop = true;
ambientAudio.preload = 'auto';
ambientAudio.volume = 0.55;
let attemptedAudio = false;

async function tryStartAudio() {
  if (attemptedAudio) return;
  attemptedAudio = true;
  try {
    await ambientAudio.play();
  } catch {
    // If the user has not placed the file yet or playback is blocked, keep the app silent.
  }
}

window.addEventListener('pointerdown', tryStartAudio, { once: true });
window.addEventListener('keydown', tryStartAudio, { once: true });

function resize() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
  labelRenderer.setSize(width, height);
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(viewport);
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
      interactionPrompt.textContent = candidate.interactable.isOpen
        ? `E · Cerrar ${candidate.interactable.label}`
        : `E · Abrir ${candidate.interactable.label}`;
      interactionPrompt.classList.add('is-visible');
    } else {
      interactionPrompt.classList.remove('is-visible');
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
