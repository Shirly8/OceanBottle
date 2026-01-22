import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders/glTF';

let scene, engine, camera;
let bottles = [];
let fish = [];
let turtles = [];
let corals = [];
let loadersReady = false;
let oceanBottleLogo = null;
let logoReached = false;
let infinitySymbol = null;
let logoIndicator = null;

/**
 * Check if GLTF loader is available
 */
function checkGLTFLoader() {
  // Check if the loader is registered
  if (BABYLON.SceneLoader.IsPluginForExtensionAvailable('.glb')) {
    console.log('✓ GLTF/GLB loader is available');
    return true;
  }
  
  console.error('✗ GLTF/GLB loader NOT available!');
  console.error('Please run: npm install babylonjs-loaders');
  console.error('And make sure the import is correct for your setup');
  return false;
}

/**
 * Initialize the 3D ocean scene
 */
export async function initOceanScene(canvas, dailyBottleCount) {
  const fiveYearTotal = dailyBottleCount * 365 * 5;
  const bottleCount = Math.min(Math.floor(fiveYearTotal / 10), 50);

  // Engine & Scene
  engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, antialias: true });
  scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0.15, 0.45, 0.65, 1);

  // Check if loaders are available
  loadersReady = checkGLTFLoader();

  // Camera
  camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, -2, 35), scene);
  camera.setTarget(new BABYLON.Vector3(0, -5, 0));
  camera.attachControl(canvas, true);
  camera.speed = 0.5;

  // Set cursor to move/drag style
  canvas.style.cursor = 'move';
  camera.keysUp.push(87);
  camera.keysDown.push(83);
  camera.keysLeft.push(65);
  camera.keysRight.push(68);

  // Prevent camera from going below the seafloor
  scene.registerBeforeRender(() => {
    if (camera.position.y < -14) {
      camera.position.y = -14;
    }
  });

  // Lighting - bright sunny day
  const hemiLight = new BABYLON.HemisphericLight('hemi', new BABYLON.Vector3(0, 1, 0), scene);
  hemiLight.intensity = 1.8;
  hemiLight.diffuse = new BABYLON.Color3(1, 0.98, 0.95);
  hemiLight.groundColor = new BABYLON.Color3(0.3, 0.5, 0.7);

  const sunLight = new BABYLON.DirectionalLight('sun', new BABYLON.Vector3(-0.3, -1, -0.2), scene);
  sunLight.intensity = 1.5;
  sunLight.diffuse = new BABYLON.Color3(1, 0.95, 0.85);

  const pointLight1 = new BABYLON.PointLight('p1', new BABYLON.Vector3(15, 8, 15), scene);
  pointLight1.intensity = 0.6;
  pointLight1.diffuse = new BABYLON.Color3(0.7, 0.9, 1);

  const pointLight2 = new BABYLON.PointLight('p2', new BABYLON.Vector3(-15, 5, -15), scene);
  pointLight2.intensity = 0.5;
  pointLight2.diffuse = new BABYLON.Color3(0.5, 0.8, 1);

  // Environment
  createWaterSurface(scene);
  createSeafloor(scene);
  createSeaweed(scene, 20);
  createBubbles(scene);
  createSkybox(scene);
  createSunRays(scene);

  // Load 3D models
  console.log('Loading 3D models...');
  await loadAllModels(scene, bottleCount);

  // Fog - lighter for sunny day
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  scene.fogColor = new BABYLON.Color3(0.2, 0.5, 0.7);
  scene.fogDensity = 0.008;

  window.addEventListener('resize', () => engine.resize());

  engine.runRenderLoop(() => {
    updateAnimations();
    scene.render();
  });

  return { bottleCount: bottles.length, fiveYearTotal };
}

/**
 * Load GLB model - preserves original materials
 */
async function loadGLB(filename, scene) {
  if (!loadersReady) {
    console.warn(`Skipping ${filename} - GLTF loader not available`);
    return null;
  }

  // Try different path formats
  const paths = [
    '/3D-Models/',
    '/public/3D-Models/',
    '3D-Models/',
    './3D-Models/',
  ];

  for (const basePath of paths) {
    try {
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        '',
        basePath,
        filename,
        scene
      );

      // Create parent node
      const root = new BABYLON.TransformNode(`${filename}_root`, scene);

      // Parent meshes WITHOUT changing materials
      result.meshes.forEach((mesh) => {
        if (mesh.name === '__root__') {
          mesh.parent = root;
        }
      });

      console.log(`✓ Loaded ${filename} from ${basePath}`);
      return root;
    } catch (e) {
      // Try next path
    }
  }

  console.warn(`✗ Could not load ${filename}`);
  return null;
}

/**
 * Load all models
 */
async function loadAllModels(scene, bottleCount) {
  // Load corals (more corals, positioned lower)
  for (let i = 0; i < 12; i++) {
    const coral = await loadGLB('coral.glb', scene);
    if (coral) {
      coral.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 90,
        -15.5,
        (Math.random() - 0.5) * 90
      );
      coral.scaling = new BABYLON.Vector3(3, 3, 3);
      coral.rotation.y = Math.random() * Math.PI * 2;
      corals.push(coral);
    } else {
      createFallbackCoral(scene, i);
    }
  }

  // Load bottles
  const bottleFiles = ['waterbottle.glb', 'waterbottle2.glb', 'waterbottle3.glb'];
  for (let i = 0; i < bottleCount; i++) {
    const filename = bottleFiles[i % bottleFiles.length];
    const bottle = await loadGLB(filename, scene);

    if (bottle) {
      setupBottle(bottle, i);
    } else {
      const fallback = createFallbackBottle(scene, i);
      setupBottle(fallback, i);
    }
  }

  // Load fish (using all fish models)
  const fishFiles = ['fish.glb', 'fish2.glb', 'fish3.glb', 'fish4.glb'];
  for (let i = 0; i < 15; i++) {
    const filename = fishFiles[i % fishFiles.length];
    const fishModel = await loadGLB(filename, scene);
    if (fishModel) {
      setupFish(fishModel, i);
    } else {
      const fallback = createFallbackFish(scene, i);
      setupFish(fallback, i);
    }
  }

  // Load turtles (only 2, smaller)
  for (let i = 0; i < 2; i++) {
    const turtle = await loadGLB('sea_turtle.glb', scene);
    if (turtle) {
      setupTurtle(turtle, i);
    } else {
      const fallback = createFallbackTurtle(scene, i);
      setupTurtle(fallback, i);
    }
  }
}

function setupBottle(bottle, i) {
  bottle.position = new BABYLON.Vector3(
    (Math.random() - 0.5) * 50,
    -10 + Math.random() * 18,
    (Math.random() - 0.5) * 50
  );
  bottle.scaling = new BABYLON.Vector3(0.8, 0.8, 0.8);
  bottle.rotation = new BABYLON.Vector3(
    Math.random() * Math.PI,
    Math.random() * Math.PI * 2,
    Math.random() * Math.PI
  );

  bottles.push({
    mesh: bottle,
    basePos: bottle.position.clone(),
    time: Math.random() * Math.PI * 2,
    speed: 0.15 + Math.random() * 0.25,
    rotSpeed: new BABYLON.Vector3(
      (Math.random() - 0.5) * 0.008,
      (Math.random() - 0.5) * 0.008,
      (Math.random() - 0.5) * 0.008
    ),
  });
}

function setupFish(fishMesh, i) {
  fishMesh.scaling = new BABYLON.Vector3(0.4, 0.4, 0.4);
  const baseY = -8 + Math.random() * 12;
  fishMesh.position.y = baseY;

  fish.push({
    mesh: fishMesh,
    time: Math.random() * Math.PI * 2,
    speed: 0.25 + Math.random() * 0.35,
    radius: 12 + Math.random() * 18,
    dir: Math.random() > 0.5 ? 1 : -1,
    baseY: baseY,
  });
}

function setupTurtle(turtleMesh, i) {
  turtleMesh.scaling = new BABYLON.Vector3(0.15, 0.15, 0.15);
  const baseY = -6 + Math.random() * 10;
  turtleMesh.position.y = baseY;

  turtles.push({
    mesh: turtleMesh,
    time: Math.random() * Math.PI * 2,
    speed: 0.1 + Math.random() * 0.15,
    radius: 18 + Math.random() * 15,
    dir: Math.random() > 0.5 ? 1 : -1,
    baseY: baseY,
  });
}

// ============ FALLBACK SHAPES ============

function createFallbackCoral(scene, i) {
  const colors = [
    new BABYLON.Color3(1, 0.4, 0.6),
    new BABYLON.Color3(0.6, 0.3, 0.8),
    new BABYLON.Color3(1, 0.6, 0.2),
    new BABYLON.Color3(0.3, 0.8, 0.7),
  ];

  const coral = BABYLON.MeshBuilder.CreateCylinder(`coral_fb_${i}`, {
    height: 3 + Math.random() * 3,
    diameterTop: 0.3,
    diameterBottom: 0.8 + Math.random() * 0.5,
    tessellation: 8,
  }, scene);

  coral.position = new BABYLON.Vector3(
    (Math.random() - 0.5) * 90,
    -15,
    (Math.random() - 0.5) * 90
  );

  const mat = new BABYLON.StandardMaterial(`coral_mat_${i}`, scene);
  mat.diffuseColor = colors[i % colors.length];
  mat.emissiveColor = colors[i % colors.length].scale(0.2);
  coral.material = mat;

  corals.push({ mesh: coral });
}

function createFallbackBottle(scene, i) {
  const bottle = new BABYLON.TransformNode(`bottle_fb_${i}`, scene);

  const body = BABYLON.MeshBuilder.CreateCylinder(`body_${i}`, {
    height: 1.8,
    diameterTop: 0.35,
    diameterBottom: 0.45,
    tessellation: 12,
  }, scene);
  body.parent = bottle;

  const neck = BABYLON.MeshBuilder.CreateCylinder(`neck_${i}`, {
    height: 0.3,
    diameter: 0.2,
    tessellation: 12,
  }, scene);
  neck.position.y = 1.05;
  neck.parent = bottle;

  const cap = BABYLON.MeshBuilder.CreateCylinder(`cap_${i}`, {
    height: 0.15,
    diameter: 0.25,
    tessellation: 12,
  }, scene);
  cap.position.y = 1.25;
  cap.parent = bottle;

  const colors = [
    new BABYLON.Color3(0.2, 0.7, 0.9),
    new BABYLON.Color3(0.3, 0.9, 0.4),
    new BABYLON.Color3(0.9, 0.9, 0.95),
  ];

  const bodyMat = new BABYLON.StandardMaterial(`bmat_${i}`, scene);
  bodyMat.diffuseColor = colors[i % colors.length];
  bodyMat.alpha = 0.7;
  bodyMat.specularColor = new BABYLON.Color3(1, 1, 1);
  bodyMat.specularPower = 64;
  body.material = bodyMat;
  neck.material = bodyMat;

  const capMat = new BABYLON.StandardMaterial(`cmat_${i}`, scene);
  capMat.diffuseColor = new BABYLON.Color3(0.2, 0.4, 0.8);
  cap.material = capMat;

  return bottle;
}

function createFallbackFish(scene, i) {
  const fishNode = new BABYLON.TransformNode(`fish_fb_${i}`, scene);

  const body = BABYLON.MeshBuilder.CreateSphere(`fbody_${i}`, { diameter: 1, segments: 12 }, scene);
  body.scaling = new BABYLON.Vector3(1.6, 0.7, 0.5);
  body.parent = fishNode;

  const tail = BABYLON.MeshBuilder.CreateDisc(`ftail_${i}`, { radius: 0.4, tessellation: 3 }, scene);
  tail.position.x = -0.9;
  tail.rotation.y = Math.PI / 2;
  tail.parent = fishNode;

  const colors = [
    new BABYLON.Color3(1, 0.8, 0.1),
    new BABYLON.Color3(1, 0.4, 0.2),
    new BABYLON.Color3(0.3, 0.7, 1),
    new BABYLON.Color3(0.9, 0.3, 0.6),
  ];

  const mat = new BABYLON.StandardMaterial(`fmat_${i}`, scene);
  mat.diffuseColor = colors[i % colors.length];
  mat.emissiveColor = colors[i % colors.length].scale(0.15);
  mat.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
  body.material = mat;
  tail.material = mat;

  return fishNode;
}

function createFallbackTurtle(scene, i) {
  const turtle = new BABYLON.TransformNode(`turtle_fb_${i}`, scene);

  const shell = BABYLON.MeshBuilder.CreateSphere(`tshell_${i}`, { diameter: 2, segments: 12 }, scene);
  shell.scaling = new BABYLON.Vector3(1.3, 0.5, 1.6);
  shell.parent = turtle;

  const head = BABYLON.MeshBuilder.CreateSphere(`thead_${i}`, { diameter: 0.5, segments: 8 }, scene);
  head.position.z = 1.3;
  head.position.y = 0.1;
  head.parent = turtle;

  const mat = new BABYLON.StandardMaterial(`tmat_${i}`, scene);
  mat.diffuseColor = new BABYLON.Color3(0.2, 0.55, 0.35);
  mat.emissiveColor = new BABYLON.Color3(0.05, 0.15, 0.08);
  shell.material = mat;
  head.material = mat;

  return turtle;
}

// ============ ENVIRONMENT ============

function createWaterSurface(scene) {
  const water = BABYLON.MeshBuilder.CreateGround('water', { width: 200, height: 200, subdivisions: 64 }, scene);
  water.position.y = 10;

  const mat = new BABYLON.StandardMaterial('waterMat', scene);
  mat.diffuseColor = new BABYLON.Color3(0.2, 0.6, 0.85);
  mat.specularColor = new BABYLON.Color3(1, 1, 1);
  mat.specularPower = 256;
  mat.alpha = 0.5;
  mat.backFaceCulling = false;

  try {
    const bumpTex = new BABYLON.Texture('https://assets.babylonjs.com/textures/waterbump.png', scene);
    bumpTex.uScale = 10;
    bumpTex.vScale = 10;
    mat.bumpTexture = bumpTex;
  } catch (e) {}

  water.material = mat;

  // Faster, more dynamic wave movement
  scene.registerBeforeRender(() => {
    if (mat.bumpTexture) {
      mat.bumpTexture.uOffset += 0.002;
      mat.bumpTexture.vOffset += 0.0015;
    }
  });
}

function createSunRays(scene) {
  // Create subtle light shafts/god rays effect
  const sunRays = new BABYLON.ParticleSystem('sunRays', 20, scene);
  sunRays.particleTexture = new BABYLON.Texture('https://assets.babylonjs.com/textures/flare.png', scene);

  sunRays.emitter = new BABYLON.Vector3(0, 8, 0);
  sunRays.minEmitBox = new BABYLON.Vector3(-20, 0, -20);
  sunRays.maxEmitBox = new BABYLON.Vector3(20, 0, 20);

  sunRays.color1 = new BABYLON.Color4(1, 0.95, 0.8, 0.03);
  sunRays.color2 = new BABYLON.Color4(0.9, 0.95, 1, 0.02);
  sunRays.colorDead = new BABYLON.Color4(1, 1, 1, 0);

  sunRays.minSize = 1.5;
  sunRays.maxSize = 4;

  sunRays.minLifeTime = 1.5;
  sunRays.maxLifeTime = 3;

  sunRays.emitRate = 3;

  sunRays.direction1 = new BABYLON.Vector3(-0.1, -1, -0.1);
  sunRays.direction2 = new BABYLON.Vector3(0.1, -1, 0.1);

  sunRays.minEmitPower = 1;
  sunRays.maxEmitPower = 2;

  sunRays.updateSpeed = 0.01;
  sunRays.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;

  sunRays.start();
}

function createSeafloor(scene) {
  const floor = BABYLON.MeshBuilder.CreateGround('floor', { width: 200, height: 200 }, scene);
  floor.position.y = -16;

  const mat = new BABYLON.StandardMaterial('floorMat', scene);
  mat.diffuseColor = new BABYLON.Color3(0.45, 0.38, 0.28);

  try {
    const sandTex = new BABYLON.Texture('https://assets.babylonjs.com/textures/sand.jpg', scene);
    sandTex.uScale = 25;
    sandTex.vScale = 25;
    mat.diffuseTexture = sandTex;
  } catch (e) {}

  floor.material = mat;
}

function createSeaweed(scene, count) {
  for (let i = 0; i < count; i++) {
    const height = 4 + Math.random() * 5;
    const seaweed = BABYLON.MeshBuilder.CreateCylinder(`seaweed_${i}`, {
      height: height,
      diameterTop: 0.05,
      diameterBottom: 0.15,
      tessellation: 6,
    }, scene);

    seaweed.position = new BABYLON.Vector3(
      (Math.random() - 0.5) * 80,
      -16 + height / 2,
      (Math.random() - 0.5) * 80
    );

    seaweed.rotation.x = (Math.random() - 0.5) * 0.3;
    seaweed.rotation.z = (Math.random() - 0.5) * 0.3;

    const mat = new BABYLON.StandardMaterial(`swmat_${i}`, scene);
    mat.diffuseColor = new BABYLON.Color3(0.1, 0.5 + Math.random() * 0.3, 0.2);
    mat.emissiveColor = new BABYLON.Color3(0.02, 0.1, 0.03);
    seaweed.material = mat;
  }
}

function createBubbles(scene) {
  const bubbleSystem = new BABYLON.ParticleSystem('bubbles', 100, scene);
  bubbleSystem.particleTexture = new BABYLON.Texture('https://assets.babylonjs.com/textures/flare.png', scene);

  bubbleSystem.emitter = new BABYLON.Vector3(0, -15, 0);
  bubbleSystem.minEmitBox = new BABYLON.Vector3(-40, 0, -40);
  bubbleSystem.maxEmitBox = new BABYLON.Vector3(40, 0, 40);

  bubbleSystem.color1 = new BABYLON.Color4(0.7, 0.9, 1, 0.3);
  bubbleSystem.color2 = new BABYLON.Color4(0.5, 0.8, 1, 0.2);
  bubbleSystem.colorDead = new BABYLON.Color4(0.5, 0.7, 1, 0);

  bubbleSystem.minSize = 0.1;
  bubbleSystem.maxSize = 0.4;

  bubbleSystem.minLifeTime = 4;
  bubbleSystem.maxLifeTime = 8;

  bubbleSystem.emitRate = 15;

  bubbleSystem.direction1 = new BABYLON.Vector3(-0.5, 1, -0.5);
  bubbleSystem.direction2 = new BABYLON.Vector3(0.5, 1, 0.5);

  bubbleSystem.minEmitPower = 0.5;
  bubbleSystem.maxEmitPower = 1.5;

  bubbleSystem.updateSpeed = 0.01;

  bubbleSystem.start();
}

function createSkybox(scene) {
  const skybox = BABYLON.MeshBuilder.CreateBox('skybox', { size: 400 }, scene);
  const mat = new BABYLON.StandardMaterial('skymat', scene);
  mat.backFaceCulling = false;
  mat.disableLighting = true;
  mat.emissiveColor = new BABYLON.Color3(0.15, 0.4, 0.6);
  skybox.material = mat;
  skybox.infiniteDistance = true;
}

// ============ ANIMATIONS ============

function updateAnimations() {
  // Bottles
  bottles.forEach((b) => {
    b.time += 0.008;
    b.mesh.position.x = b.basePos.x + Math.sin(b.time * b.speed) * 2.5;
    b.mesh.position.z = b.basePos.z + Math.cos(b.time * b.speed * 0.8) * 2.5;
    b.mesh.position.y = b.basePos.y + Math.sin(b.time * 0.4) * 1.2;
    b.mesh.rotation.x += b.rotSpeed.x;
    b.mesh.rotation.y += b.rotSpeed.y;
    b.mesh.rotation.z += b.rotSpeed.z;
  });

  // Fish
  fish.forEach((f) => {
    f.time += 0.01;
    const angle = f.time * f.speed * f.dir;
    f.mesh.position.x = Math.cos(angle) * f.radius;
    f.mesh.position.z = Math.sin(angle) * f.radius;
    f.mesh.position.y = f.baseY + Math.sin(f.time * 1.5) * 0.8;
    f.mesh.rotation.y = angle + (f.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
  });

  // Turtles
  turtles.forEach((t) => {
    t.time += 0.005;
    const angle = t.time * t.speed * t.dir;
    t.mesh.position.x = Math.cos(angle) * t.radius;
    t.mesh.position.z = Math.sin(angle) * t.radius;
    t.mesh.position.y = t.baseY + Math.sin(t.time * 0.8) * 0.5;
    t.mesh.rotation.y = angle + (t.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
  });
}

// ============ CLEANUP ============

export function disposeOceanScene() {
  if (scene) scene.dispose();
  if (engine) engine.dispose();
  bottles = [];
  fish = [];
  turtles = [];
  corals = [];
}

export function getBottleCount() {
  return bottles.length;
}

export function hideBottles() {
  return new Promise((resolve) => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < bottles.length) {
        const b = bottles[index];
        if (b.mesh) {
          // Fade out by disabling the mesh
          b.mesh.setEnabled(false);
        }
        index++;
      } else {
        clearInterval(interval);
        resolve();
      }
    }, 200); // 200ms between each bottle disappearing (faster)
  });
}

export async function spawnOceanBottleLogo() {
  // Load oceanbottle.glb centered and VERTICAL (stationary)
  try {
    const result = await BABYLON.SceneLoader.ImportMeshAsync(
      '',
      '/3D-Models/',
      'oceanbottle.glb',
      scene
    );

    oceanBottleLogo = new BABYLON.TransformNode('ocean_bottle_logo', scene);
    result.meshes.forEach((mesh) => {
      mesh.parent = oceanBottleLogo;
    });

    // Position at center, stand upright (no rotation animation)
    oceanBottleLogo.position = new BABYLON.Vector3(0, -2, 0);
    oceanBottleLogo.scaling = new BABYLON.Vector3(3, 3, 3);
    oceanBottleLogo.rotation.z = 0;
    oceanBottleLogo.rotation.x = -Math.PI / 2; // Rotate -90 degrees around X axis to stand upright (flipped)
    oceanBottleLogo.rotation.y = 0;

    // Add subtle glow layer
    const glow = new BABYLON.GlowLayer('glow', scene);
    glow.intensity = 1;
    result.meshes.forEach((mesh) => {
      glow.addIncludedOnlyMesh(mesh);
    });

    // Add subtle indicator ring around logo
    logoIndicator = createLogoIndicator(oceanBottleLogo);

    // Create infinity label on top of waterbottle
    infinitySymbol = createInfinityLabel(oceanBottleLogo);

    return oceanBottleLogo;
  } catch (e) {
    console.warn('Could not load oceanbottle.glb', e);
    return null;
  }
}

function createLogoIndicator(logo) {
  // Subtle rotating ring indicator around the logo
  const indicatorRing = BABYLON.MeshBuilder.CreateTorus('indicatorRing',
    { diameter: 6, thickness: 0.15, tessellation: 32 }, scene);

  indicatorRing.position = logo.position.clone();

  const indicatorMat = new BABYLON.StandardMaterial('indicatorMat', scene);
  indicatorMat.emissiveColor = new BABYLON.Color3(0.2, 0.8, 1);
  indicatorMat.alpha = 0.6;
  indicatorRing.material = indicatorMat;

  // Add glow to indicator
  const indicatorGlow = new BABYLON.GlowLayer('indicatorGlow', scene);
  indicatorGlow.intensity = 1.2;
  indicatorGlow.addIncludedOnlyMesh(indicatorRing);

  // Slow rotation
  scene.registerBeforeRender(() => {
    indicatorRing.rotation.x += 0.003;
  });

  return indicatorRing;
}

function createInfinityLabel(logo) {
  // Create infinity symbol using torus shapes, positioned closer to the waterbottle
  const infinityGroup = new BABYLON.TransformNode('infinity_label', scene);

  // Position closer to the waterbottle (moved from y=6 to y=3)
  infinityGroup.position = new BABYLON.Vector3(0, 6, 0);

  // Create infinity symbol using two circles
  const circle1 = BABYLON.MeshBuilder.CreateTorus('infinity_circle1',
    { diameter: 1.5, thickness: 0.15, tessellation: 32 }, scene);
  circle1.position.x = -0.8;
  circle1.parent = infinityGroup;

  const circle2 = BABYLON.MeshBuilder.CreateTorus('infinity_circle2',
    { diameter: 1.5, thickness: 0.15, tessellation: 32 }, scene);
  circle2.position.x = 0.8;
  circle2.parent = infinityGroup;

  // Material with cyan glow
  const infinityMat = new BABYLON.StandardMaterial('infinityLabelMat', scene);
  infinityMat.emissiveColor = new BABYLON.Color3(0.2, 0.8, 1);
  infinityMat.specularColor = new BABYLON.Color3(1, 1, 1);
  circle1.material = infinityMat;
  circle2.material = infinityMat;

  // Add glow layer
  const infinityGlow = new BABYLON.GlowLayer('infinityLabelGlow', scene);
  infinityGlow.intensity = 1.8;
  infinityGlow.addIncludedOnlyMesh(circle1);
  infinityGlow.addIncludedOnlyMesh(circle2);

  // Slow rotation for visual interest
  scene.registerBeforeRender(() => {
    infinityGroup.rotation.z += 0.003;
  });

  return infinityGroup;
}


export function checkCameraProximity() {
  if (!oceanBottleLogo) return false;

  const distance = BABYLON.Vector3.Distance(camera.position, oceanBottleLogo.position);
  return distance < 15; // Proximity threshold
}

export async function fadeOutLogo() {
  // Fade out the ocean bottle logo and infinity symbol
  return new Promise((resolve) => {
    const duration = 800; // 800ms fade duration
    const startTime = Date.now();

    const fadeInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (oceanBottleLogo) {
        // Fade out main logo meshes
        oceanBottleLogo.getChildMeshes().forEach((mesh) => {
          if (mesh.material) {
            mesh.material.alpha = 1 - progress;
          }
        });
      }

      if (infinitySymbol) {
        // Fade out infinity symbol meshes
        infinitySymbol.getChildMeshes().forEach((mesh) => {
          if (mesh.material) {
            mesh.material.alpha = 1 - progress;
          }
        });
      }

      if (logoIndicator) {
        // Fade out indicator ring
        if (logoIndicator.material) {
          logoIndicator.material.alpha = (1 - progress) * 0.6;
        }
      }

      if (progress === 1) {
        clearInterval(fadeInterval);
        // Disable all meshes at the end
        if (oceanBottleLogo) {
          oceanBottleLogo.getChildMeshes().forEach((mesh) => {
            mesh.setEnabled(false);
          });
        }
        if (infinitySymbol) {
          infinitySymbol.getChildMeshes().forEach((mesh) => {
            mesh.setEnabled(false);
          });
        }
        if (logoIndicator) {
          logoIndicator.setEnabled(false);
        }
        resolve();
      }
    }, 16); // ~60fps
  });
}

export function getOceanBottleLogo() {
  return oceanBottleLogo;
}