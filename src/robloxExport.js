import * as THREE from 'three';
import { strToU8, zipSync } from 'fflate';

const PACKAGE_BASENAME = 'casa-patio-roblox';
const MAX_TEXTURE_SIZE = 1024;
const MARKER_SIZE = 0.035;

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

function createInteractionMarker(name, markerMaterial, position, scale, rotationY = 0) {
  const marker = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), markerMaterial);
  marker.name = name;
  marker.position.fromArray(position);
  marker.scale.fromArray(scale);
  marker.rotation.y = rotationY;
  marker.userData.robloxMarker = true;
  marker.userData.robloxMarkerName = name;
  marker.castShadow = false;
  marker.receiveShadow = false;
  return marker;
}

function addRobloxInteractionMarkers(exportRoot) {
  const markerMaterial = new THREE.MeshStandardMaterial({
    name: 'roblox-interaction-marker',
    color: 0xff00ff,
    roughness: 1,
    metalness: 0,
    transparent: true,
    opacity: 0.04,
    depthWrite: false,
  });

  const doors = [];
  const seatHosts = [];
  const semanticObjects = [];

  exportRoot.traverse((object) => {
    if (object.userData.robloxDoor) semanticObjects.push({ type: 'door', object });
    if (object.userData.robloxSeatHost) semanticObjects.push({ type: 'seat', object });
  });

  semanticObjects.forEach(({ type, object }) => {
    if (type === 'door') {
      const metadata = object.userData.robloxDoor;
      const id = sanitizeName(metadata.id, 'door');
      const visualPrefix = sanitizeName(`door-${id}`, 'door');
      const closedMarker = `RBX_DOOR_CLOSED__${id}`;
      const openMarker = `RBX_DOOR_OPEN__${id}`;

      object.rotation.y = metadata.closedRotation;
      object.add(
        createInteractionMarker(
          closedMarker,
          markerMaterial,
          [0, 1.03, 0],
          [MARKER_SIZE, MARKER_SIZE, MARKER_SIZE],
        ),
      );
      object.add(
        createInteractionMarker(
          openMarker,
          markerMaterial,
          [0, 1.03, 0],
          [MARKER_SIZE, MARKER_SIZE, MARKER_SIZE],
          metadata.openRotation - metadata.closedRotation,
        ),
      );

      doors.push({
        id,
        label: metadata.label || 'Puerta',
        visualPrefix,
        closedMarker,
        openMarker,
        openByDefault: Boolean(metadata.openByDefault),
      });
      return;
    }

    const metadata = object.userData.robloxSeatHost;
    const hostId = sanitizeName(metadata.id, 'seat');
    const visualPrefix = sanitizeName(`seat-${hostId}`, 'seat');
    const seats = (metadata.seats || []).map((seat, index) => {
      const id = sanitizeName(seat.id, `${hostId}-${index + 1}`);
      const marker = `RBX_SEAT__${id}`;
      object.add(
        createInteractionMarker(
          marker,
          markerMaterial,
          seat.position || [0, 0.5, 0],
          seat.size || [0.4, 0.08, 0.4],
          seat.rotationY || 0,
        ),
      );
      return {
        id,
        label: seat.label || metadata.label || 'Asiento',
        marker,
      };
    });

    seatHosts.push({
      id: hostId,
      label: metadata.label || 'Asiento',
      visualPrefix,
      seats,
    });
  });

  exportRoot.updateMatrixWorld(true);
  return {
    version: 1,
    doors,
    seatHosts,
    doorCount: doors.length,
    seatCount: seatHosts.reduce((total, host) => total + host.seats.length, 0),
  };
}

function exportCategoryForObject(object, exportRoot) {
  let parent = object.parent;
  while (parent && parent !== exportRoot) {
    if (parent.userData.robloxDoor?.id) {
      return sanitizeName(`door-${parent.userData.robloxDoor.id}`, 'door');
    }
    if (parent.userData.robloxSeatHost?.id) {
      return sanitizeName(`seat-${parent.userData.robloxSeatHost.id}`, 'seat');
    }
    if (['walls', 'furniture', 'roof'].includes(parent.name)) return parent.name;
    parent = parent.parent;
  }
  return 'building';
}

function createRobloxExportRoot(sourceRoot) {
  const exportRoot = sourceRoot.clone(true);
  exportRoot.name = PACKAGE_BASENAME;

  exportRoot.getObjectByName('labels')?.removeFromParent();
  const interactions = addRobloxInteractionMarkers(exportRoot);

  const materialCache = new Map();
  const usedNames = new Set();
  let meshIndex = 0;
  let visibleMeshCount = 0;
  let markerCount = 0;

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
    if (object.userData.robloxMarker) {
      markerCount += 1;
      object.name = object.userData.robloxMarkerName;
    } else {
      visibleMeshCount += 1;
      const categoryName = exportCategoryForObject(object, exportRoot);
      const baseName = sanitizeName(object.name, 'mesh');
      let candidate = `${categoryName}_${baseName}_${String(meshIndex).padStart(3, '0')}`;
      let suffix = 2;
      while (usedNames.has(candidate)) {
        candidate = `${categoryName}_${baseName}_${String(meshIndex).padStart(3, '0')}_${suffix}`;
        suffix += 1;
      }
      usedNames.add(candidate);
      object.name = candidate;
    }

    object.material = Array.isArray(object.material)
      ? object.material.map(convertedMaterial)
      : convertedMaterial(object.material);
  });

  exportRoot.updateMatrixWorld(true);
  return {
    root: exportRoot,
    meshCount: meshIndex,
    visibleMeshCount,
    markerCount,
    materialCount: materialCache.size,
    interactions,
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

function luaString(value) {
  return JSON.stringify(String(value));
}

function luaBoolean(value) {
  return value ? 'true' : 'false';
}

function doorTableToLua(doors) {
  return doors
    .map(
      (door) => `\t{ id = ${luaString(door.id)}, label = ${luaString(door.label)}, visualPrefix = ${luaString(
        door.visualPrefix,
      )}, closedMarker = ${luaString(door.closedMarker)}, openMarker = ${luaString(
        door.openMarker,
      )}, openByDefault = ${luaBoolean(door.openByDefault)} },`,
    )
    .join('\n');
}

function seatHostsToLua(seatHosts) {
  return seatHosts
    .map((host) => {
      const seats = host.seats
        .map(
          (seat) =>
            `\t\t{ id = ${luaString(seat.id)}, label = ${luaString(seat.label)}, marker = ${luaString(
              seat.marker,
            )} },`,
        )
        .join('\n');
      return `\t{\n\t\tid = ${luaString(host.id)},\n\t\tlabel = ${luaString(
        host.label,
      )},\n\t\tvisualPrefix = ${luaString(host.visualPrefix)},\n\t\tseats = {\n${seats}\n\t\t},\n\t},`;
    })
    .join('\n');
}

function buildRuntimeScriptSource() {
  return `local TweenService = game:GetService("TweenService")

local interactions = script.Parent

local function bindDoor(pivot)
\tlocal prompt = pivot:FindFirstChildOfClass("ProximityPrompt")
\tlocal closedValue = pivot:FindFirstChild("ClosedCFrame")
\tlocal openValue = pivot:FindFirstChild("OpenCFrame")
\tif not prompt or not closedValue or not openValue then
\t\twarn("Generated door is missing prompt or CFrame values:", pivot:GetFullName())
\t\treturn
\tend

\tlocal busy = false
\tlocal function refreshPrompt()
\t\tprompt.ActionText = pivot:GetAttribute("IsOpen") and "Cerrar" or "Abrir"
\tend
\trefreshPrompt()

\tprompt.Triggered:Connect(function()
\t\tif busy then return end
\t\tbusy = true
\t\tlocal opening = not pivot:GetAttribute("IsOpen")
\t\tpivot:SetAttribute("IsOpen", opening)
\t\trefreshPrompt()
\t\tprompt.Enabled = false

\t\tlocal target = opening and openValue.Value or closedValue.Value
\t\tlocal tween = TweenService:Create(
\t\t\tpivot,
\t\t\tTweenInfo.new(0.55, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
\t\t\t{ CFrame = target }
\t\t)
\t\ttween:Play()
\t\ttween.Completed:Once(function()
\t\t\tbusy = false
\t\t\tprompt.Enabled = true
\t\tend)
\tend)
end

local function bindSeat(seat)
\tlocal prompt = seat:FindFirstChildOfClass("ProximityPrompt")
\tif not prompt then return end

\tlocal function refreshPrompt()
\t\tprompt.Enabled = seat.Occupant == nil
\tend
\trefreshPrompt()
\tseat:GetPropertyChangedSignal("Occupant"):Connect(refreshPrompt)

\tprompt.Triggered:Connect(function(player)
\t\tif seat.Occupant then return end
\t\tlocal character = player.Character
\t\tlocal humanoid = character and character:FindFirstChildOfClass("Humanoid")
\t\tif humanoid then seat:Sit(humanoid) end
\tend)
end

for _, descendant in ipairs(interactions:GetDescendants()) do
\tif descendant:IsA("BasePart") and descendant:GetAttribute("GeneratedDoorPivot") then
\t\tbindDoor(descendant)
\telseif descendant:IsA("Seat") and descendant:GetAttribute("GeneratedSeat") then
\t\tbindSeat(descendant)
\tend
end
`;
}

function buildInstallerScriptSource(interactions) {
  const runtimeSource = buildRuntimeScriptSource();
  return `-- Generated by Casa Patio. Run this entire file in Roblox Studio's Command Bar after importing the .gltf.
local Selection = game:GetService("Selection")

local DOORS = {
${doorTableToLua(interactions.doors)}
}

local SEAT_HOSTS = {
${seatHostsToLua(interactions.seatHosts)}
}

local RUNTIME_SOURCE = [==[
${runtimeSource}]==]

local selected = Selection:Get()
assert(#selected == 1, "Selecciona exactamente el Model importado de la casa en Explorer antes de ejecutar este instalador.")
local root = selected[1]
assert(not root:GetAttribute("RobloxInteractionsInstalled"), "Las interacciones ya fueron instaladas en este modelo.")

local function startsWith(value, prefix)
\treturn string.sub(value, 1, #prefix) == prefix
end

local function findNamed(name)
\tfor _, descendant in ipairs(root:GetDescendants()) do
\t\tif descendant.Name == name then return descendant end
\tend
\treturn nil
end

local function collectVisualParts(prefix)
\tlocal parts = {}
\tlocal expectedPrefix = prefix .. "_"
\tfor _, descendant in ipairs(root:GetDescendants()) do
\t\tif descendant:IsA("BasePart") and startsWith(descendant.Name, expectedPrefix) then
\t\t\ttable.insert(parts, descendant)
\t\tend
\tend
\treturn parts
end

local interactionsFolder = Instance.new("Folder")
interactionsFolder.Name = "GeneratedRobloxInteractions"
interactionsFolder.Parent = root

local installedDoors = 0
for _, definition in ipairs(DOORS) do
\tlocal closedMarker = findNamed(definition.closedMarker)
\tlocal openMarker = findNamed(definition.openMarker)
\tlocal visualParts = collectVisualParts(definition.visualPrefix)

\tif not closedMarker or not openMarker or #visualParts == 0 then
\t\twarn("No se pudo instalar la puerta", definition.id, "markers:", closedMarker, openMarker, "parts:", #visualParts)
\telse
\t\tlocal closedCFrame = closedMarker.CFrame
\t\tlocal openCFrame = openMarker.CFrame
\t\tclosedMarker:Destroy()
\t\topenMarker:Destroy()

\t\tlocal doorModel = Instance.new("Model")
\t\tdoorModel.Name = "Door_" .. definition.id
\t\tdoorModel.Parent = interactionsFolder

\t\tlocal pivot = Instance.new("Part")
\t\tpivot.Name = "DoorPivot"
\t\tpivot.Size = Vector3.new(0.18, 0.18, 0.18)
\t\tpivot.CFrame = closedCFrame
\t\tpivot.Transparency = 1
\t\tpivot.Anchored = true
\t\tpivot.CanCollide = false
\t\tpivot.CanTouch = false
\t\tpivot.CanQuery = false
\t\tpivot:SetAttribute("GeneratedDoorPivot", true)
\t\tpivot:SetAttribute("IsOpen", definition.openByDefault)
\t\tpivot.Parent = doorModel
\t\tdoorModel.PrimaryPart = pivot

\t\tlocal largestPart = nil
\t\tlocal largestVolume = -math.huge
\t\tfor _, part in ipairs(visualParts) do
\t\t\tlocal volume = part.Size.X * part.Size.Y * part.Size.Z
\t\t\tif volume > largestVolume then
\t\t\t\tlargestVolume = volume
\t\t\t\tlargestPart = part
\t\t\tend
\t\t\tpart.Anchored = false
\t\t\tpart.Massless = true
\t\t\tpart.CanCollide = false
\t\t\tpart.CanTouch = false
\t\t\tpart.Parent = doorModel

\t\t\tlocal weld = Instance.new("WeldConstraint")
\t\t\tweld.Part0 = pivot
\t\t\tweld.Part1 = part
\t\t\tweld.Parent = pivot
\t\tend

\t\tif largestPart then
\t\t\tlargestPart.CanCollide = true
\t\t\tpcall(function()
\t\t\t\tif largestPart:IsA("MeshPart") then largestPart.CollisionFidelity = Enum.CollisionFidelity.Box end
\t\t\tend)
\t\tend

\t\tlocal closedValue = Instance.new("CFrameValue")
\t\tclosedValue.Name = "ClosedCFrame"
\t\tclosedValue.Value = closedCFrame
\t\tclosedValue.Parent = pivot

\t\tlocal openValue = Instance.new("CFrameValue")
\t\topenValue.Name = "OpenCFrame"
\t\topenValue.Value = openCFrame
\t\topenValue.Parent = pivot

\t\tlocal prompt = Instance.new("ProximityPrompt")
\t\tprompt.Name = "DoorPrompt"
\t\tprompt.ActionText = definition.openByDefault and "Cerrar" or "Abrir"
\t\tprompt.ObjectText = definition.label
\t\tprompt.KeyboardKeyCode = Enum.KeyCode.E
\t\tprompt.GamepadKeyCode = Enum.KeyCode.ButtonX
\t\tprompt.MaxActivationDistance = 8
\t\tprompt.RequiresLineOfSight = false
\t\tprompt.HoldDuration = 0
\t\tprompt.Parent = pivot

\t\tif definition.openByDefault then pivot.CFrame = openCFrame end
\t\tinstalledDoors = installedDoors + 1
\tend
end

local installedSeats = 0
for _, host in ipairs(SEAT_HOSTS) do
\tlocal visualParts = collectVisualParts(host.visualPrefix)
\tfor _, part in ipairs(visualParts) do
\t\tpart.Anchored = true
\t\tpart.CanCollide = false
\t\tpart.CanTouch = false
\tend

\tfor _, definition in ipairs(host.seats) do
\t\tlocal marker = findNamed(definition.marker)
\t\tif not marker then
\t\t\twarn("No se encontró el marcador del asiento", definition.id)
\t\telse
\t\t\tlocal seat = Instance.new("Seat")
\t\t\tseat.Name = "Seat_" .. definition.id
\t\t\tseat.Size = marker.Size
\t\t\tseat.CFrame = marker.CFrame
\t\t\tseat.Transparency = 1
\t\t\tseat.Anchored = true
\t\t\tseat.CanCollide = true
\t\t\tseat.CanTouch = true
\t\t\tseat.Disabled = false
\t\t\tseat:SetAttribute("GeneratedSeat", true)
\t\t\tseat.Parent = interactionsFolder

\t\t\tlocal prompt = Instance.new("ProximityPrompt")
\t\t\tprompt.Name = "SitPrompt"
\t\t\tprompt.ActionText = "Sentarse"
\t\t\tprompt.ObjectText = definition.label
\t\t\tprompt.KeyboardKeyCode = Enum.KeyCode.E
\t\t\tprompt.GamepadKeyCode = Enum.KeyCode.ButtonX
\t\t\tprompt.MaxActivationDistance = 7
\t\t\tprompt.RequiresLineOfSight = false
\t\t\tprompt.HoldDuration = 0
\t\t\tprompt.Parent = seat

\t\t\tmarker:Destroy()
\t\t\tinstalledSeats = installedSeats + 1
\t\tend
\tend
end

local runtimeScript = Instance.new("Script")
runtimeScript.Name = "GeneratedInteractionsRuntime"
runtimeScript.Source = RUNTIME_SOURCE
runtimeScript.Parent = interactionsFolder

root:SetAttribute("RobloxInteractionsInstalled", true)
Selection:Set({ root })
print(string.format("Casa Patio: installed %d doors and %d seats.", installedDoors, installedSeats))
`;
}

function externalizeGltfResources(gltf, additionalFiles = {}) {
  const files = { ...additionalFiles };
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
    if (object.userData.robloxMarker) object.geometry.dispose();
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

    const installerSource = buildInstallerScriptSource(prepared.interactions);
    const runtimeSource = buildRuntimeScriptSource();
    const additionalFiles = {
      'roblox-install-command.lua': strToU8(installerSource),
      'roblox-runtime.server.lua': strToU8(runtimeSource),
      'roblox-interactions.json': strToU8(JSON.stringify(prepared.interactions, null, 2)),
    };
    const externalized = externalizeGltfResources(gltf, additionalFiles);
    if (externalized.textureCount === 0) {
      throw new Error('No se generaron mapas de color. La exportación se canceló para evitar otro modelo sin texturas.');
    }
    if (prepared.interactions.doorCount === 0 || prepared.interactions.seatCount === 0) {
      throw new Error('No se detectaron puertas o asientos semánticos para Roblox.');
    }

    const archive = zipSync(externalized.files, { level: 6 });
    return {
      fileName: `${PACKAGE_BASENAME}.zip`,
      blob: new Blob([archive], { type: 'application/zip' }),
      meshCount: prepared.meshCount,
      visibleMeshCount: prepared.visibleMeshCount,
      markerCount: prepared.markerCount,
      materialCount: prepared.materialCount,
      textureCount: externalized.textureCount,
      doorCount: prepared.interactions.doorCount,
      seatCount: prepared.interactions.seatCount,
    };
  } finally {
    disposeExportMaterials(prepared.root);
  }
}
