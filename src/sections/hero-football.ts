// Hero football — camera-driven scroll choreography over a single Three.js
// scene. The football stays nearly motionless; the camera orbits around it
// on a sphere (radius / yaw / pitch) so each section is a different shot of
// the same subject. Modeled on award-winning Apple product pages and Bruno
// Simon's portfolio: move the camera, not the product.
//
// Background: a fabric mesh behind the football. Vertex shader pulls vertices
// toward the football's world position (gaussian falloff), adds continuous
// wave noise, and emits a ripple from the football's center. Dot-grid
// fragment shader so the fabric reads structurally. Reacts to the football
// in real time as the camera circles.
//
// Material: MeshPhysicalMaterial transmission glass with teal attenuation.
// Environment: RoomEnvironment baked via PMREMGenerator.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { ScrollTrigger } from '../lib/gsap';

// === Chromatic aberration shader pass ===
//
// Subtle RGB-offset toward the radial direction so the canvas edges get the
// premium "lens fringing" look (the topology.vc treatment). Center is clean,
// fringing scales with distance from center. Transparent pixels stay
// transparent so the football canvas still composites cleanly over the page.
// Per-beat u_amount values are driven from the scroll choreography so each
// section gets a different intensity of fringing.
const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    u_amount: { value: 0.0035 }
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float u_amount;
    varying vec2 vUv;
    void main() {
      vec4 center = texture2D(tDiffuse, vUv);
      if (center.a < 0.01) {
        gl_FragColor = vec4(0.0);
        return;
      }
      vec2 dir = vUv - 0.5;
      float d = length(dir);
      float amount = u_amount * (1.0 + d * 2.5);
      vec2 offset = (d > 0.0001 ? normalize(dir) : vec2(0.0)) * amount;
      float r = texture2D(tDiffuse, vUv - offset).r;
      float b = texture2D(tDiffuse, vUv + offset).b;
      gl_FragColor = vec4(r, center.g, b, center.a);
    }
  `
};

export interface HeroFootballHandle {
  pause: () => void;
  resume: () => void;
  dispose: () => void;
}

interface Beat {
  id: string;       // section id
  // Camera spherical-coord around origin.
  radius: number;
  yaw: number;
  pitch: number;
  // Football transform — stays near origin with subtle drifts at most.
  ballPosX: number;
  ballPosY: number;
  ballPosZ: number;
  ballScale: number;
  ballRotX: number;
  ballRotY: number; // multi-turn values create rotation during interpolation
  ballRotZ: number;
  // Scene lighting multiplier. 1.0 = full lights, 0.3 = dim. Lerps between
  // beats so the room "dims" gradually as you scroll into darker sections.
  lightLevel: number;
  // Chromatic aberration amount for this beat. Lerps between beats so the
  // lens fringing intensifies / relaxes per section.
  caAmount: number;
}

// Base orientation, applied as the ball's rotX/rotY/rotZ in every beat.
//   PROFILE_X → pitch forward toward camera (rolls the laces into view)
//   PROFILE_Y → spin around vertical axis (which side you see)
//   PROFILE_Z → roll in screen plane. Default 0 = horizontal football.
//     A runtime portrait check adds +90° to this in portrait viewports so
//     the football naturally orients vertical on mobile.
const PROFILE_X = Math.PI * 0.5; // +90° forward roll so laces face the camera
const PROFILE_Y = Math.PI * 0.5;
const PROFILE_Z = 0;
const PORTRAIT_Z_OFFSET = Math.PI * 0.5; // applied only when innerHeight > innerWidth

// === Beats — each section is a CAMERA SHOT of the same near-stationary ball ===
const BEATS: Beat[] = [
  // Hero — establishing front shot. Profile, laces visible, ball anchored.
  { id: 'hero',                radius: 4.5, yaw: 0,                 pitch: 0,    ballPosX: 0, ballPosY: 0, ballPosZ: 0,   ballScale: 1.00, ballRotX: PROFILE_X,                ballRotY: PROFILE_Y,                ballRotZ: PROFILE_Z, lightLevel: 1.00, caAmount: 0.0010 },
  // Approach — dolly in close. Detail of the surface and laces.
  { id: 'approach',            radius: 3.0, yaw: 0,                 pitch: 0,    ballPosX: 0, ballPosY: 0, ballPosZ: 0,   ballScale: 1.00, ballRotX: PROFILE_X,                ballRotY: PROFILE_Y,                ballRotZ: PROFILE_Z, lightLevel: 1.00, caAmount: 0.0015 },
  // Investment Approach — editorial 3/4 reveal. Slightly dim, amplified
  // chromatic aberration for the dramatic new beat.
  { id: 'investment-approach', radius: 4.0, yaw: 0,                 pitch: 0.05, ballPosX: 0, ballPosY: 0, ballPosZ: 0,   ballScale: 1.00, ballRotX: PROFILE_X,                ballRotY: PROFILE_Y,                ballRotZ: PROFILE_Z, lightLevel: 0.85, caAmount: 0.0050 },
  // Demographics — pull back wide, slight high angle.
  { id: 'demographics',        radius: 6.5, yaw: 0,                 pitch: 0.2,  ballPosX: 0, ballPosY: 0, ballPosZ: 0,   ballScale: 1.00, ballRotX: PROFILE_X,                ballRotY: PROFILE_Y,                ballRotZ: PROFILE_Z, lightLevel: 0.90, caAmount: 0.0015 },
  // Portfolio — the throw. As we transition INTO portfolio the ball spirals
  // 3× around its long axis (+6π on rotX). Camera orbits to the side to
  // watch the pass go by. The cumulative +6π is preserved through Team /
  // Track Record / Connect / Footer so the football doesn't unwind.
  { id: 'portfolio',           radius: 5.5, yaw: Math.PI * 0.25,    pitch: 0.05, ballPosX: 0, ballPosY: 0, ballPosZ: 0,   ballScale: 1.00, ballRotX: PROFILE_X + Math.PI * 6, ballRotY: PROFILE_Y,                ballRotZ: PROFILE_Z, lightLevel: 0.35, caAmount: 0.0030 },
  // Team — caught and carried. No further rotation (holds portfolio's
  // cumulative rotX value), camera continues its orbit.
  { id: 'team',                radius: 5.5, yaw: Math.PI * 0.45,    pitch: 0.15, ballPosX: 0, ballPosY: 0, ballPosZ: 0,   ballScale: 1.00, ballRotX: PROFILE_X + Math.PI * 6, ballRotY: PROFILE_Y,                ballRotZ: PROFILE_Z, lightLevel: 0.35, caAmount: 0.0010 },
  // Track Record — front shot, amplified fringing for the metrics moment.
  // Maintains the cumulative rotX so the football doesn't reverse-spin.
  { id: 'track-record',        radius: 5.0, yaw: 0,                 pitch: 0,    ballPosX: 0, ballPosY: 0, ballPosZ: 0,   ballScale: 1.00, ballRotX: PROFILE_X + Math.PI * 6, ballRotY: PROFILE_Y,                ballRotZ: PROFILE_Z, lightLevel: 1.00, caAmount: 0.0045 },
  // Connect — one last flip on Y (+2π) that lands laces facing camera again.
  // X-tilt removed: keeps cumulative rotX so the ball doesn't unwind its
  // earlier spiral.
  { id: 'connect',             radius: 5.0, yaw: 0,                 pitch: -0.05, ballPosX: 0, ballPosY: 0, ballPosZ: 0.3, ballScale: 1.10, ballRotX: PROFILE_X + Math.PI * 6,  ballRotY: PROFILE_Y + Math.PI * 2, ballRotZ: PROFILE_Z, lightLevel: 1.00, caAmount: 0.0070 },
  // Footer — football reintroduces. Camera pulls back; ball holds connect's
  // final pose so the laces-forward orientation is preserved.
  { id: 'footer',              radius: 7.5, yaw: 0,                 pitch: 0.10,  ballPosX: 0, ballPosY: 0, ballPosZ: 0,   ballScale: 0.85, ballRotX: PROFILE_X + Math.PI * 6,  ballRotY: PROFILE_Y + Math.PI * 2, ballRotZ: PROFILE_Z, lightLevel: 0.75, caAmount: 0.0020 }
];

function hexToColor(name: string, fallback: string): THREE.Color {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return new THREE.Color(raw || fallback);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

interface Pose {
  radius: number;
  yaw: number;
  pitch: number;
  ballPosX: number;
  ballPosY: number;
  ballPosZ: number;
  ballScale: number;
  ballRotX: number;
  ballRotY: number;
  ballRotZ: number;
  lightLevel: number;
  caAmount: number;
}

function interpBeats(a: Beat, b: Beat, t: number): Pose {
  const e = smoothstep(t);
  return {
    radius: lerp(a.radius, b.radius, e),
    yaw: lerp(a.yaw, b.yaw, e),
    pitch: lerp(a.pitch, b.pitch, e),
    ballPosX: lerp(a.ballPosX, b.ballPosX, e),
    ballPosY: lerp(a.ballPosY, b.ballPosY, e),
    ballPosZ: lerp(a.ballPosZ, b.ballPosZ, e),
    ballScale: lerp(a.ballScale, b.ballScale, e),
    ballRotX: lerp(a.ballRotX, b.ballRotX, e),
    ballRotY: lerp(a.ballRotY, b.ballRotY, e),
    ballRotZ: lerp(a.ballRotZ, b.ballRotZ, e),
    lightLevel: lerp(a.lightLevel, b.lightLevel, e),
    caAmount: lerp(a.caAmount, b.caAmount, e)
  };
}

// === Fabric shader ===
//
// Vertex shader pulls vertices toward the football's projected position in
// world XY (gaussian falloff), adds gentle wave noise, and emits a ripple
// from the football's center. Fragment shader draws a dotted grid with
// brightness modulated by the displacement and a soft viewport-edge fade.

const FABRIC_VERT = /* glsl */ `
uniform vec2 u_ballXY;
uniform float u_time;
varying vec3 vWorldPos;
varying float vPull;
varying vec2 vUv;

void main() {
  vec3 pos = position;

  // This vertex's world position before displacement.
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vec3 worldPos = wp.xyz;

  // Distance from this vertex to the football in the XY plane.
  vec2 toBall = u_ballXY - worldPos.xy;
  float dist = length(toBall);

  // Gaussian pull — strong near the ball, decays quickly.
  float pull = 1.6 * exp(-dist * dist * 0.06);

  // Ambient wave noise.
  float wave = (
    sin(worldPos.x * 0.32 + u_time * 0.45) * 0.5 +
    cos(worldPos.y * 0.27 + u_time * 0.35) * 0.5
  ) * 0.16;

  // Ripple emanating from the football.
  float ripple = sin(dist * 0.65 - u_time * 1.8) * 0.16 * exp(-dist * 0.10);

  pos.z += pull + wave + ripple;

  vPull = pull;
  vWorldPos = worldPos;
  vUv = uv;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}`;

const FABRIC_FRAG = /* glsl */ `
varying vec3 vWorldPos;
varying float vPull;
varying vec2 vUv;
uniform vec3 u_color;
uniform float u_brightness;

void main() {
  // Dotted grid: 1.2-unit cells.
  vec2 grid = fract(vWorldPos.xy / 1.2);
  float dotDist = length(grid - 0.5);
  float dot = smoothstep(0.44, 0.40, dotDist);

  // Brightness boosted by pull so the bulge area lights up.
  float brightness = 0.10 + vPull * 0.55;

  // Soft fade at the edges of the plane.
  float edgeX = smoothstep(0.0, 0.18, vUv.x) * smoothstep(1.0, 0.82, vUv.x);
  float edgeY = smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
  float edge = edgeX * edgeY;

  // u_brightness — driven by the scroll-driven lightLevel so the fabric
  // dims for moody sections and brightens back for the rest.
  gl_FragColor = vec4(u_color, dot * brightness * edge * u_brightness);
}`;

function buildFabric(isMobile: boolean): { mesh: THREE.Mesh; material: THREE.ShaderMaterial } {
  // Halve the tessellation on mobile — saves ~7000 vertices, ~14000 fewer
  // shader invocations per frame. Pull pattern still reads cleanly.
  const segX = isMobile ? 60 : 120;
  const segY = isMobile ? 40 : 80;
  const geo = new THREE.PlaneGeometry(48, 32, segX, segY);
  const mat = new THREE.ShaderMaterial({
    vertexShader: FABRIC_VERT,
    fragmentShader: FABRIC_FRAG,
    uniforms: {
      u_time: { value: 0 },
      u_ballXY: { value: new THREE.Vector2(0, 0) },
      u_color: { value: hexToColor('--accent-teal', '#5AC8FA') },
      u_brightness: { value: 1.0 }
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.z = -6;
  return { mesh, material: mat };
}

// === Procedural noise canvas for the football's animated alphaMap ===
//
// Multi-octave value noise rendered to a 256x256 canvas, used as the football
// material's alphaMap. The texture's UV offset animates each frame so the
// pattern flows across the surface — surface looks alive without explicit
// motion. Output values are biased high (mostly opaque) so the football
// stays substantial; the variation creates subtle see-through patches.
function hash2(x: number, y: number): number {
  let h = (x | 0) * 374761393 + (y | 0) * 668265263;
  h = (h ^ (h >> 13)) * 1274126177;
  return ((h ^ (h >> 16)) >>> 0) / 4294967295;
}

function smoothNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return (1 - u) * (1 - v) * a + u * (1 - v) * b + (1 - u) * v * c + u * v * d;
}

function fbm(x: number, y: number): number {
  let v = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < 4; i++) {
    v += smoothNoise(x * freq, y * freq) * amp;
    amp *= 0.5;
    freq *= 2;
  }
  return v;
}

function buildNoiseTexture(): THREE.CanvasTexture {
  const SIZE = 256;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }
  const img = ctx.createImageData(SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const u = (x / SIZE) * 5;
      const v = (y / SIZE) * 5;
      // fbm in 0..1; lower bias = much more translucent surface
      const n = fbm(u, v);
      const val = Math.floor(70 + n * 165); // 70..235 see through most areas
      const idx = (y * SIZE + x) * 4;
      img.data[idx] = val;
      img.data[idx + 1] = val;
      img.data[idx + 2] = val;
      img.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

export function initHeroFootball(canvas: HTMLCanvasElement): HeroFootballHandle | null {
  // Detect mobile / low-power once at init. Drives DPR cap, antialias,
  // fabric tessellation, and environment map quality.
  const isMobile =
    window.matchMedia('(max-width: 768px)').matches ||
    window.matchMedia('(pointer: coarse)').matches;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile, // MSAA off on mobile — relies on DPR for smoothing
    alpha: true,
    powerPreference: isMobile ? 'low-power' : 'high-performance'
  });
  renderer.setClearColor(0x000000, 0);
  // On mobile cap at 1.25 — most phones report 2-3 dpr which murders fill rate.
  const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2);
  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  camera.position.set(0, 0, BEATS[0].radius);

  // === Fabric ===
  const fabric = buildFabric(isMobile);
  scene.add(fabric.mesh);

  // === Environment ===
  // On mobile, increase the PMREM blur (sigma) so the env map can use lower
  // intermediate mip resolutions — smaller GPU footprint at the cost of
  // slightly less crisp reflections.
  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const envScene = new RoomEnvironment();
  const envMap = pmrem.fromScene(envScene, isMobile ? 0.12 : 0.04).texture;
  scene.environment = envMap;

  // === Lights — pulled back. Per-beat lightLevel multiplies these in the
  // animation loop, so the room dims for Portfolio/Team and brightens back. ===
  const BASE_KEY = 0.9;
  const BASE_RIM = 0.9;
  const BASE_FILL = 0.45;
  const BASE_AMBIENT = 0.08;
  const BASE_ENV = 0.55;

  const keyLight = new THREE.DirectionalLight(0xffffff, BASE_KEY);
  keyLight.position.set(4, 6, 5);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(hexToColor('--accent-teal', '#5AC8FA'), BASE_RIM);
  rimLight.position.set(-5, 2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(hexToColor('--accent', '#0A84FF'), BASE_FILL);
  fillLight.position.set(2, -3, 4);
  scene.add(fillLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, BASE_AMBIENT);
  scene.add(ambientLight);

  // === Football ===
  const pivot = new THREE.Group();
  scene.add(pivot);

  // Crystal — patterned after Three.js's transmission_alpha example. High
  // transmission, low clearcoat (less chrome shine), stronger teal attenuation
  // so the body of the ball carries blue. Animated noise alphaMap varies the
  // see-through pattern across the surface.
  const noiseTex = buildNoiseTexture();
  const crystal = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0,
    roughness: 0.15,
    transmission: 1.0,
    ior: 1.45,
    thickness: 1.2,
    attenuationDistance: 0.9,
    attenuationColor: hexToColor('--accent', '#0A84FF'),
    clearcoat: 0.25,
    clearcoatRoughness: 0.3,
    envMapIntensity: BASE_ENV,
    alphaMap: noiseTex,
    transparent: true,
    side: THREE.DoubleSide
  });

  let modelReady = false;
  let modelRoot: THREE.Object3D | null = null;

  const loader = new GLTFLoader();
  loader.load(
    '/models/football.glb',
    (gltf) => {
      modelRoot = gltf.scene;
      modelRoot.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          (obj as THREE.Mesh).material = crystal;
        }
      });

      const box = new THREE.Box3().setFromObject(modelRoot);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);
      modelRoot.position.sub(center);

      const maxAxis = Math.max(size.x, size.y, size.z);
      const targetSize = 3.2;
      modelRoot.scale.setScalar(targetSize / maxAxis);

      pivot.add(modelRoot);
      modelReady = true;
    },
    undefined,
    (err) => {
      console.warn('[hero-football] failed to load /models/football.glb', err);
    }
  );

  // === Post-processing — chromatic aberration (desktop only) ===
  const useComposer = !isMobile;
  let composer: EffectComposer | null = null;
  let caPass: ShaderPass | null = null;

  if (useComposer) {
    composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    caPass = new ShaderPass(ChromaticAberrationShader);
    composer.addPass(caPass);
  }

  // === Sizing ===
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    if (composer) composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Viewport-aware base Z rotation. Landscape = horizontal football,
  // portrait = vertical. Recalculated on every resize.
  let portraitZ = 0;
  function updateOrientation() {
    const isPortrait = window.innerHeight > window.innerWidth;
    portraitZ = isPortrait ? PORTRAIT_Z_OFFSET : 0;
  }
  updateOrientation();
  window.addEventListener('resize', updateOrientation);

  // === Scroll-driven pose ===
  let currentPose: Pose = {
    radius: BEATS[0].radius, yaw: BEATS[0].yaw, pitch: BEATS[0].pitch,
    ballPosX: BEATS[0].ballPosX, ballPosY: BEATS[0].ballPosY, ballPosZ: BEATS[0].ballPosZ,
    ballScale: BEATS[0].ballScale,
    ballRotX: BEATS[0].ballRotX, ballRotY: BEATS[0].ballRotY, ballRotZ: BEATS[0].ballRotZ,
    lightLevel: BEATS[0].lightLevel,
    caAmount: BEATS[0].caAmount
  };

  const scrollTriggers: ScrollTrigger[] = [];
  for (let i = 0; i < BEATS.length - 1; i++) {
    const a = BEATS[i];
    const b = BEATS[i + 1];
    const trigger = ScrollTrigger.create({
      id: `football-beat-${i}`,
      trigger: `#${a.id}`,
      start: 'top top',
      endTrigger: `#${b.id}`,
      end: 'top top',
      scrub: 0.6,
      onUpdate: (self) => {
        currentPose = interpBeats(a, b, self.progress);
      }
    });
    scrollTriggers.push(trigger);
  }

  // === Animation loop ===
  const clock = new THREE.Clock();
  const elapsed = { t: 0 };
  let running = true;
  let raf = 0;
  let firstFrame = true;

  function frame() {
    if (!running) return;
    const dt = clock.getDelta();
    elapsed.t += dt;

    fabric.material.uniforms.u_time.value = elapsed.t;
    fabric.material.uniforms.u_ballXY.value.set(currentPose.ballPosX, currentPose.ballPosY);
    fabric.material.uniforms.u_brightness.value = currentPose.lightLevel;

    // Slowly drift the football's alphaMap UV — surface pattern flows across.
    noiseTex.offset.x = (elapsed.t * 0.018) % 1;
    noiseTex.offset.y = (elapsed.t * 0.011) % 1;

    if (modelReady && pivot.children.length) {
      // Camera on a sphere around origin.
      const cx = currentPose.radius * Math.cos(currentPose.pitch) * Math.sin(currentPose.yaw);
      const cy = currentPose.radius * Math.sin(currentPose.pitch);
      const cz = currentPose.radius * Math.cos(currentPose.pitch) * Math.cos(currentPose.yaw);
      camera.position.set(cx, cy, cz);
      camera.lookAt(0, 0, 0);

      pivot.position.set(currentPose.ballPosX, currentPose.ballPosY, currentPose.ballPosZ);
      pivot.scale.setScalar(currentPose.ballScale);
      pivot.rotation.x = currentPose.ballRotX;
      pivot.rotation.y = currentPose.ballRotY;
      pivot.rotation.z = currentPose.ballRotZ + portraitZ;

      // Per-beat lighting. The fabric uniform gets the full lightLevel so
      // the background dims dramatically. The football lighting has a floor
      // so it stays glassy and visible even in moody sections.
      const l = currentPose.lightLevel;
      const ballL = Math.max(0.75, l);
      keyLight.intensity = BASE_KEY * ballL;
      rimLight.intensity = BASE_RIM * ballL;
      fillLight.intensity = BASE_FILL * ballL;
      ambientLight.intensity = BASE_AMBIENT * ballL;
      crystal.envMapIntensity = BASE_ENV * ballL;
    }

    // Per-beat chromatic aberration. Replaces the static default so each
    // section gets its own fringing intensity (subtle for hero/team,
    // amplified for investment-approach / track-record / connect).
    if (caPass) {
      caPass.uniforms.u_amount.value = currentPose.caAmount;
    }

    if (composer) {
      composer.render();
    } else {
      renderer.render(scene, camera);
    }

    // Reveal the canvas as soon as ANY frame paints — the fabric + post chain
    // render independently of the football model. Waiting for modelReady here
    // (the old gate) meant a slow / failing GLB fetch would keep the entire
    // canvas at opacity 0, hiding fabric, ripple, and chromatic aberration.
    if (firstFrame) {
      firstFrame = false;
      canvas.classList.add('is-ready');
    }

    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          if (!running) {
            running = true;
            clock.getDelta();
            raf = requestAnimationFrame(frame);
          }
        } else {
          running = false;
          cancelAnimationFrame(raf);
        }
      }
    },
    { threshold: 0 }
  );
  io.observe(canvas);

  return {
    pause: () => {
      running = false;
      cancelAnimationFrame(raf);
    },
    resume: () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    },
    dispose: () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('resize', updateOrientation);
      scrollTriggers.forEach((st) => st.kill());
      crystal.dispose();
      noiseTex.dispose();
      envMap.dispose();
      pmrem.dispose();
      (fabric.mesh.geometry as THREE.BufferGeometry).dispose();
      fabric.material.dispose();
      composer?.dispose();
      renderer.dispose();
    }
  };
}
