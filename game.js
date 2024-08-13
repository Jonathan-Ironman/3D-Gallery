import { blockTypes } from './blockTypes.js';
import { levels } from './levels.js';

export class Game {
  constructor() {
    this.TILE_SIZE = 64;
    this.PLAYER_RADIUS = 20;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.textureLoader = new THREE.TextureLoader();
    this.textures = {};
    this.currentLevel = null;
  }

  init() {
    this.setupScene();
    this.loadTextures();
    this.loadLevel('starter-dungeon');
    this.setupLighting();
    this.setupControls();
    this.setupEventListeners();
  }

  setupScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    const canvas = document.getElementById('gameCanvas');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
  }

  loadTextures() {
    for (const [key, block] of Object.entries(blockTypes)) {
      if (block.wallTexture) {
        this.textures[`${key}_wall`] = this.textureLoader.load(
          block.wallTexture
        );
      }
      if (block.floorTexture) {
        this.textures[`${key}_floor`] = this.textureLoader.load(
          block.floorTexture
        );
      }
      if (block.ceilingTexture) {
        this.textures[`${key}_ceiling`] = this.textureLoader.load(
          block.ceilingTexture
        );
      }
    }
  }

  loadLevel(levelId) {
    this.currentLevel = levels[levelId];
    if (!this.currentLevel) {
      console.error(`Level ${levelId} not found!`);
      return;
    }

    this.createMap(this.currentLevel.map);
    this.spawnPlayer(this.currentLevel.spawn);
  }

  createMap(map) {
    const floorGeometry = new THREE.PlaneGeometry(
      this.TILE_SIZE,
      this.TILE_SIZE
    );
    const ceilingGeometry = new THREE.PlaneGeometry(
      this.TILE_SIZE,
      this.TILE_SIZE
    );

    for (let y = 0; y < map.length; y++) {
      for (let x = 0; x < map[y].length; x++) {
        const blockType = blockTypes[map[y][x]];

        // Create floor tile
        const floorMaterial = new THREE.MeshStandardMaterial({
          map: this.textures[`${map[y][x]}_floor`],
        });
        const floorTile = new THREE.Mesh(floorGeometry, floorMaterial);
        floorTile.rotation.x = -Math.PI / 2;
        floorTile.position.set(
          x * this.TILE_SIZE + this.TILE_SIZE / 2,
          0,
          y * this.TILE_SIZE + this.TILE_SIZE / 2
        );
        this.scene.add(floorTile);

        // Create ceiling tile
        const ceilingMaterial = new THREE.MeshStandardMaterial({
          map: this.textures[`${map[y][x]}_ceiling`],
        });
        const ceilingTile = new THREE.Mesh(ceilingGeometry, ceilingMaterial);
        ceilingTile.rotation.x = Math.PI / 2;
        ceilingTile.position.set(
          x * this.TILE_SIZE + this.TILE_SIZE / 2,
          this.TILE_SIZE,
          y * this.TILE_SIZE + this.TILE_SIZE / 2
        );
        this.scene.add(ceilingTile);

        // Create wall if it's a wall tile
        if (blockType.isWall) {
          const geometry = new THREE.BoxGeometry(
            this.TILE_SIZE,
            this.TILE_SIZE,
            this.TILE_SIZE
          );
          const material = new THREE.MeshStandardMaterial({
            map: this.textures[`${map[y][x]}_wall`],
          });
          const cube = new THREE.Mesh(geometry, material);
          cube.position.set(
            x * this.TILE_SIZE + this.TILE_SIZE / 2,
            this.TILE_SIZE / 2,
            y * this.TILE_SIZE + this.TILE_SIZE / 2
          );
          this.scene.add(cube);
        }
      }
    }
  }

  spawnPlayer(spawn) {
    this.camera.position.set(
      spawn.x * this.TILE_SIZE + this.TILE_SIZE / 2,
      this.TILE_SIZE * 0.5,
      spawn.y * this.TILE_SIZE + this.TILE_SIZE / 2
    );

    switch (spawn.facing) {
      case 'north':
        this.camera.rotation.y = -Math.PI / 2;
        break;
      case 'east':
        this.camera.rotation.y = 0;
        break;
      case 'south':
        this.camera.rotation.y = Math.PI / 2;
        break;
      case 'west':
        this.camera.rotation.y = Math.PI;
        break;
    }
  }

  setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  setupControls() {
    this.controls = new THREE.PointerLockControls(
      this.camera,
      this.renderer.domElement
    );
    this.scene.add(this.controls.getObject());
  }

  setupEventListeners() {
    document.addEventListener('click', () => {
      this.controls.lock();
    });

    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'KeyW':
        this.moveForward = true;
        break;
      case 'KeyS':
        this.moveBackward = true;
        break;
      case 'KeyA':
        this.moveLeft = true;
        break;
      case 'KeyD':
        this.moveRight = true;
        break;
    }
  }

  onKeyUp(event) {
    switch (event.code) {
      case 'KeyW':
        this.moveForward = false;
        break;
      case 'KeyS':
        this.moveBackward = false;
        break;
      case 'KeyA':
        this.moveLeft = false;
        break;
      case 'KeyD':
        this.moveRight = false;
        break;
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  checkCollision(x, z) {
    const mapX = Math.floor(x / this.TILE_SIZE);
    const mapZ = Math.floor(z / this.TILE_SIZE);

    // Check the current tile and the 8 surrounding tiles
    for (let offsetZ = -1; offsetZ <= 1; offsetZ++) {
      for (let offsetX = -1; offsetX <= 1; offsetX++) {
        const checkX = mapX + offsetX;
        const checkZ = mapZ + offsetZ;

        if (this.isTileWall(checkX, checkZ)) {
          const wallX = checkX * this.TILE_SIZE + this.TILE_SIZE / 2;
          const wallZ = checkZ * this.TILE_SIZE + this.TILE_SIZE / 2;

          const dx = x - wallX;
          const dz = z - wallZ;
          const distance = Math.sqrt(dx * dx + dz * dz);

          if (distance < this.PLAYER_RADIUS + this.TILE_SIZE / 2) {
            return { collided: true, wallX, wallZ };
          }
        }
      }
    }

    return { collided: false };
  }

  isTileWall(x, z) {
    if (
      x >= 0 &&
      x < this.currentLevel.map[0].length &&
      z >= 0 &&
      z < this.currentLevel.map.length
    ) {
      return blockTypes[this.currentLevel.map[z][x]].isWall;
    }
    return true; // Treat out-of-bounds as walls
  }

  movePlayer(delta) {
    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;

    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    if (this.moveForward || this.moveBackward)
      this.velocity.z -= this.direction.z * 400.0 * delta;
    if (this.moveLeft || this.moveRight)
      this.velocity.x -= this.direction.x * 400.0 * delta;

    const currentPosition = this.controls.getObject().position;
    const newPositionX = currentPosition.x - this.velocity.x * delta;
    const newPositionZ = currentPosition.z - this.velocity.z * delta;

    const collisionX = this.checkCollision(newPositionX, currentPosition.z);
    const collisionZ = this.checkCollision(currentPosition.x, newPositionZ);

    if (!collisionX.collided) {
      this.controls.moveRight(-this.velocity.x * delta);
    } else {
      this.velocity.x = 0;
      this.slideAlongWall(collisionX.wallX, collisionX.wallZ, 'x', delta);
    }

    if (!collisionZ.collided) {
      this.controls.moveForward(-this.velocity.z * delta);
    } else {
      this.velocity.z = 0;
      this.slideAlongWall(collisionZ.wallX, collisionZ.wallZ, 'z', delta);
    }
  }

  slideAlongWall(wallX, wallZ, axis, delta) {
    const currentPosition = this.controls.getObject().position;
    const slideDirection = new THREE.Vector3();

    if (axis === 'x') {
      slideDirection.z = wallX > currentPosition.x ? 1 : -1;
    } else {
      slideDirection.x = wallZ > currentPosition.z ? 1 : -1;
    }

    slideDirection.normalize();

    const slideVelocity = Math.sqrt(
      this.velocity.x * this.velocity.x + this.velocity.z * this.velocity.z
    );
    const newPosition = new THREE.Vector3(
      currentPosition.x + slideDirection.x * slideVelocity * delta,
      currentPosition.y,
      currentPosition.z + slideDirection.z * slideVelocity * delta
    );

    if (!this.checkCollision(newPosition.x, newPosition.z).collided) {
      this.controls.getObject().position.copy(newPosition);
    }
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));

    if (this.controls.isLocked === true) {
      const delta = 0.016; // Assuming 60 FPS
      this.movePlayer(delta);
    }

    this.renderer.render(this.scene, this.camera);
  }
}
