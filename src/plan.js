import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

const WALL_HEIGHT = 2.82;
const WALL_THICKNESS = 0.18;
const DOOR_HEIGHT = 2.14;

const PLAN_WIDTH = 12.2;
const PLAN_DEPTH = 10.4;

const THEME_PRESETS = {
  arena: {
    label: 'Arena + madera clara + blanco cálido',
    sceneBackground: 0xece6dc,
    sceneFog: 0xece6dc,
    ground: 0xd7cebf,
    grid: 0xc8bcaa,
    wall: '#f4efe6',
    trim: '#d5c7b5',
    mainFloor: '#decebc',
    wetFloor: '#dad0c3',
    patio: '#cab89f',
    wood: '#c6a175',
    darkWood: '#8a694b',
    upholstery: '#e8dfd2',
    fabric: '#d9cfc0',
    accentA: '#8d9987',
    accentB: '#c38467',
    metal: '#a9aea8',
    bronze: '#7b6650',
    planter: '#b57455',
    black: '#2d2926',
    rug: '#c3b29e',
    tileAccent: '#c9bca9',
    leaf: '#8d9b7c',
    roof: '#e8dfd2',
  },
  greige: {
    label: 'Greige + nogal claro + lino',
    sceneBackground: 0xe5dfd7,
    sceneFog: 0xe5dfd7,
    ground: 0xd1c8bf,
    grid: 0xbcae9f,
    wall: '#eee7e0',
    trim: '#cbc0b4',
    mainFloor: '#d5c6b7',
    wetFloor: '#d5cdc6',
    patio: '#bcab95',
    wood: '#b28a63',
    darkWood: '#765842',
    upholstery: '#ddd4c9',
    fabric: '#d0c4b7',
    accentA: '#8e8477',
    accentB: '#7f6451',
    metal: '#a1a39b',
    bronze: '#7f6144',
    planter: '#9b6847',
    black: '#2a2724',
    rug: '#b9ab9d',
    tileAccent: '#b8aa98',
    leaf: '#8a947e',
    roof: '#e1d7cb',
  },
  terracotta: {
    label: 'Blanco cálido + terracota suave + madera natural',
    sceneBackground: 0xeee5da,
    sceneFog: 0xeee5da,
    ground: 0xd8cdbf,
    grid: 0xc2b29e,
    wall: '#f5eee4',
    trim: '#dcc9b4',
    mainFloor: '#dfcfbe',
    wetFloor: '#dfd2c5',
    patio: '#ceb69a',
    wood: '#bf996e',
    darkWood: '#876346',
    upholstery: '#e7ddd0',
    fabric: '#dacbbc',
    accentA: '#c38b73',
    accentB: '#d2a07e',
    metal: '#a6a9a4',
    bronze: '#8d6347',
    planter: '#b86f52',
    black: '#312a25',
    rug: '#c7b19d',
    tileAccent: '#d3b99f',
    leaf: '#8f9a7d',
    roof: '#eadccf',
  },
  sage: {
    label: 'Beige + verde salvia + madera clara',
    sceneBackground: 0xe8e3d8,
    sceneFog: 0xe8e3d8,
    ground: 0xd4cbbd,
    grid: 0xb9ae9d,
    wall: '#f2ede4',
    trim: '#d6c8b8',
    mainFloor: '#ddcfbf',
    wetFloor: '#d7d1ca',
    patio: '#c1b59f',
    wood: '#c39b74',
    darkWood: '#84664b',
    upholstery: '#e4dccf',
    fabric: '#d7cdbf',
    accentA: '#98a790',
    accentB: '#b8aa92',
    metal: '#a2a7a1',
    bronze: '#75634e',
    planter: '#a97655',
    black: '#2d2a27',
    rug: '#bdb8a9',
    tileAccent: '#bec2af',
    leaf: '#879979',
    roof: '#e3dacd',
  },
  stone: {
    label: 'Marfil + piedra gris cálida + madera media',
    sceneBackground: 0xe4dfd9,
    sceneFog: 0xe4dfd9,
    ground: 0xcec5bc,
    grid: 0xb1a89e,
    wall: '#f1ece5',
    trim: '#cdc5bb',
    mainFloor: '#d9d0c6',
    wetFloor: '#cfcbc6',
    patio: '#b9b0a6',
    wood: '#aa8763',
    darkWood: '#695342',
    upholstery: '#dfdad2',
    fabric: '#cdc9c2',
    accentA: '#8d8882',
    accentB: '#6f6a65',
    metal: '#a8aaa8',
    bronze: '#6d5a49',
    planter: '#8c6b59',
    black: '#242321',
    rug: '#b6b1ab',
    tileAccent: '#b0aba3',
    leaf: '#7f8b79',
    roof: '#e1d7cc',
  },
  coffee: {
    label: 'Crema + café claro + acentos bronce',
    sceneBackground: 0xe9e0d4,
    sceneFog: 0xe9e0d4,
    ground: 0xd4c8b9,
    grid: 0xbba996,
    wall: '#f4ecdf',
    trim: '#d7c6b1',
    mainFloor: '#dec9b4',
    wetFloor: '#d8cdc0',
    patio: '#c4af96',
    wood: '#bf9468',
    darkWood: '#7d5c43',
    upholstery: '#e7ddd0',
    fabric: '#dbcdbd',
    accentA: '#b9916d',
    accentB: '#a97a55',
    metal: '#a6a39e',
    bronze: '#876648',
    planter: '#a56d4d',
    black: '#2d2621',
    rug: '#c5b09c',
    tileAccent: '#ccb097',
    leaf: '#869176',
    roof: '#e8dbc9',
  },
};

function hexToRgb(color) {
  const normalized = color.replace('#', '');
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

function shadeHex(color, amount) {
  const { r, g, b } = hexToRgb(color);
  const next = (channel) => Math.max(0, Math.min(255, Math.round(channel + amount * 255)));
  return `#${[next(r), next(g), next(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function setCanvasTexture(texture, repeatX, repeatY) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function createCanvas(size = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function createWoodTexture(base, light, dark) {
  const canvas = createCanvas(512);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y += 8) {
    const alpha = 0.07 + ((y / 8) % 5) * 0.01;
    ctx.fillStyle = `rgba(${hexToRgb(light).r}, ${hexToRgb(light).g}, ${hexToRgb(light).b}, ${alpha})`;
    ctx.fillRect(0, y, canvas.width, 3);
  }
  for (let i = 0; i < 2600; i += 1) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const length = 12 + Math.random() * 42;
    ctx.strokeStyle = Math.random() > 0.5 ? shadeHex(dark, -0.02) : shadeHex(light, 0.04);
    ctx.globalAlpha = 0.08 + Math.random() * 0.08;
    ctx.lineWidth = 1 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 10, y + 3, x + length * 0.6, y - 5, x + length, y + 1.5);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return setCanvasTexture(new THREE.CanvasTexture(canvas), 3, 3);
}

function createFabricTexture(base, accent) {
  const canvas = createCanvas(384);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = shadeHex(accent, 0.14);
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < canvas.width; i += 9) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, canvas.height);
    ctx.stroke();
  }
  for (let i = 0; i < canvas.height; i += 8) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(canvas.width, i);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 1800; i += 1) {
    ctx.fillStyle = Math.random() > 0.5 ? shadeHex(base, -0.08) : shadeHex(accent, 0.1);
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }
  ctx.globalAlpha = 1;
  return setCanvasTexture(new THREE.CanvasTexture(canvas), 2.5, 2.5);
}

function createStoneTexture(base, vein) {
  const canvas = createCanvas(512);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, shadeHex(base, 0.05));
  gradient.addColorStop(1, shadeHex(base, -0.04));
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 2100; i += 1) {
    ctx.fillStyle = Math.random() > 0.5 ? shadeHex(base, 0.08) : shadeHex(base, -0.08);
    ctx.globalAlpha = 0.05 + Math.random() * 0.05;
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 2, 2);
  }
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = vein;
  for (let i = 0; i < 36; i += 1) {
    ctx.lineWidth = 0.8 + Math.random() * 1.4;
    const startX = Math.random() * canvas.width;
    const startY = Math.random() * canvas.height;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(
      startX + 35,
      startY + (Math.random() - 0.5) * 60,
      startX + 110,
      startY + (Math.random() - 0.5) * 90,
      startX + 180,
      startY + (Math.random() - 0.5) * 130,
    );
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return setCanvasTexture(new THREE.CanvasTexture(canvas), 2.6, 2.6);
}

function createPlasterTexture(base) {
  const canvas = createCanvas(384);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 4200; i += 1) {
    const shade = Math.random() > 0.5 ? shadeHex(base, 0.06) : shadeHex(base, -0.06);
    ctx.fillStyle = shade;
    ctx.globalAlpha = 0.03 + Math.random() * 0.04;
    const size = 1 + Math.random() * 2;
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, size, size);
  }
  ctx.globalAlpha = 1;
  return setCanvasTexture(new THREE.CanvasTexture(canvas), 2, 2);
}

function createRugTexture(base, accent) {
  const canvas = createCanvas(384);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = shadeHex(accent, -0.03);
  ctx.globalAlpha = 0.12;
  for (let x = 0; x < canvas.width; x += 11) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 11) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.35;
  ctx.strokeStyle = shadeHex(accent, 0.09);
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);
  ctx.globalAlpha = 1;
  return setCanvasTexture(new THREE.CanvasTexture(canvas), 1.7, 1.7);
}

function createThemeTextures(theme) {
  return {
    wall: createPlasterTexture(theme.wall),
    mainFloor: createWoodTexture(theme.mainFloor, shadeHex(theme.mainFloor, 0.08), shadeHex(theme.mainFloor, -0.12)),
    wetFloor: createStoneTexture(theme.wetFloor, shadeHex(theme.tileAccent, 0.03)),
    patio: createStoneTexture(theme.patio, shadeHex(theme.tileAccent, -0.03)),
    wood: createWoodTexture(theme.wood, shadeHex(theme.wood, 0.12), shadeHex(theme.wood, -0.12)),
    darkWood: createWoodTexture(theme.darkWood, shadeHex(theme.darkWood, 0.08), shadeHex(theme.darkWood, -0.14)),
    upholstery: createFabricTexture(theme.upholstery, theme.fabric),
    accentA: createFabricTexture(theme.accentA, shadeHex(theme.accentA, 0.15)),
    accentB: createFabricTexture(theme.accentB, shadeHex(theme.accentB, 0.15)),
    rug: createRugTexture(theme.rug, theme.tileAccent),
  };
}

const textureCache = new Map();
function getTextures(themeName) {
  if (!textureCache.has(themeName)) {
    textureCache.set(themeName, createThemeTextures(THEME_PRESETS[themeName]));
  }
  return textureCache.get(themeName);
}

function material(color, roughness = 0.82, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

function createTVScreenTexture() {
  const canvas = createCanvas(768);
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, '#263840');
  gradient.addColorStop(0.5, '#6d8d88');
  gradient.addColorStop(1, '#d0a17d');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#ead6b9';
  ctx.beginPath();
  ctx.arc(585, 172, 92, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.92;
  ctx.fillStyle = '#304a47';
  ctx.beginPath();
  ctx.moveTo(0, 510);
  ctx.bezierCurveTo(120, 395, 255, 450, 365, 355);
  ctx.bezierCurveTo(470, 270, 620, 350, 768, 250);
  ctx.lineTo(768, 768);
  ctx.lineTo(0, 768);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#6e5846';
  ctx.beginPath();
  ctx.moveTo(0, 610);
  ctx.bezierCurveTo(145, 530, 300, 625, 445, 510);
  ctx.bezierCurveTo(565, 420, 665, 505, 768, 430);
  ctx.lineTo(768, 768);
  ctx.lineTo(0, 768);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.28;
  const sheen = ctx.createLinearGradient(0, 0, canvas.width, 0);
  sheen.addColorStop(0, 'rgba(255,255,255,0.02)');
  sheen.addColorStop(0.42, 'rgba(255,255,255,0.38)');
  sheen.addColorStop(0.58, 'rgba(255,255,255,0.05)');
  sheen.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

const tvScreenTexture = createTVScreenTexture();

const mats = {
  wall: material(0xf4efe6, 0.95),
  wallCap: material(0xd5c7b5, 0.88),
  mainFloor: material(0xdecebc, 0.86),
  wetFloor: material(0xdad0c3, 0.8),
  patio: material(0xcab89f, 0.98),
  wood: material(0xc6a175, 0.7),
  darkWood: material(0x8a694b, 0.72),
  upholstery: material(0xe8dfd2, 0.94),
  accentA: material(0x8d9987, 0.92),
  accentB: material(0xc38467, 0.92),
  metal: material(0xa9aea8, 0.38, 0.58),
  bronze: material(0x7b6650, 0.38, 0.52),
  porcelain: material(0xf7f2ea, 0.36),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xaec4c5,
    roughness: 0.12,
    transmission: 0.5,
    transparent: true,
    opacity: 0.42,
  }),
  darkGlass: new THREE.MeshPhysicalMaterial({
    color: 0x596564,
    roughness: 0.18,
    transparent: true,
    opacity: 0.75,
  }),
  tvScreen: new THREE.MeshStandardMaterial({
    map: tvScreenTexture,
    emissive: 0x58706d,
    emissiveMap: tvScreenTexture,
    emissiveIntensity: 0.42,
    roughness: 0.2,
    metalness: 0.04,
  }),
  appliance: material(0xdedcd7, 0.36, 0.24),
  black: material(0x2d2926, 0.62),
  rug: material(0xc3b29e, 0.96),
  leaf: material(0x8d9b7c, 0.88),
  planter: material(0xb57455, 0.84),
  foodRed: material(0xb94b3f, 0.78),
  foodGreen: material(0x6f8f58, 0.8),
  foodOrange: material(0xd58a42, 0.78),
  foodYellow: material(0xe6c86c, 0.76),
  carton: material(0xf0eadf, 0.82),
  bottleGlass: new THREE.MeshPhysicalMaterial({
    color: 0x8fb8a8,
    roughness: 0.18,
    transmission: 0.42,
    transparent: true,
    opacity: 0.62,
  }),
  fridgeInterior: material(0xf5f3ee, 0.58),
  roof: new THREE.MeshStandardMaterial({
    color: 0xe8dfd2,
    roughness: 0.92,
    transparent: true,
    opacity: 0.94,
    side: THREE.DoubleSide,
  }),
};

Object.entries(mats).forEach(([name, mat]) => {
  mat.name = name;
});

function applyThemeToMaterials(themeName = 'arena') {
  const theme = THEME_PRESETS[themeName] ?? THEME_PRESETS.arena;
  const textures = getTextures(themeName);

  mats.wall.color.set(theme.wall);
  mats.wall.roughness = 0.95;
  mats.wall.map = textures.wall;

  mats.wallCap.color.set(theme.trim);
  mats.wallCap.map = null;

  mats.mainFloor.color.set(theme.mainFloor);
  mats.mainFloor.map = textures.mainFloor;

  mats.wetFloor.color.set(theme.wetFloor);
  mats.wetFloor.map = textures.wetFloor;

  mats.patio.color.set(theme.patio);
  mats.patio.map = textures.patio;

  mats.wood.color.set(theme.wood);
  mats.wood.map = textures.wood;
  mats.wood.roughness = 0.7;

  mats.darkWood.color.set(theme.darkWood);
  mats.darkWood.map = textures.darkWood;
  mats.darkWood.roughness = 0.72;

  mats.upholstery.color.set(theme.upholstery);
  mats.upholstery.map = textures.upholstery;
  mats.upholstery.roughness = 0.96;

  mats.accentA.color.set(theme.accentA);
  mats.accentA.map = textures.accentA;
  mats.accentA.roughness = 0.94;

  mats.accentB.color.set(theme.accentB);
  mats.accentB.map = textures.accentB;
  mats.accentB.roughness = 0.94;

  mats.metal.color.set(theme.metal);
  mats.bronze.color.set(theme.bronze);
  mats.black.color.set(theme.black);

  mats.rug.color.set(theme.rug);
  mats.rug.map = textures.rug;

  mats.leaf.color.set(theme.leaf);
  mats.planter.color.set(theme.planter);

  mats.roof.color.set(theme.roof);

  Object.values(mats).forEach((mat) => {
    mat.needsUpdate = true;
  });

  document.documentElement.style.setProperty('--accent-ui', theme.wood);
  document.documentElement.style.setProperty('--accent-ui-dark', theme.darkWood);
  document.documentElement.style.setProperty('--theme-bg-soft', theme.wall);
  document.documentElement.style.setProperty('--theme-chip', shadeHex(theme.trim, 0.02));
  document.documentElement.style.setProperty('--theme-text', theme.black);

  return theme;
}

function meshBox(width, height, depth, mat, x, y, z, name = '') {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.name = name;
  return mesh;
}

function meshRoundedBox(width, height, depth, radius, mat, x, y, z) {
  const shape = new THREE.Shape();
  const hw = width / 2;
  const hd = depth / 2;
  shape.moveTo(-hw + radius, -hd);
  shape.lineTo(hw - radius, -hd);
  shape.absarc(hw - radius, -hd + radius, radius, -Math.PI / 2, 0);
  shape.lineTo(hw, hd - radius);
  shape.absarc(hw - radius, hd - radius, radius, 0, Math.PI / 2);
  shape.lineTo(-hw + radius, hd);
  shape.absarc(-hw + radius, hd - radius, radius, Math.PI / 2, Math.PI);
  shape.lineTo(-hw, -hd + radius);
  shape.absarc(-hw + radius, -hd + radius, radius, Math.PI, Math.PI * 1.5);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    bevelEnabled: false,
    curveSegments: 12,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, height / 2, 0);
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}


const LAYOUT = {
  stairLeft: 4.3,
  stairRight: 7.08,
  corridorRight: 8.33,
  stairTop: 4.72,
  patioTop: 8.33,
  bedroom1Bottom: 2.92,
  bathroom1Bottom: 4.86,
  bathroom2Bottom: 6.81,
};

function addCollider(colliders, x, z, width, depth, minY = 0, maxY = WALL_HEIGHT) {
  const collider = {
    minX: x - width / 2,
    maxX: x + width / 2,
    minZ: z - depth / 2,
    maxZ: z + depth / 2,
    minY,
    maxY,
  };
  colliders.push(collider);
  return collider;
}

function addRotatedCollider(colliders, x, z, width, depth, rotation = 0, minY = 0, maxY = 1.2) {
  const quarterTurn = Math.abs(Math.sin(rotation)) > 0.7;
  return addCollider(
    colliders,
    x,
    z,
    quarterTurn ? depth : width,
    quarterTurn ? width : depth,
    minY,
    maxY,
  );
}

function addWallSegment(group, colliders, x, z, width, depth, height = WALL_HEIGHT) {
  group.add(meshBox(width, height, depth, mats.wall, x, height / 2, z, 'wall'));
  group.add(meshBox(width + 0.01, 0.035, depth + 0.01, mats.wallCap, x, height + 0.017, z));
  addCollider(colliders, x, z, width, depth, 0, height);
}

function addHorizontalWallWithDoor(group, colliders, x1, x2, z, doorX1, doorX2) {
  const leftWidth = Math.max(0, doorX1 - x1);
  const rightWidth = Math.max(0, x2 - doorX2);
  if (leftWidth > 0.01) addWallSegment(group, colliders, x1 + leftWidth / 2, z, leftWidth, WALL_THICKNESS);
  if (rightWidth > 0.01) addWallSegment(group, colliders, doorX2 + rightWidth / 2, z, rightWidth, WALL_THICKNESS);
  const headerWidth = doorX2 - doorX1;
  const headerHeight = WALL_HEIGHT - DOOR_HEIGHT;
  if (headerWidth > 0 && headerHeight > 0) {
    group.add(meshBox(headerWidth, headerHeight, WALL_THICKNESS, mats.wall, (doorX1 + doorX2) / 2, DOOR_HEIGHT + headerHeight / 2, z, 'wall'));
  }
}

function addVerticalWallWithDoor(group, colliders, x, z1, z2, doorZ1, doorZ2) {
  const northDepth = Math.max(0, doorZ1 - z1);
  const southDepth = Math.max(0, z2 - doorZ2);
  if (northDepth > 0.01) addWallSegment(group, colliders, x, z1 + northDepth / 2, WALL_THICKNESS, northDepth);
  if (southDepth > 0.01) addWallSegment(group, colliders, x, doorZ2 + southDepth / 2, WALL_THICKNESS, southDepth);
  const headerDepth = doorZ2 - doorZ1;
  const headerHeight = WALL_HEIGHT - DOOR_HEIGHT;
  if (headerDepth > 0 && headerHeight > 0) {
    group.add(meshBox(WALL_THICKNESS, headerHeight, headerDepth, mats.wall, x, DOOR_HEIGHT + headerHeight / 2, (doorZ1 + doorZ2) / 2, 'wall'));
  }
}

function updateDoorCollider(door) {
  const angle = door.pivot.rotation.y;
  const centerX = door.hingeX + Math.cos(angle) * (door.width / 2);
  const centerZ = door.hingeZ - Math.sin(angle) * (door.width / 2);
  const halfX = Math.abs(Math.cos(angle)) * (door.width / 2) + Math.abs(Math.sin(angle)) * (door.thickness / 2);
  const halfZ = Math.abs(Math.sin(angle)) * (door.width / 2) + Math.abs(Math.cos(angle)) * (door.thickness / 2);
  door.collider.minX = centerX - halfX;
  door.collider.maxX = centerX + halfX;
  door.collider.minZ = centerZ - halfZ;
  door.collider.maxZ = centerZ + halfZ;
}

function addDoor(group, colliders, doors, {
  id,
  label,
  hingeX,
  hingeZ,
  width,
  closedRotation,
  openAngle,
  openByDefault = false,
}) {
  const openRotation = closedRotation + openAngle;
  const pivot = new THREE.Group();
  pivot.name = `door-${id}`;
  pivot.position.set(hingeX, 0, hingeZ);
  pivot.userData.robloxDoor = {
    id,
    label,
    closedRotation,
    openRotation,
    openByDefault,
  };

  const thickness = 0.055;
  const slab = meshRoundedBox(width, 2.06, thickness, 0.018, mats.wood, width / 2, 1.03, 0);
  slab.name = 'door-leaf';
  pivot.add(slab);
  pivot.add(meshBox(0.025, 2.06, thickness + 0.008, mats.darkWood, width - 0.014, 1.03, 0));

  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.11, 12), mats.bronze);
  handle.rotation.x = Math.PI / 2;
  handle.position.set(width * 0.82, 1.02, thickness * 0.9);
  handle.castShadow = true;
  pivot.add(handle);
  group.add(pivot);

  const collider = {
    minX: 0,
    maxX: 0,
    minZ: 0,
    maxZ: 0,
    minY: 0,
    maxY: 2.12,
    isDoor: true,
  };
  colliders.push(collider);

  const door = {
    id,
    label,
    pivot,
    collider,
    hingeX,
    hingeZ,
    width,
    thickness,
    closedRotation,
    openRotation,
    targetRotation: openByDefault ? openRotation : closedRotation,
    isOpen: openByDefault,
    getInteractionPosition(target) {
      target.set(width * 0.5, 1.05, 0);
      pivot.localToWorld(target);
      return target;
    },
    toggle() {
      this.isOpen = !this.isOpen;
      this.targetRotation = this.isOpen ? this.openRotation : this.closedRotation;
    },
    update(delta) {
      pivot.rotation.y = THREE.MathUtils.damp(pivot.rotation.y, this.targetRotation, 11, delta);
      updateDoorCollider(this);
    },
  };
  pivot.rotation.y = door.targetRotation;
  updateDoorCollider(door);
  doors.push(door);
  return door;
}

function addFloorArea(group, x, z, width, depth, mat, y = 0.02) {
  const floor = meshBox(width, 0.08, depth, mat, x, y - 0.04, z, 'floor');
  floor.receiveShadow = true;
  group.add(floor);
}

function addRug(group, x, z, width, depth, rotation = 0) {
  const rug = meshRoundedBox(width, 0.022, depth, 0.055, mats.rug, x, 0.055, z);
  rug.rotation.y = rotation;
  group.add(rug);
}

function addCylinderLegs(group, positions, height = 0.7, radius = 0.035, mat = mats.darkWood) {
  positions.forEach(([x, y, z]) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, 12), mat);
    leg.position.set(x, y, z);
    leg.castShadow = true;
    leg.receiveShadow = true;
    group.add(leg);
  });
}

function addChair(
  group,
  x,
  z,
  rotation = 0,
  frameMat = mats.wood,
  seatMat = mats.upholstery,
  scale = 1,
  seatId = 'chair',
) {
  const chair = new THREE.Group();
  chair.name = `seat-${seatId}`;
  chair.position.set(x, 0, z);
  chair.rotation.y = rotation;
  chair.userData.robloxSeatHost = {
    id: seatId,
    label: 'Silla',
    seats: [
      {
        id: seatId,
        label: 'Silla',
        position: [0, 0.53, -0.01],
        size: [0.36 * scale, 0.08, 0.34 * scale],
      },
    ],
  };
  chair.add(meshRoundedBox(0.44 * scale, 0.065, 0.43 * scale, 0.045, frameMat, 0, 0.44, 0));
  chair.add(meshRoundedBox(0.39 * scale, 0.055, 0.37 * scale, 0.035, seatMat, 0, 0.5, 0.01));
  chair.add(meshRoundedBox(0.42 * scale, 0.47, 0.055, 0.025, seatMat, 0, 0.77, 0.17 * scale));
  addCylinderLegs(
    chair,
    [
      [-0.15 * scale, 0.22, -0.14 * scale],
      [0.15 * scale, 0.22, -0.14 * scale],
      [-0.15 * scale, 0.22, 0.14 * scale],
      [0.15 * scale, 0.22, 0.14 * scale],
    ],
    0.43,
    0.025,
    mats.darkWood,
  );
  group.add(chair);
}

function addDining(group, colliders) {
  const x = 1.48;
  const z = 1.62;
  const tableWidth = 1.12;
  const tableDepth = 1.42;

  group.add(meshRoundedBox(tableWidth, 0.075, tableDepth, 0.075, mats.wood, x, 0.75, z));
  addCylinderLegs(
    group,
    [
      [x - 0.39, 0.36, z - 0.53],
      [x + 0.39, 0.36, z - 0.53],
      [x - 0.39, 0.36, z + 0.53],
      [x + 0.39, 0.36, z + 0.53],
    ],
    0.72,
    0.035,
    mats.darkWood,
  );
  addCollider(colliders, x, z, tableWidth, tableDepth, 0, 0.9);

  addChair(group, x - 0.79, z - 0.39, -Math.PI / 2, mats.wood, mats.upholstery, 0.95, 'dining-01');
  addChair(group, x - 0.79, z + 0.39, -Math.PI / 2, mats.wood, mats.upholstery, 0.95, 'dining-02');
  addChair(group, x + 0.79, z - 0.39, Math.PI / 2, mats.wood, mats.upholstery, 0.95, 'dining-03');
  addChair(group, x + 0.79, z + 0.39, Math.PI / 2, mats.wood, mats.upholstery, 0.95, 'dining-04');
  addChair(group, x, z - 0.91, Math.PI, mats.wood, mats.upholstery, 0.95, 'dining-05');
  addChair(group, x, z + 0.91, 0, mats.wood, mats.upholstery, 0.95, 'dining-06');

  const pendant = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.25, 0.22, 24), mats.bronze);
  pendant.position.set(x, 2.17, z);
  pendant.castShadow = true;
  group.add(pendant);
  group.add(meshBox(0.014, 0.5, 0.014, mats.black, x, 2.5, z));
}

function addSofa(group, colliders) {
  const x = 4.65;
  const z = 1.26;
  const rotation = -Math.PI / 2;
  const sofa = new THREE.Group();
  sofa.name = 'seat-living-sofa';
  sofa.position.set(x, 0, z);
  sofa.rotation.y = rotation;
  sofa.userData.robloxSeatHost = {
    id: 'living-sofa',
    label: 'Sofá',
    seats: [
      {
        id: 'living-sofa-left',
        label: 'Sofá',
        position: [-0.46, 0.49, -0.04],
        size: [0.72, 0.1, 0.56],
      },
      {
        id: 'living-sofa-right',
        label: 'Sofá',
        position: [0.46, 0.49, -0.04],
        size: [0.72, 0.1, 0.56],
      },
    ],
  };
  sofa.add(meshRoundedBox(1.86, 0.27, 0.82, 0.075, mats.upholstery, 0, 0.27, 0));
  sofa.add(meshRoundedBox(1.82, 0.51, 0.13, 0.045, mats.upholstery, 0, 0.56, 0.31));
  sofa.add(meshRoundedBox(0.14, 0.43, 0.76, 0.04, mats.upholstery, -0.85, 0.43, 0));
  sofa.add(meshRoundedBox(0.14, 0.43, 0.76, 0.04, mats.upholstery, 0.85, 0.43, 0));
  sofa.add(meshRoundedBox(0.48, 0.1, 0.43, 0.035, mats.accentA, -0.4, 0.6, 0.01));
  sofa.add(meshRoundedBox(0.48, 0.1, 0.43, 0.035, mats.accentB, 0.38, 0.6, -0.01));
  group.add(sofa);
  addRotatedCollider(colliders, x, z, 1.88, 0.82, rotation, 0, 0.95);

  addRug(group, 5.55, 1.3, 1.38, 2.2);
  group.add(meshRoundedBox(0.7, 0.24, 0.42, 0.04, mats.darkWood, 5.58, 0.16, 1.3));
  addCollider(colliders, 5.58, 1.3, 0.7, 0.42, 0, 0.5);

  // Media console and a clearly visible 55-inch television mounted on the stair-core wall.
  const mediaConsole = new THREE.Group();
  mediaConsole.name = 'media-console';
  mediaConsole.add(meshRoundedBox(0.3, 0.4, 1.42, 0.035, mats.darkWood, 6.88, 0.28, 1.25));
  mediaConsole.add(meshBox(0.018, 0.29, 1.3, mats.wood, 6.72, 0.28, 1.25));
  mediaConsole.add(meshBox(0.018, 0.29, 0.018, mats.bronze, 6.705, 0.28, 1.25));
  group.add(mediaConsole);

  const television = new THREE.Group();
  television.name = 'television';
  television.position.set(7.015, 1.28, 1.25);
  television.add(meshRoundedBox(0.065, 0.78, 1.34, 0.025, mats.black, 0, 0, 0));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.69), mats.tvScreen);
  screen.name = 'television-screen';
  screen.rotation.y = -Math.PI / 2;
  screen.position.set(-0.034, 0, 0);
  screen.castShadow = false;
  television.add(screen);
  television.add(meshRoundedBox(0.018, 0.045, 0.34, 0.012, mats.black, -0.045, -0.435, 0));
  group.add(television);

  const soundbar = meshRoundedBox(0.09, 0.075, 0.82, 0.025, mats.black, 6.7, 0.56, 1.25);
  soundbar.name = 'soundbar';
  group.add(soundbar);

  const remote = meshRoundedBox(0.15, 0.025, 0.05, 0.012, mats.black, 5.56, 0.3, 1.2);
  remote.rotation.y = 0.2;
  remote.name = 'remote-control';
  group.add(remote);

  addCollider(colliders, 6.88, 1.25, 0.32, 1.42, 0, 1.7);
}

function addCabinetUnit(group, x, y, z, width, depth, height, topMat = mats.porcelain) {
  const cabinet = meshRoundedBox(width, height, depth, 0.035, mats.wood, x, y + height / 2, z);
  group.add(cabinet);
  group.add(meshRoundedBox(width + 0.045, 0.045, depth + 0.045, 0.022, topMat, x, y + height + 0.022, z));
  const panelCount = Math.max(1, Math.round(width / 0.62));
  for (let i = 1; i < panelCount; i += 1) {
    const panelX = x - width / 2 + (width / panelCount) * i;
    group.add(meshBox(0.012, height * 0.78, depth + 0.008, mats.darkWood, panelX, y + height * 0.48, z + 0.004));
  }
}


function updateSwingCollider(item) {
  const angle = item.pivot.rotation.y;
  const centerX = item.hingeX + Math.cos(angle) * (item.width / 2);
  const centerZ = item.hingeZ - Math.sin(angle) * (item.width / 2);
  const halfX = Math.abs(Math.cos(angle)) * (item.width / 2) + Math.abs(Math.sin(angle)) * (item.thickness / 2);
  const halfZ = Math.abs(Math.sin(angle)) * (item.width / 2) + Math.abs(Math.cos(angle)) * (item.thickness / 2);
  item.collider.minX = centerX - halfX;
  item.collider.maxX = centerX + halfX;
  item.collider.minZ = centerZ - halfZ;
  item.collider.maxZ = centerZ + halfZ;
}

function addFoodCylinder(group, x, y, z, radius, height, mat, capMat = mats.carton) {
  const body = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 0.96, height, 18), mat);
  body.position.set(x, y, z);
  body.castShadow = true;
  group.add(body);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(radius * 0.5, radius * 0.5, 0.035, 14), capMat);
  cap.position.set(x, y + height / 2 + 0.018, z);
  cap.castShadow = true;
  group.add(cap);
}

function addInteractiveFridge(group, colliders, appliances, x, z) {
  const fridge = new THREE.Group();
  fridge.name = 'refrigerator';
  const width = 0.9;
  const height = 1.86;
  const depth = 0.64;
  const frontZ = z - depth / 2;
  const panel = 0.055;

  fridge.add(meshRoundedBox(panel, height, depth, 0.025, mats.appliance, x - width / 2 + panel / 2, height / 2, z));
  fridge.add(meshRoundedBox(panel, height, depth, 0.025, mats.appliance, x + width / 2 - panel / 2, height / 2, z));
  fridge.add(meshRoundedBox(width, panel, depth, 0.025, mats.appliance, x, height - panel / 2, z));
  fridge.add(meshRoundedBox(width, panel, depth, 0.025, mats.appliance, x, panel / 2, z));
  fridge.add(meshRoundedBox(width - panel * 2, height - panel * 2, 0.045, 0.018, mats.fridgeInterior, x, height / 2, z + depth / 2 - 0.03));

  // Interior shelves and lower produce drawer.
  [0.55, 0.96, 1.36].forEach((shelfY) => {
    fridge.add(meshRoundedBox(width - 0.15, 0.025, depth - 0.15, 0.012, mats.glass, x, shelfY, z + 0.015));
  });
  fridge.add(meshRoundedBox(width - 0.15, 0.3, depth - 0.15, 0.025, mats.glass, x, 0.31, z + 0.02));

  const food = new THREE.Group();
  food.name = 'fridge-food';
  // Produce drawer.
  [
    [-0.22, 0.2, -0.07, mats.foodRed],
    [0.0, 0.18, 0.04, mats.foodOrange],
    [0.21, 0.2, -0.03, mats.foodGreen],
    [0.1, 0.25, 0.08, mats.foodYellow],
  ].forEach(([dx, y, dz, mat]) => {
    const produce = new THREE.Mesh(new THREE.SphereGeometry(0.085, 16, 12), mat);
    produce.scale.y = 0.82;
    produce.position.set(x + dx, y, z + dz);
    produce.castShadow = true;
    food.add(produce);
  });
  // Milk carton and egg box.
  food.add(meshRoundedBox(0.17, 0.34, 0.14, 0.018, mats.carton, x - 0.25, 0.74, z - 0.09));
  food.add(meshRoundedBox(0.34, 0.09, 0.2, 0.025, mats.foodYellow, x + 0.15, 0.61, z + 0.03));
  // Bottles and jars.
  addFoodCylinder(food, x + 0.03, 0.78, z - 0.08, 0.055, 0.28, mats.bottleGlass, mats.foodGreen);
  addFoodCylinder(food, x + 0.25, 1.13, z - 0.08, 0.052, 0.31, mats.foodOrange, mats.carton);
  addFoodCylinder(food, x - 0.18, 1.14, z + 0.02, 0.06, 0.25, mats.foodRed, mats.carton);
  food.add(meshRoundedBox(0.28, 0.18, 0.18, 0.025, mats.foodGreen, x + 0.13, 1.47, z - 0.01));
  fridge.add(food);

  const light = new THREE.PointLight(0xfff1cc, 0, 1.8, 2.2);
  light.position.set(x, 1.42, frontZ + 0.16);
  fridge.add(light);

  const pivot = new THREE.Group();
  pivot.name = 'refrigerator-door';
  pivot.position.set(x - width / 2, 0, frontZ - 0.015);
  const doorThickness = 0.06;
  pivot.add(meshRoundedBox(width, height, doorThickness, 0.025, mats.appliance, width / 2, height / 2, 0));
  pivot.add(meshRoundedBox(width - 0.1, height - 0.1, 0.022, 0.018, mats.fridgeInterior, width / 2, height / 2, 0.042));
  pivot.add(meshRoundedBox(0.022, 1.18, 0.025, 0.008, mats.metal, width * 0.82, 1.03, -0.04));
  // Door bins with a few drinks and condiments.
  [0.38, 0.78, 1.2].forEach((binY) => {
    pivot.add(meshRoundedBox(width - 0.18, 0.08, 0.14, 0.018, mats.fridgeInterior, width / 2, binY, 0.1));
  });
  addFoodCylinder(pivot, width * 0.3, 0.55, 0.1, 0.045, 0.24, mats.foodOrange, mats.carton);
  addFoodCylinder(pivot, width * 0.65, 0.96, 0.1, 0.042, 0.2, mats.foodRed, mats.carton);
  fridge.add(pivot);
  group.add(fridge);

  addCollider(colliders, x, z + 0.035, width, depth - 0.07, 0, height);
  const doorCollider = {
    minX: 0,
    maxX: 0,
    minZ: 0,
    maxZ: 0,
    minY: 0,
    maxY: height,
    isDoor: true,
  };
  colliders.push(doorCollider);

  const appliance = {
    id: 'refrigerador',
    label: 'refrigerador',
    pivot,
    collider: doorCollider,
    hingeX: x - width / 2,
    hingeZ: frontZ - 0.015,
    width,
    thickness: doorThickness,
    closedRotation: 0,
    openRotation: Math.PI / 2,
    targetRotation: 0,
    isOpen: false,
    getInteractionPosition(target) {
      target.set(width * 0.52, 1.05, -0.22);
      pivot.localToWorld(target);
      return target;
    },
    toggle() {
      this.isOpen = !this.isOpen;
      this.targetRotation = this.isOpen ? this.openRotation : this.closedRotation;
    },
    update(delta) {
      pivot.rotation.y = THREE.MathUtils.damp(pivot.rotation.y, this.targetRotation, 9, delta);
      light.intensity = THREE.MathUtils.damp(light.intensity, this.isOpen ? 1.45 : 0, 8, delta);
      updateSwingCollider(this);
    },
  };
  updateSwingCollider(appliance);
  appliances.push(appliance);
  return appliance;
}

function addKitchen(group, colliders, appliances) {
  // Pixel calibration from the plan yields a 3.25 m bar and a 2.45 m return.
  const barX = 2.66;
  const barZ = 4.96;
  addCabinetUnit(group, barX, 0, barZ, 3.22, 0.62, 0.88);
  addCabinetUnit(group, 3.95, 0, 6.08, 0.62, 2.25, 0.88);
  addCollider(colliders, barX, barZ, 3.22, 0.62, 0, 1.08);
  addCollider(colliders, 3.95, 6.08, 0.62, 2.25, 0, 1.08);

  [1.47, 2.18, 2.89, 3.6].forEach((px, index) => {
    const seatId = `kitchen-stool-${String(index + 1).padStart(2, '0')}`;
    const stool = new THREE.Group();
    stool.name = `seat-${seatId}`;
    stool.position.set(px, 0, 4.28);
    stool.userData.robloxSeatHost = {
      id: seatId,
      label: 'Banco de cocina',
      seats: [
        {
          id: seatId,
          label: 'Banco de cocina',
          position: [0, 0.69, -0.01],
          size: [0.34, 0.08, 0.31],
        },
      ],
    };
    stool.add(meshRoundedBox(0.4, 0.06, 0.38, 0.045, mats.accentA, 0, 0.66, 0));
    stool.add(meshRoundedBox(0.37, 0.31, 0.05, 0.025, mats.accentA, 0, 0.88, 0.14));
    addCylinderLegs(stool, [[-0.13, 0.32, -0.11], [0.13, 0.32, -0.11], [-0.13, 0.32, 0.11], [0.13, 0.32, 0.11]], 0.64, 0.021, mats.darkWood);
    group.add(stool);
  });

  const cooktop = meshRoundedBox(0.42, 0.018, 0.62, 0.025, mats.black, 3.95, 0.96, 6.13);
  group.add(cooktop);
  [-0.11, 0.11].forEach((dx) => {
    [-0.18, 0.18].forEach((dz) => {
      const burner = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.007, 10, 24), mats.metal);
      burner.rotation.x = Math.PI / 2;
      burner.position.set(3.95 + dx, 0.98, 6.13 + dz);
      group.add(burner);
    });
  });
  group.add(meshBox(0.42, 0.09, 0.4, mats.metal, 3.95, 1.9, 6.1));
  group.add(meshBox(0.1, 0.88, 0.1, mats.metal, 3.95, 1.44, 6.1));

  const rearZ = 7.98;
  addInteractiveFridge(group, colliders, appliances, 1.26, rearZ);

  addCabinetUnit(group, 2.23, 0, rearZ, 0.74, 0.62, 0.88);
  addCabinetUnit(group, 3.3, 0, rearZ, 1.18, 0.62, 0.88);
  group.add(meshRoundedBox(0.52, 0.026, 0.37, 0.025, mats.metal, 3.38, 0.95, rearZ - 0.04));
  const faucet = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.017, 10, 24, Math.PI), mats.metal);
  faucet.rotation.x = -Math.PI / 2;
  faucet.position.set(3.48, 1.1, rearZ - 0.04);
  group.add(faucet);
}

function addFrontLoader(group, colliders, x, z, name) {
  const shell = meshRoundedBox(0.64, 0.82, 0.62, 0.035, mats.appliance, x, 0.41, z);
  shell.name = name;
  group.add(shell);
  const door = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 0.02, 28), mats.darkGlass);
  door.rotation.x = Math.PI / 2;
  door.position.set(x, 0.42, z + 0.315);
  group.add(door);
  group.add(meshBox(0.3, 0.025, 0.018, mats.black, x, 0.67, z + 0.318));
  addCollider(colliders, x, z, 0.64, 0.62, 0, 0.95);
}

function addLaundry(group, colliders) {
  addCabinetUnit(group, 1.0, 0, 8.9, 0.66, 0.62, 0.82);
  group.add(meshRoundedBox(0.42, 0.025, 0.35, 0.02, mats.metal, 1.0, 0.87, 8.88));
  addFrontLoader(group, colliders, 1.82, 8.9, 'washer');
  addFrontLoader(group, colliders, 2.56, 8.9, 'dryer');
}

function addDoglegStair(group, colliders, walkSurfaces) {
  const stairGroup = new THREE.Group();
  stairGroup.name = 'stairs';

  const northZ = LAYOUT.stairTop + 0.18;
  const southZ = LAYOUT.patioTop - 0.88;
  const landingNorth = southZ;
  const landingSouth = LAYOUT.patioTop - 0.16;
  const centerX = (LAYOUT.stairLeft + LAYOUT.stairRight) / 2;
  const flightWidth = 1.06;
  const dividerGap = 0.18;
  const westX = centerX - (flightWidth + dividerGap) / 2;
  const eastX = centerX + (flightWidth + dividerGap) / 2;
  const risersPerFlight = 8;
  const totalRisers = risersPerFlight * 2;
  const riserHeight = WALL_HEIGHT / totalRisers;
  const midHeight = riserHeight * risersPerFlight;
  const treadDepth = (southZ - northZ) / risersPerFlight;

  // Lower flight: enter from the living room at the north-west side and rise south.
  for (let i = 0; i < risersPerFlight; i += 1) {
    const height = riserHeight * (i + 1);
    const z = northZ + treadDepth * (i + 0.5);
    stairGroup.add(meshBox(flightWidth, height, treadDepth + 0.012, mats.wood, westX, height / 2, z, 'stair-step'));
  }

  // Full-width intermediate landing turns 180 degrees.
  stairGroup.add(meshBox(
    flightWidth * 2 + dividerGap,
    0.14,
    landingSouth - landingNorth,
    mats.wood,
    centerX,
    midHeight - 0.07,
    (landingNorth + landingSouth) / 2,
    'mid-landing',
  ));

  // Upper flight: rise north on the east side, matching the plan's north-pointing arrow.
  for (let i = 0; i < risersPerFlight; i += 1) {
    const height = midHeight + riserHeight * (i + 1);
    const z = southZ - treadDepth * (i + 0.5);
    stairGroup.add(meshBox(flightWidth, height, treadDepth + 0.012, mats.wood, eastX, height / 2, z, 'stair-step'));
  }

  const upperLandingDepth = 0.72;
  stairGroup.add(meshBox(
    flightWidth + 0.1,
    0.16,
    upperLandingDepth,
    mats.wood,
    eastX,
    WALL_HEIGHT - 0.08,
    northZ - upperLandingDepth / 2 + 0.06,
    'upper-landing',
  ));

  // Slim central wall/stringer visually clarifies the two flights and leaves the turn open.
  stairGroup.add(meshBox(dividerGap, midHeight, southZ - northZ - 0.04, mats.wall, centerX, midHeight / 2, (northZ + southZ) / 2));

  function addSlopedRail(x, zStart, zEnd, yStart, yEnd) {
    const railLength = Math.hypot(zEnd - zStart, yEnd - yStart);
    const rail = meshBox(0.04, 0.04, railLength, mats.darkWood, x, (yStart + yEnd) / 2, (zStart + zEnd) / 2);
    rail.rotation.x = -Math.atan2(yEnd - yStart, zEnd - zStart);
    stairGroup.add(rail);
    for (let i = 0; i <= 6; i += 1) {
      const t = i / 6;
      const z = zStart + (zEnd - zStart) * t;
      const baseY = yStart + (yEnd - yStart) * t - 0.9;
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.9, 8), mats.darkWood);
      post.position.set(x, baseY + 0.45, z);
      post.castShadow = true;
      stairGroup.add(post);
    }
  }

  addSlopedRail(westX - flightWidth / 2 + 0.03, northZ, southZ, 0.98, midHeight + 0.98);
  addSlopedRail(westX + flightWidth / 2 - 0.03, northZ, southZ, 0.98, midHeight + 0.98);
  addSlopedRail(eastX - flightWidth / 2 + 0.03, southZ, northZ, midHeight + 0.98, WALL_HEIGHT + 0.98);
  addSlopedRail(eastX + flightWidth / 2 - 0.03, southZ, northZ, midHeight + 0.98, WALL_HEIGHT + 0.98);

  group.add(stairGroup);

  // The divider is collidable, while each flight remains walkable.
  addCollider(colliders, centerX, (northZ + southZ) / 2, dividerGap, southZ - northZ - 0.08, 0, WALL_HEIGHT + 1.2);
  addCollider(colliders, LAYOUT.stairLeft + 0.13, (northZ + southZ) / 2, 0.12, southZ - northZ + 0.2, 0, WALL_HEIGHT + 1.2);
  addCollider(colliders, LAYOUT.stairRight - 0.13, (northZ + southZ) / 2, 0.12, southZ - northZ + 0.2, 0, WALL_HEIGHT + 1.2);

  walkSurfaces.push({
    type: 'ramp-z-positive',
    minX: westX - flightWidth / 2 + 0.08,
    maxX: westX + flightWidth / 2 - 0.08,
    minZ: northZ,
    maxZ: southZ,
    zStart: northZ,
    zEnd: southZ,
    heightStart: 0,
    heightEnd: midHeight,
  });
  walkSurfaces.push({
    type: 'platform',
    minX: westX - flightWidth / 2 + 0.04,
    maxX: eastX + flightWidth / 2 - 0.04,
    minZ: landingNorth,
    maxZ: landingSouth,
    height: midHeight,
  });
  walkSurfaces.push({
    type: 'ramp-z-negative',
    minX: eastX - flightWidth / 2 + 0.08,
    maxX: eastX + flightWidth / 2 - 0.08,
    minZ: northZ,
    maxZ: southZ,
    zStart: southZ,
    zEnd: northZ,
    heightStart: midHeight,
    heightEnd: WALL_HEIGHT,
  });
  walkSurfaces.push({
    type: 'platform',
    minX: eastX - flightWidth / 2 + 0.04,
    maxX: eastX + flightWidth / 2 - 0.04,
    minZ: northZ - upperLandingDepth + 0.06,
    maxZ: northZ + 0.04,
    height: WALL_HEIGHT,
  });
}

function addPatioTree(group, colliders) {
  const tree = new THREE.Group();
  tree.name = 'patio-tree';
  tree.position.set(5.72, 0, 9.34);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.13, 1.25, 12), mats.darkWood);
  trunk.position.y = 0.66;
  trunk.castShadow = true;
  tree.add(trunk);
  const crown = new THREE.Group();
  crown.position.y = 1.45;
  [[0, 0.16, 0, 0.46], [-0.28, 0.02, 0.16, 0.32], [0.29, 0.07, -0.1, 0.35], [0.08, 0.2, 0.28, 0.3], [-0.16, 0.22, -0.25, 0.28]].forEach(([x, y, z, s]) => {
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), mats.leaf);
    leaf.position.set(x, y, z);
    leaf.castShadow = true;
    crown.add(leaf);
  });
  tree.add(crown);
  const planter = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 0.26, 24), mats.planter);
  planter.position.y = 0.13;
  planter.castShadow = true;
  tree.add(planter);
  group.add(tree);
  addCollider(colliders, 5.72, 9.34, 0.82, 0.82, 0, 2.1);
}

function addBed(group, colliders, x, z, width, depth, rotation, accentMat = mats.accentA) {
  const bed = new THREE.Group();
  bed.position.set(x, 0, z);
  bed.rotation.y = rotation;
  bed.add(meshRoundedBox(width, 0.22, depth, 0.05, mats.darkWood, 0, 0.13, 0));
  bed.add(meshRoundedBox(width - 0.06, 0.2, depth - 0.1, 0.045, mats.upholstery, 0, 0.34, 0));
  bed.add(meshRoundedBox(width, 0.82, 0.11, 0.04, mats.wood, 0, 0.48, depth / 2 - 0.025));
  bed.add(meshRoundedBox(width - 0.12, 0.05, depth * 0.39, 0.035, accentMat, 0, 0.51, -depth * 0.26));
  bed.add(meshRoundedBox(width * 0.37, 0.1, 0.35, 0.025, mats.porcelain, -width * 0.22, 0.62, depth * 0.28));
  bed.add(meshRoundedBox(width * 0.37, 0.1, 0.35, 0.025, mats.porcelain, width * 0.22, 0.62, depth * 0.28));
  group.add(bed);
  addRotatedCollider(colliders, x, z, width, depth, rotation, 0, 0.9);
}

function addNightstand(group, colliders, x, z) {
  group.add(meshRoundedBox(0.36, 0.38, 0.36, 0.03, mats.wood, x, 0.2, z));
  const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.19, 12), mats.bronze);
  lampBase.position.set(x, 0.48, z);
  group.add(lampBase);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.14, 18), mats.upholstery);
  shade.position.set(x, 0.64, z);
  group.add(shade);
  addCollider(colliders, x, z, 0.36, 0.36, 0, 0.8);
}


function addBedroomOneCloset(group, colliders) {
  const closet = new THREE.Group();
  closet.name = 'bedroom-one-closet';
  const x = (LAYOUT.stairRight + LAYOUT.corridorRight) / 2;
  const z = 0.38;
  const width = 1.02;
  const height = 2.3;
  const depth = 0.58;
  closet.add(meshRoundedBox(width, height, depth, 0.025, mats.wood, x, height / 2, z));
  closet.add(meshBox(0.018, height - 0.18, depth + 0.012, mats.darkWood, x, height / 2, z - 0.008));
  [-0.22, 0.22].forEach((dx) => {
    closet.add(meshBox(0.018, 0.16, 0.025, mats.bronze, x + dx, 1.14, z - depth / 2 - 0.014));
  });
  group.add(closet);
  addCollider(colliders, x, z, width, depth, 0, height);
}

function addBedroomFurniture(group, colliders) {
  addBedroomOneCloset(group, colliders);
  addRug(group, 10.43, 1.2, 2.58, 2.05);
  addBed(group, colliders, 10.28, 1.2, 1.48, 1.98, Math.PI / 2, mats.accentA);
  addNightstand(group, colliders, 11.48, 0.5);
  addNightstand(group, colliders, 11.48, 1.9);

  addRug(group, 10.35, 9.03, 2.65, 2.12);
  addBed(group, colliders, 10.25, 9.03, 1.5, 2.0, Math.PI / 2, mats.accentB);
  addNightstand(group, colliders, 11.48, 8.24);
  addNightstand(group, colliders, 11.48, 9.82);
}

function addBathroom(group, colliders, northZ, southZ) {
  const sinkX = 9.02;
  const toiletX = 10.17;
  const centerZ = (northZ + southZ) / 2;
  const fixtureZ = northZ + 0.46;

  group.add(meshRoundedBox(0.64, 0.66, 0.46, 0.035, mats.wood, sinkX, 0.34, fixtureZ));
  group.add(meshRoundedBox(0.66, 0.045, 0.48, 0.025, mats.porcelain, sinkX, 0.7, fixtureZ));
  const basin = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.055, 20), mats.porcelain);
  basin.position.set(sinkX, 0.78, fixtureZ);
  group.add(basin);
  group.add(meshBox(0.62, 0.58, 0.028, mats.darkGlass, sinkX, 1.3, northZ + 0.1));
  addCollider(colliders, sinkX, fixtureZ, 0.64, 0.46, 0, 0.95);

  group.add(meshRoundedBox(0.4, 0.55, 0.22, 0.03, mats.porcelain, toiletX, 0.39, northZ + 0.28));
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.24, 0.31, 24), mats.porcelain);
  bowl.scale.z = 1.18;
  bowl.position.set(toiletX, 0.21, northZ + 0.64);
  group.add(bowl);
  const seat = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.032, 10, 24), mats.porcelain);
  seat.rotation.x = Math.PI / 2;
  seat.scale.z = 1.18;
  seat.position.set(toiletX, 0.45, northZ + 0.64);
  group.add(seat);
  addCollider(colliders, toiletX, northZ + 0.54, 0.5, 0.75, 0, 0.9);

  const showerX = 11.5;
  const showerWidth = 0.92;
  const showerDepth = southZ - northZ - 0.18;
  group.add(meshRoundedBox(showerWidth, 0.028, showerDepth, 0.02, mats.wetFloor, showerX, 0.04, centerZ));
  group.add(meshBox(0.035, 1.86, showerDepth, mats.glass, 11.03, 0.95, centerZ));
  const showerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.035, 18), mats.metal);
  showerHead.rotation.z = Math.PI / 2;
  showerHead.position.set(11.83, 1.88, northZ + 0.4);
  group.add(showerHead);
  group.add(meshBox(0.018, 0.58, 0.018, mats.metal, 11.84, 1.58, northZ + 0.4));
  addCollider(colliders, showerX, centerZ, showerWidth, showerDepth, 0, 2.1);
}

function addRoomLabel(group, labels, text, x, z, y = 2.54) {
  const element = document.createElement('div');
  element.className = 'room-label';
  element.textContent = text;
  const label = new CSS2DObject(element);
  label.position.set(x, y, z);
  group.add(label);
  labels.push(label);
}

function addWindows(group) {
  function horizontalWindow(x, z, width) {
    const frame = new THREE.Group();
    frame.position.set(x, 1.56, z);
    frame.add(meshBox(width, 1.08, 0.035, mats.darkGlass, 0, 0, 0));
    frame.add(meshBox(width + 0.05, 0.04, 0.06, mats.darkWood, 0, 0.56, 0));
    frame.add(meshBox(width + 0.05, 0.04, 0.06, mats.darkWood, 0, -0.56, 0));
    frame.add(meshBox(0.04, 1.1, 0.06, mats.darkWood, 0, 0, 0));
    group.add(frame);
  }

  function verticalWindow(x, z, depth) {
    const frame = new THREE.Group();
    frame.position.set(x, 1.56, z);
    frame.add(meshBox(0.035, 1.08, depth, mats.darkGlass, 0, 0, 0));
    frame.add(meshBox(0.06, 0.04, depth + 0.05, mats.darkWood, 0, 0.56, 0));
    frame.add(meshBox(0.06, 0.04, depth + 0.05, mats.darkWood, 0, -0.56, 0));
    frame.add(meshBox(0.06, 1.1, 0.04, mats.darkWood, 0, 0, 0));
    group.add(frame);
  }

  horizontalWindow(3.7, 0.1, 2.95);
  horizontalWindow(5.96, 0.1, 1.36);
  horizontalWindow(10.2, 0.1, 2.4);
  horizontalWindow(9.9, PLAN_DEPTH - 0.1, 1.75);
  verticalWindow(0.1, 3.42, 1.46);
  verticalWindow(0.1, 6.25, 1.25);
  verticalWindow(PLAN_WIDTH - 0.1, 1.1, 1.22);
  verticalWindow(PLAN_WIDTH - 0.1, 9.0, 1.55);
}

function addRoof(roofGroup) {
  const roofY = WALL_HEIGHT + 0.11;
  roofGroup.add(meshBox(PLAN_WIDTH, 0.17, LAYOUT.patioTop, mats.roof, PLAN_WIDTH / 2, roofY, LAYOUT.patioTop / 2));
  roofGroup.add(meshBox(LAYOUT.stairLeft, 0.17, PLAN_DEPTH - LAYOUT.patioTop, mats.roof, LAYOUT.stairLeft / 2, roofY, (PLAN_DEPTH + LAYOUT.patioTop) / 2));
  roofGroup.add(meshBox(PLAN_WIDTH - LAYOUT.stairRight, 0.17, PLAN_DEPTH - LAYOUT.patioTop, mats.roof, (PLAN_WIDTH + LAYOUT.stairRight) / 2, roofY, (PLAN_DEPTH + LAYOUT.patioTop) / 2));
  const parapet = 0.16;
  roofGroup.add(meshBox(LAYOUT.stairRight - LAYOUT.stairLeft, 0.38, parapet, mats.wall, (LAYOUT.stairLeft + LAYOUT.stairRight) / 2, roofY + 0.19, LAYOUT.patioTop));
  roofGroup.add(meshBox(LAYOUT.stairRight - LAYOUT.stairLeft, 0.38, parapet, mats.wall, (LAYOUT.stairLeft + LAYOUT.stairRight) / 2, roofY + 0.19, PLAN_DEPTH));
  roofGroup.add(meshBox(parapet, 0.38, PLAN_DEPTH - LAYOUT.patioTop, mats.wall, LAYOUT.stairLeft, roofY + 0.19, (PLAN_DEPTH + LAYOUT.patioTop) / 2));
  roofGroup.add(meshBox(parapet, 0.38, PLAN_DEPTH - LAYOUT.patioTop, mats.wall, LAYOUT.stairRight, roofY + 0.19, (PLAN_DEPTH + LAYOUT.patioTop) / 2));
}

export function buildPlan(scene) {
  const root = new THREE.Group();
  root.name = 'plan-root';
  scene.add(root);

  const wallGroup = new THREE.Group();
  wallGroup.name = 'walls';
  root.add(wallGroup);

  const furnitureGroup = new THREE.Group();
  furnitureGroup.name = 'furniture';
  root.add(furnitureGroup);

  const labelsGroup = new THREE.Group();
  labelsGroup.name = 'labels';
  root.add(labelsGroup);

  const roofGroup = new THREE.Group();
  roofGroup.name = 'roof';
  roofGroup.visible = false;
  root.add(roofGroup);

  const colliders = [];
  const labels = [];
  const doors = [];
  const appliances = [];
  const walkSurfaces = [];

  addFloorArea(root, PLAN_WIDTH / 2, PLAN_DEPTH / 2, PLAN_WIDTH, PLAN_DEPTH, mats.mainFloor, 0);
  addFloorArea(root, LAYOUT.stairLeft / 2, (LAYOUT.stairTop + LAYOUT.patioTop) / 2, LAYOUT.stairLeft, LAYOUT.patioTop - LAYOUT.stairTop, mats.wetFloor, 0.03);
  addFloorArea(root, LAYOUT.stairLeft / 2, (LAYOUT.patioTop + PLAN_DEPTH) / 2, LAYOUT.stairLeft, PLAN_DEPTH - LAYOUT.patioTop, mats.wetFloor, 0.03);
  addFloorArea(root, (LAYOUT.stairLeft + LAYOUT.stairRight) / 2, (LAYOUT.patioTop + PLAN_DEPTH) / 2, LAYOUT.stairRight - LAYOUT.stairLeft, PLAN_DEPTH - LAYOUT.patioTop, mats.patio, 0.03);
  addFloorArea(root, (LAYOUT.corridorRight + PLAN_WIDTH) / 2, (LAYOUT.bedroom1Bottom + LAYOUT.bathroom1Bottom) / 2, PLAN_WIDTH - LAYOUT.corridorRight, LAYOUT.bathroom1Bottom - LAYOUT.bedroom1Bottom, mats.wetFloor, 0.03);
  addFloorArea(root, (LAYOUT.corridorRight + PLAN_WIDTH) / 2, (LAYOUT.bathroom1Bottom + LAYOUT.bathroom2Bottom) / 2, PLAN_WIDTH - LAYOUT.corridorRight, LAYOUT.bathroom2Bottom - LAYOUT.bathroom1Bottom, mats.wetFloor, 0.03);

  // Envelope and openings, calibrated from the rectified floor-plan image at ~72 px/m.
  addHorizontalWallWithDoor(wallGroup, colliders, 0, PLAN_WIDTH, 0, 0.18, 1.25);
  addWallSegment(wallGroup, colliders, PLAN_WIDTH / 2, PLAN_DEPTH, PLAN_WIDTH, WALL_THICKNESS);
  addVerticalWallWithDoor(wallGroup, colliders, 0, 0, PLAN_DEPTH, 7.22, 8.24);
  addWallSegment(wallGroup, colliders, PLAN_WIDTH, PLAN_DEPTH / 2, WALL_THICKNESS, PLAN_DEPTH);

  addWallSegment(wallGroup, colliders, LAYOUT.stairLeft, (LAYOUT.stairTop + LAYOUT.patioTop) / 2, WALL_THICKNESS, LAYOUT.patioTop - LAYOUT.stairTop);
  addWallSegment(wallGroup, colliders, LAYOUT.stairRight, (LAYOUT.stairTop + LAYOUT.patioTop) / 2, WALL_THICKNESS, LAYOUT.patioTop - LAYOUT.stairTop);
  addWallSegment(wallGroup, colliders, (LAYOUT.stairLeft + LAYOUT.stairRight) / 2, LAYOUT.patioTop, LAYOUT.stairRight - LAYOUT.stairLeft, WALL_THICKNESS);
  addWallSegment(wallGroup, colliders, LAYOUT.stairRight, (LAYOUT.patioTop + PLAN_DEPTH) / 2, WALL_THICKNESS, PLAN_DEPTH - LAYOUT.patioTop);
  addWallSegment(wallGroup, colliders, LAYOUT.stairLeft / 2 + 0.56, LAYOUT.patioTop, LAYOUT.stairLeft - 1.12, WALL_THICKNESS);

  // The plan has no separate vestibule door beside the TV. That vertical wall is continuous;
  // the nearby swing belongs to Recámara 1 and sits in its south wall.
  addWallSegment(wallGroup, colliders, LAYOUT.stairRight, LAYOUT.bedroom1Bottom / 2, WALL_THICKNESS, LAYOUT.bedroom1Bottom);
  addWallSegment(wallGroup, colliders, LAYOUT.corridorRight, 0.86, WALL_THICKNESS, 1.72);
  addHorizontalWallWithDoor(
    wallGroup,
    colliders,
    LAYOUT.stairRight,
    PLAN_WIDTH,
    LAYOUT.bedroom1Bottom,
    LAYOUT.stairRight,
    LAYOUT.stairRight + 0.94,
  );
  addVerticalWallWithDoor(wallGroup, colliders, LAYOUT.corridorRight, LAYOUT.bedroom1Bottom, LAYOUT.bathroom1Bottom, 3.28, 4.2);
  addVerticalWallWithDoor(wallGroup, colliders, LAYOUT.corridorRight, LAYOUT.bathroom1Bottom, LAYOUT.bathroom2Bottom, 5.08, 6.0);
  addVerticalWallWithDoor(wallGroup, colliders, LAYOUT.corridorRight, LAYOUT.bathroom2Bottom, PLAN_DEPTH, 7.02, 7.92);
  addWallSegment(wallGroup, colliders, (LAYOUT.corridorRight + PLAN_WIDTH) / 2, LAYOUT.bathroom1Bottom, PLAN_WIDTH - LAYOUT.corridorRight, WALL_THICKNESS);
  addWallSegment(wallGroup, colliders, (LAYOUT.corridorRight + PLAN_WIDTH) / 2, LAYOUT.bathroom2Bottom, PLAN_WIDTH - LAYOUT.corridorRight, WALL_THICKNESS);

  addDoor(wallGroup, colliders, doors, { id: 'entrada', label: 'puerta de entrada', hingeX: 0.18, hingeZ: 0.09, width: 1.04, closedRotation: 0, openAngle: Math.PI / 2, openByDefault: true });
  addDoor(wallGroup, colliders, doors, { id: 'servicio', label: 'puerta de servicio', hingeX: 0.09, hingeZ: 8.24, width: 0.9, closedRotation: Math.PI / 2, openAngle: -Math.PI / 2 });
  addDoor(wallGroup, colliders, doors, {
    id: 'recamara-1',
    label: 'puerta de Recámara 1',
    hingeX: LAYOUT.stairRight + 0.09,
    hingeZ: LAYOUT.bedroom1Bottom - 0.09,
    width: 0.86,
    closedRotation: 0,
    openAngle: Math.PI / 2,
  });
  addDoor(wallGroup, colliders, doors, { id: 'bano-1', label: 'puerta de Baño 1', hingeX: LAYOUT.corridorRight + 0.09, hingeZ: 3.28, width: 0.86, closedRotation: -Math.PI / 2, openAngle: Math.PI / 2 });
  addDoor(wallGroup, colliders, doors, { id: 'bano-2', label: 'puerta de Baño 2', hingeX: LAYOUT.corridorRight + 0.09, hingeZ: 5.08, width: 0.86, closedRotation: -Math.PI / 2, openAngle: Math.PI / 2 });
  addDoor(wallGroup, colliders, doors, { id: 'recamara-2', label: 'puerta de Recámara 2', hingeX: LAYOUT.corridorRight - 0.09, hingeZ: 7.92, width: 0.86, closedRotation: Math.PI / 2, openAngle: -Math.PI / 2 });

  addWindows(wallGroup);
  addRoof(roofGroup);

  addDining(furnitureGroup, colliders);
  addSofa(furnitureGroup, colliders);
  addKitchen(furnitureGroup, colliders, appliances);
  addLaundry(furnitureGroup, colliders);
  addDoglegStair(furnitureGroup, colliders, walkSurfaces);
  addPatioTree(furnitureGroup, colliders);
  addBedroomFurniture(furnitureGroup, colliders);
  addBathroom(furnitureGroup, colliders, LAYOUT.bedroom1Bottom, LAYOUT.bathroom1Bottom);
  addBathroom(furnitureGroup, colliders, LAYOUT.bathroom1Bottom, LAYOUT.bathroom2Bottom);

  addRoomLabel(labelsGroup, labels, 'Comedor', 1.65, 2.88);
  addRoomLabel(labelsGroup, labels, 'Sala', 5.05, 2.9);
  addRoomLabel(labelsGroup, labels, 'Cocina', 2.45, 6.65);
  addRoomLabel(labelsGroup, labels, 'Lavandería', 2.05, 9.95);
  addRoomLabel(labelsGroup, labels, 'Escalera', 5.68, 6.3);
  addRoomLabel(labelsGroup, labels, 'Patio', 5.68, 9.86);
  addRoomLabel(labelsGroup, labels, 'Recámara 1', 10.28, 2.58);
  addRoomLabel(labelsGroup, labels, 'Baño 1', 10.28, 4.58);
  addRoomLabel(labelsGroup, labels, 'Baño 2', 10.28, 6.52);
  addRoomLabel(labelsGroup, labels, 'Recámara 2', 10.25, 7.18);
  addRoomLabel(labelsGroup, labels, 'Pasillo', 7.7, 4.75);

  const plinth = meshBox(PLAN_WIDTH + 0.3, 0.22, PLAN_DEPTH + 0.3, material(0xb8aa98, 1), PLAN_WIDTH / 2, -0.15, PLAN_DEPTH / 2);
  plinth.receiveShadow = true;
  root.add(plinth);

  const interactionWorldPosition = new THREE.Vector3();
  const cameraDirection = new THREE.Vector3();
  const toInteraction = new THREE.Vector3();
  const interactables = [...doors, ...appliances];

  function getNearestInteractable(camera, maxDistance = 1.9) {
    camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0;
    if (cameraDirection.lengthSq() > 0) cameraDirection.normalize();
    let nearest = null;
    for (const interactable of interactables) {
      interactable.getInteractionPosition(interactionWorldPosition);
      toInteraction.set(
        interactionWorldPosition.x - camera.position.x,
        0,
        interactionWorldPosition.z - camera.position.z,
      );
      const distance = toInteraction.length();
      if (distance > maxDistance || distance < 0.001) continue;
      toInteraction.normalize();
      if (cameraDirection.dot(toInteraction) < 0.04) continue;
      if (!nearest || distance < nearest.distance) nearest = { interactable, distance };
    }
    return nearest;
  }

  function interactNearest(camera) {
    const candidate = getNearestInteractable(camera);
    if (!candidate) return null;
    candidate.interactable.toggle();
    return candidate.interactable;
  }

  function updateInteractables(delta) {
    for (const interactable of interactables) interactable.update(delta);
  }

  function getGroundHeight(x, z) {
    let height = 0;
    for (const surface of walkSurfaces) {
      if (x < surface.minX || x > surface.maxX || z < surface.minZ || z > surface.maxZ) continue;
      if (surface.type === 'platform') height = Math.max(height, surface.height);
      if (surface.type === 'ramp-z-positive' || surface.type === 'ramp-z-negative') {
        const progress = THREE.MathUtils.clamp((z - surface.zStart) / (surface.zEnd - surface.zStart), 0, 1);
        height = Math.max(height, THREE.MathUtils.lerp(surface.heightStart, surface.heightEnd, progress));
      }
    }
    return height;
  }

  return {
    root,
    wallGroup,
    furnitureGroup,
    labelsGroup,
    roofGroup,
    colliders,
    labels,
    doors,
    appliances,
    interactables,
    bounds: { minX: 0.21, maxX: PLAN_WIDTH - 0.21, minZ: 0.21, maxZ: PLAN_DEPTH - 0.21 },
    entrance: new THREE.Vector3(0.62, 1.68, 0.58),
    center: new THREE.Vector3(PLAN_WIDTH / 2, 0.3, PLAN_DEPTH / 2),
    width: PLAN_WIDTH,
    depth: PLAN_DEPTH,
    estimatedGrossArea: PLAN_WIDTH * PLAN_DEPTH,
    estimatedUsableArea: 112,
    getNearestInteractable,
    interactNearest,
    updateInteractables,
    getGroundHeight,
    themes: THEME_PRESETS,
    applyTheme(themeName = 'arena') {
      return applyThemeToMaterials(themeName);
    },
  };
}
