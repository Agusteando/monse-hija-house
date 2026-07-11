import * as THREE from 'three';
import { strToU8, zipSync } from 'fflate';

const PACKAGE_BASENAME = 'casa-patio-roblox';
const MAX_TEXTURE_SIZE = 1024;

function sanitizeName(value, fallback = 'asset') {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || fallback;
}

function textureImageSize(image) {
  return {
    width: image?.naturalWidth || image?.videoWidth || image?.width || 0,
    height: image?.naturalHeight || image?.videoHeight || image?.height || 0,
  };
}

function drawRepeatedTexture(ctx, texture, width, height) {
  const image = texture?.image;
  const source = textureImageSize(image);
  if (!image || source.width <= 0 || source.height <= 0) return false;

  const repeatX = Math.max(0.001, Math.abs(texture.repeat?.x || 1));
  const repeatY = Math.max(0.001, Math.abs(texture.repeat?.y || 1));
  const tileWidth = width / repeatX;
  const tileHeight = height / repeatY;
  const columns = Math.ceil(repeatX) + 1;
  const rows = Math.ceil(repeatY) + 1;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      ctx.drawImage(image, column * tileWidth, row * tileHeight, tileWidth, tileHeight);
    }
  }

  return true;
}

function bakeMaterialColorMap(sourceMaterial) {
  const sourceMap = sourceMaterial.map;
  const sourceSize = textureImageSize(sourceMap?.image);
  const hasSourceMap = sourceSize.width > 0 && sourceSize.height > 0;
  const width = hasSourceMap ? Math.min(MAX_TEXTURE_SIZE, Math.max(64, sourceSize.width)) : 32;
  const height = hasSourceMap ? Math.min(MAX_TEXTURE_SIZE, Math.max(64, sourceSize.height)) : 32;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('El navegador no permite crear las texturas PNG para Roblox.');

  if (!drawRepeatedTexture(ctx, sourceMap, width, height)) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  const color = sourceMaterial.color || new THREE.Color(0xffffff);
  const opacity = THREE.MathUtils.clamp(sourceMaterial.opacity ?? 1, 0, 1);
  const pixels = ctx.getImageData(0, 0, width, height);

  for (let index = 0; index < pixels.data.length; index += 4) {
    pixels.data[index] = Math.round(pixels.data[index] * color.r);
    pixels.data[index + 1] = Math.round(pixels.data[index + 1] * color.g);
    pixels.data[index + 2] = Math.round(pixels.data[index + 2] * color.b);
    pixels.data[index + 3] = Math.round(pixels.data[index + 3] * opacity);
  }
  ctx.putImageData(pixels, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.name = `${sanitizeName(sourceMaterial.name, 'material')}-colormap`;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  texture.rotation = 0;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

function createRobloxMaterial(sourceMaterial) {
  const opacity = THREE.MathUtils.clamp(sourceMaterial.opacity ?? 1, 0, 1);
  const transparent = Boolean(sourceMaterial.transparent || opacity < 0.999);
  const material = new THREE.MeshStandardMaterial({
    name: sanitizeName(sourceMaterial.name, 'material'),
    color: 0xffffff,
    map: bakeMaterialColorMap(sourceMaterial),
    roughness: THREE.MathUtils.clamp(sourceMaterial.roughness ?? 0.8, 0, 1),
    metalness: THREE.MathUtils.clamp(sourceMaterial.metalness ?? 0, 0, 1),
    transparent,
    opacity: 1,
    alphaTest: sourceMaterial.alphaTest || 0,
    side: sourceMaterial.side === THREE.DoubleSide ? THREE.DoubleSide : THREE.FrontSide,
  });

  if (sourceMaterial.emissive) {
    material.emissive.copy(sourceMaterial.emissive);
    material.emissiveIntensity = sourceMaterial.emissiveIntensity ?? 1;
  }

  material.userData.robloxSourceMaterial = sourceMaterial.name || sourceMaterial.type;
  material.needsUpdate = true;
  return material;
}

function createRobloxExportRoot(sourceRoot) {
  const exportRoot = sourceRoot.clone(true);
  exportRoot.name = PACKAGE_BASENAME;

  // CSS labels are browser interface objects, not model geometry.
  exportRoot.getObjectByName('labels')?.removeFromParent();

  const materialCache = new Map();
  const usedNames = new Set();
  let meshIndex = 0;

  function convertedMaterial(sourceMaterial) {
    if (!sourceMaterial) return null;
    if (!materialCache.has(sourceMaterial.uuid)) {
      materialCache.set(sourceMaterial.uuid, createRobloxMaterial(sourceMaterial));
    }
    return materialCache.get(sourceMaterial.uuid);
  }

  exportRoot.traverse((object) => {
    object.visible = true;
    if (!object.isMesh) return;

    meshIndex += 1;
    let category = 'building';
    let parent = object.parent;
    while (parent && parent !== exportRoot) {
      if (['walls', 'furniture', 'roof'].includes(parent.name) || parent.name.startsWith('door-')) {
        category = parent.name;
        break;
      }
      parent = parent.parent;
    }

    const baseName = sanitizeName(object.name, 'mesh');
    const categoryName = sanitizeName(category, 'building');
    let candidate = `${categoryName}_${baseName}_${String(meshIndex).padStart(3, '0')}`;
    let suffix = 2;
    while (usedNames.has(candidate)) {
      candidate = `${categoryName}_${baseName}_${String(meshIndex).padStart(3, '0')}_${suffix}`;
      suffix += 1;
    }
    usedNames.add(candidate);
    object.name = candidate;

    object.material = Array.isArray(object.material)
      ? object.material.map(convertedMaterial)
      : convertedMaterial(object.material);
  });

  exportRoot.updateMatrixWorld(true);
  return {
    root: exportRoot,
    meshCount: meshIndex,
    materialCount: materialCache.size,
  };
}

function decodeDataUri(uri) {
  const match = /^data:([^;,]+)?((?:;[^,]*)*),(.*)$/s.exec(uri || '');
  if (!match) throw new Error('El exportador produjo un recurso que no puede separarse del archivo glTF.');

  const mimeType = match[1] || 'application/octet-stream';
  const parameters = match[2] || '';
  const payload = match[3] || '';

  if (parameters.includes(';base64')) {
    const binary = window.atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
    return { mimeType, bytes };
  }

  return { mimeType, bytes: strToU8(decodeURIComponent(payload)) };
}

function extensionForMimeType(mimeType) {
  if (mimeType.includes('jpeg')) return 'jpg';
  if (mimeType.includes('webp')) return 'webp';
  return 'png';
}

function externalizeGltfResources(gltf) {
  const files = {};
  const usedTextureNames = new Set();
  let textureCount = 0;

  (gltf.buffers || []).forEach((buffer, index) => {
    if (!buffer.uri?.startsWith('data:')) return;
    const { bytes } = decodeDataUri(buffer.uri);
    const fileName = index === 0 ? `${PACKAGE_BASENAME}.bin` : `${PACKAGE_BASENAME}-${index + 1}.bin`;
    files[fileName] = bytes;
    buffer.uri = fileName;
  });

  (gltf.images || []).forEach((image, index) => {
    if (!image.uri?.startsWith('data:')) return;
    const { mimeType, bytes } = decodeDataUri(image.uri);
    const extension = extensionForMimeType(mimeType);
    const baseName = sanitizeName(image.name, `texture-${String(index + 1).padStart(3, '0')}`);
    let fileName = `textures/${baseName}.${extension}`;
    let suffix = 2;
    while (usedTextureNames.has(fileName)) {
      fileName = `textures/${baseName}-${suffix}.${extension}`;
      suffix += 1;
    }
    usedTextureNames.add(fileName);
    files[fileName] = bytes;
    image.uri = fileName;
    delete image.mimeType;
    textureCount += 1;
  });

  files[`${PACKAGE_BASENAME}.gltf`] = strToU8(JSON.stringify(gltf, null, 2));
  return { files, textureCount };
}

function disposeExportMaterials(root) {
  const disposed = new Set();
  root.traverse((object) => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => {
      if (!material || disposed.has(material.uuid)) return;
      disposed.add(material.uuid);
      material.map?.dispose();
      material.dispose();
    });
  });
}

export async function buildRobloxImportPackage(sourceRoot) {
  const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
  const exporter = new GLTFExporter();
  const prepared = createRobloxExportRoot(sourceRoot);

  try {
    const gltf = await exporter.parseAsync(prepared.root, {
      binary: false,
      onlyVisible: false,
      maxTextureSize: MAX_TEXTURE_SIZE,
    });

    const externalized = externalizeGltfResources(gltf);
    if (externalized.textureCount === 0) {
      throw new Error('No se generaron mapas de color. La exportación se canceló para evitar otro modelo sin texturas.');
    }

    const archive = zipSync(externalized.files, { level: 6 });
    return {
      fileName: `${PACKAGE_BASENAME}.zip`,
      blob: new Blob([archive], { type: 'application/zip' }),
      meshCount: prepared.meshCount,
      materialCount: prepared.materialCount,
      textureCount: externalized.textureCount,
    };
  } finally {
    disposeExportMaterials(prepared.root);
  }
}
