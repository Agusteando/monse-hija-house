import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

function circleIntersectsBox(x, z, radius, box) {
  const nearestX = Math.max(box.minX, Math.min(x, box.maxX));
  const nearestZ = Math.max(box.minZ, Math.min(z, box.maxZ));
  const dx = x - nearestX;
  const dz = z - nearestZ;
  return dx * dx + dz * dz < radius * radius;
}

export class FirstPersonController {
  constructor({
    camera,
    domElement,
    colliders,
    bounds,
    startPosition,
    getGroundHeight = () => 0,
    onLockChange,
    onInteract,
    pointerLockEnabled = true,
  }) {
    this.camera = camera;
    this.domElement = domElement;
    this.colliders = colliders;
    this.bounds = bounds;
    this.startPosition = startPosition.clone();
    this.getGroundHeight = getGroundHeight;
    this.onLockChange = onLockChange;
    this.onInteract = onInteract;
    this.pointerLockEnabled = pointerLockEnabled;

    this.enabled = false;
    this.locked = false;
    this.velocity = new THREE.Vector3();
    this.moveInput = new THREE.Vector2();
    this.externalMoveInput = new THREE.Vector2();
    this.yaw = Math.PI - 0.18;
    this.pitch = -0.05;
    this.eyeHeight = 1.68;
    this.playerRadius = 0.18;
    this.canJump = true;
    this.keys = new Set();

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onPointerLockChange = this.onPointerLockChange.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onCanvasClick = this.onCanvasClick.bind(this);

    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('pointerlockchange', this.onPointerLockChange);
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    window.addEventListener('keyup', this.onKeyUp);
    this.domElement.addEventListener('click', this.onCanvasClick);
  }

  start() {
    this.enabled = true;
    this.camera.position.copy(this.startPosition);
    this.yaw = Math.PI - 0.18;
    this.pitch = -0.03;
    this.velocity.set(0, 0, 0);
    this.keys.clear();
    this.externalMoveInput.set(0, 0);
    this.canJump = true;
    this.updateCameraRotation();
    if (this.pointerLockEnabled) this.requestLock();
  }

  stop() {
    this.enabled = false;
    this.velocity.set(0, 0, 0);
    this.keys.clear();
    this.externalMoveInput.set(0, 0);
    if (document.pointerLockElement === this.domElement) {
      document.exitPointerLock();
    }
  }

  requestLock() {
    if (
      this.pointerLockEnabled &&
      this.enabled &&
      document.pointerLockElement !== this.domElement
    ) {
      this.domElement.requestPointerLock?.();
    }
  }

  onCanvasClick() {
    if (this.pointerLockEnabled && this.enabled && !this.locked) this.requestLock();
  }

  onPointerLockChange() {
    this.locked = this.pointerLockEnabled && document.pointerLockElement === this.domElement;
    this.onLockChange?.(this.locked);
  }

  applyLookDelta(deltaX, deltaY, sensitivity = 0.0021) {
    if (!this.enabled) return;
    this.yaw -= deltaX * sensitivity;
    this.pitch -= deltaY * sensitivity;
    this.pitch = THREE.MathUtils.clamp(
      this.pitch,
      -Math.PI / 2 + 0.08,
      Math.PI / 2 - 0.08,
    );
    this.updateCameraRotation();
  }

  onMouseMove(event) {
    if (!this.enabled || !this.locked) return;
    this.applyLookDelta(event.movementX, event.movementY, 0.0021);
  }

  setMoveInput(strafe, forward) {
    this.externalMoveInput.set(
      THREE.MathUtils.clamp(strafe, -1, 1),
      THREE.MathUtils.clamp(forward, -1, 1),
    );
    if (this.externalMoveInput.lengthSq() > 1) this.externalMoveInput.normalize();
  }

  clearMoveInput() {
    this.externalMoveInput.set(0, 0);
  }

  jump() {
    if (!this.enabled || !this.canJump) return;
    this.velocity.y = 4.8;
    this.canJump = false;
  }

  interact() {
    if (this.enabled) this.onInteract?.();
  }

  onKeyDown(event) {
    if (!this.enabled) return;
    const movementKeys = [
      'KeyW',
      'KeyA',
      'KeyS',
      'KeyD',
      'ArrowUp',
      'ArrowLeft',
      'ArrowDown',
      'ArrowRight',
      'Space',
      'KeyE',
    ];
    if (movementKeys.includes(event.code)) event.preventDefault();
    this.keys.add(event.code);
    if (event.code === 'Space' && !event.repeat) this.jump();
    if (event.code === 'KeyE' && !event.repeat) this.interact();
    if (event.code === 'Escape') this.stop();
  }

  onKeyUp(event) {
    this.keys.delete(event.code);
  }

  updateCameraRotation() {
    this.camera.rotation.order = 'YXZ';
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;
    this.camera.rotation.z = 0;
  }

  isBlocked(x, z, feetY = this.camera.position.y - this.eyeHeight) {
    if (
      x - this.playerRadius < this.bounds.minX ||
      x + this.playerRadius > this.bounds.maxX ||
      z - this.playerRadius < this.bounds.minZ ||
      z + this.playerRadius > this.bounds.maxZ
    ) {
      return true;
    }

    const headY = feetY + 1.76;
    return this.colliders.some((box) => {
      const verticalOverlap = headY > box.minY && feetY < box.maxY;
      return verticalOverlap && circleIntersectsBox(x, z, this.playerRadius, box);
    });
  }

  tryMoveAxis(axis, amount) {
    const currentFeet = this.camera.position.y - this.eyeHeight;
    const nextX = axis === 'x' ? this.camera.position.x + amount : this.camera.position.x;
    const nextZ = axis === 'z' ? this.camera.position.z + amount : this.camera.position.z;
    const currentGround = this.getGroundHeight(this.camera.position.x, this.camera.position.z);
    const nextGround = this.getGroundHeight(nextX, nextZ);
    const stepUp = nextGround - Math.max(currentFeet, currentGround);

    if (stepUp > 0.34 || this.isBlocked(nextX, nextZ, Math.max(currentFeet, nextGround))) return;

    this.camera.position[axis] += amount;
    if (this.canJump && nextGround > currentFeet - 0.08) {
      this.camera.position.y = nextGround + this.eyeHeight;
      this.velocity.y = Math.max(0, this.velocity.y);
    }
  }

  moveWithCollisions(dx, dz) {
    this.tryMoveAxis('x', dx);
    this.tryMoveAxis('z', dz);
  }

  update(delta) {
    if (!this.enabled) return;

    const keyboardForward =
      (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0) -
      (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0);
    const keyboardStrafe =
      (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) -
      (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);

    this.moveInput.set(
      THREE.MathUtils.clamp(keyboardStrafe + this.externalMoveInput.x, -1, 1),
      THREE.MathUtils.clamp(keyboardForward + this.externalMoveInput.y, -1, 1),
    );
    if (this.moveInput.lengthSq() > 1) this.moveInput.normalize();

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(UP, this.yaw);
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(UP, this.yaw);
    const direction = forward
      .multiplyScalar(this.moveInput.y)
      .add(right.multiplyScalar(this.moveInput.x));
    if (direction.lengthSq() > 0) direction.normalize();

    const runMultiplier = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? 1.45 : 1;
    const speed = 2.25 * runMultiplier;
    this.velocity.x = THREE.MathUtils.damp(this.velocity.x, direction.x * speed, 13, delta);
    this.velocity.z = THREE.MathUtils.damp(this.velocity.z, direction.z * speed, 13, delta);
    this.velocity.y -= 12.5 * delta;

    this.moveWithCollisions(this.velocity.x * delta, this.velocity.z * delta);
    this.camera.position.y += this.velocity.y * delta;

    const ground = this.getGroundHeight(this.camera.position.x, this.camera.position.z);
    const groundEyeY = ground + this.eyeHeight;
    if (this.camera.position.y <= groundEyeY) {
      this.camera.position.y = groundEyeY;
      this.velocity.y = 0;
      this.canJump = true;
    }
  }

  dispose() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('pointerlockchange', this.onPointerLockChange);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.domElement.removeEventListener('click', this.onCanvasClick);
  }
}
