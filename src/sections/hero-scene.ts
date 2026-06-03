// Hero background — minimal ASCII dither over a soft centered glow.
//
// One texture (u_atlas), one quad. Field intensity per cell is built from:
//   - a centered radial glow (the static composition)
//   - a Gaussian halo at the momentum-smoothed mouse position
//   - a whisper of drifting fbm noise for shimmer
//
// Quantized to a 16-level monospace character ramp and tinted with --accent.

const VERT = /* glsl */ `#version 300 es
in vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAG = /* glsl */ `#version 300 es
precision highp float;

uniform float u_time;
uniform vec2  u_resolution;
uniform vec2  u_mouse;            // UV 0..1, smoothed
uniform float u_mouseInfluence;   // 0..1, decays toward 0 when idle
uniform sampler2D u_atlas;
uniform vec3  u_canvas;
uniform vec3  u_depthWarm;
uniform vec3  u_accent;
uniform vec3  u_accentTeal;
uniform float u_cellSize;

out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * vnoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 fragPx = gl_FragCoord.xy;
  vec2 cellPx = floor(fragPx / u_cellSize) * u_cellSize;
  vec2 cellCenter = cellPx + u_cellSize * 0.5;
  vec2 cellUv = cellCenter / u_resolution;

  float aspect = u_resolution.x / u_resolution.y;
  vec2 uv = cellUv;

  // Centered soft glow — the static composition. Slightly above midline so
  // it settles behind the headline rather than the sub-tagline.
  vec2 c = uv - vec2(0.5, 0.55);
  c.x *= aspect * 0.75;
  float centerGlow = exp(-pow(length(c) * 1.8, 1.6)) * 0.62;
  float field = centerGlow;

  // Mouse halo with momentum (aspect-corrected for a screen-circle shape).
  vec2 dM = uv - u_mouse;
  dM.x *= aspect;
  float dMLen = length(dM);
  float halo = exp(-dMLen * 3.6) * (0.20 + u_mouseInfluence * 0.90);
  field += halo;

  // Whisper of noise drift so the dither shimmers when nothing's happening.
  float t = u_time * 0.020;
  field += fbm(uv * 2.8 + vec2(t, t * 0.6)) * 0.10;

  // Edge vignette pulls darks toward the corners.
  vec2 e = uv - vec2(0.5, 0.5);
  e.x *= aspect * 0.7;
  float edgeVig = 1.0 - smoothstep(0.40, 1.05, length(e));
  field = mix(field * 0.40, field, edgeVig);

  // 16-level character index.
  float idx = floor(clamp(field, 0.0, 0.999) * 16.0);

  // Atlas lookup.
  vec2 local = (fragPx - cellPx) / u_cellSize;
  float ax = mod(idx, 4.0);
  float ay = floor(idx / 4.0);
  vec2 atlasUv = (vec2(ax, ay) + vec2(local.x, 1.0 - local.y)) / 4.0;
  float charI = texture(u_atlas, atlasUv).r;

  // Color: blend accent (blue) → teal by intensity AND mouse proximity, so
  // the halo carries a brighter electric edge.
  float teal = clamp(charI * 0.55 + (1.0 - dMLen) * 0.25 + u_mouseInfluence * 0.20, 0.0, 1.0);
  vec3 accentMix = mix(u_accent, u_accentTeal, teal);

  vec3 base = mix(u_canvas, u_depthWarm * 0.55, field * edgeVig);
  vec3 ink = mix(accentMix * 0.45, accentMix, charI);
  vec3 col = mix(base, ink, charI * 0.92);

  // Grain.
  float grain = (hash(fragPx + fract(u_time)) - 0.5) * 0.020;
  col += grain;

  fragColor = vec4(col, 1.0);
}`;

const RAMP = [' ', '.', ',', ':', '-', '=', '+', '*', 'o', 'x', '#', '%', '@', 'M', 'W', '8'];

function buildAtlas(gl: WebGL2RenderingContext, accentColor: string): WebGLTexture | null {
  const CELL = 64;
  const SIZE = CELL * 4;
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.font = `500 ${CELL * 0.78}px "SF Mono", "Menlo", "JetBrains Mono", monospace`;
  ctx.fillStyle = accentColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i < 16; i++) {
    const col = i % 4;
    const row = Math.floor(i / 4);
    ctx.fillText(RAMP[i], col * CELL + CELL / 2, row * CELL + CELL / 2);
  }

  const tex = gl.createTexture();
  if (!tex) return null;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn('[hero-scene] compile failed:', gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function readCss(name: string, fallback: string): string {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return raw || fallback;
}

function hexToVec3(hex: string): [number, number, number] {
  const v = hex.replace('#', '');
  return [
    parseInt(v.slice(0, 2), 16) / 255,
    parseInt(v.slice(2, 4), 16) / 255,
    parseInt(v.slice(4, 6), 16) / 255
  ];
}

export interface HeroSceneHandle {
  pause: () => void;
  resume: () => void;
  dispose: () => void;
}

export function initHeroScene(canvas: HTMLCanvasElement): HeroSceneHandle | null {
  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    powerPreference: 'low-power'
  });
  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[hero-scene] link failed:', gl.getProgramInfoLog(program));
    return null;
  }
  gl.useProgram(program);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW
  );
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(program, 'u_time');
  const uRes = gl.getUniformLocation(program, 'u_resolution');
  const uMouse = gl.getUniformLocation(program, 'u_mouse');
  const uMouseInfluence = gl.getUniformLocation(program, 'u_mouseInfluence');
  const uAtlas = gl.getUniformLocation(program, 'u_atlas');
  const uCanvasC = gl.getUniformLocation(program, 'u_canvas');
  const uDepth = gl.getUniformLocation(program, 'u_depthWarm');
  const uAccent = gl.getUniformLocation(program, 'u_accent');
  const uAccentTeal = gl.getUniformLocation(program, 'u_accentTeal');
  const uCell = gl.getUniformLocation(program, 'u_cellSize');

  const accentHex = readCss('--accent', '#0A84FF');
  gl.uniform3fv(uCanvasC, hexToVec3(readCss('--surface-canvas', '#0A0A0B')));
  gl.uniform3fv(uDepth, hexToVec3(readCss('--depth-warm', '#1A2540')));
  gl.uniform3fv(uAccent, hexToVec3(accentHex));
  gl.uniform3fv(uAccentTeal, hexToVec3(readCss('--accent-teal', '#5AC8FA')));

  const atlasTex = buildAtlas(gl, accentHex);
  if (!atlasTex) return null;
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, atlasTex);
  gl.uniform1i(uAtlas, 0);

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const CELL_CSS = 14;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    const pw = Math.max(1, Math.floor(w * dpr));
    const ph = Math.max(1, Math.floor(h * dpr));
    if (canvas.width !== pw || canvas.height !== ph) {
      canvas.width = pw;
      canvas.height = ph;
    }
    gl!.viewport(0, 0, pw, ph);
    gl!.uniform2f(uRes, pw, ph);
    gl!.uniform1f(uCell, CELL_CSS * dpr);
  }

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // Mouse state. Target = latest pointer position (UV 0..1). Smooth = lerped
  // position used by the shader. Influence = scalar that spikes on move and
  // decays each frame, driving halo strength.
  const mouseTarget = { x: 0.5, y: 0.5 };
  const mouseSmooth = { x: 0.5, y: 0.5 };
  let mouseInfluence = 0;

  function onPointerMove(e: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    mouseTarget.x = (e.clientX - rect.left) / rect.width;
    // Flip Y: client coords are top-left, UV is bottom-left.
    mouseTarget.y = 1 - (e.clientY - rect.top) / rect.height;
    mouseInfluence = 1.0;
  }
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  let running = true;
  let firstFrame = true;
  let raf = 0;
  const start = performance.now();

  function frame(now: number) {
    if (!running) return;

    // Lerp mouse toward target — feels like momentum because the smoothed
    // position chases on its own when the cursor stops.
    mouseSmooth.x += (mouseTarget.x - mouseSmooth.x) * 0.12;
    mouseSmooth.y += (mouseTarget.y - mouseSmooth.y) * 0.12;
    // Decay influence each frame so the halo settles back to its idle level.
    mouseInfluence *= 0.94;

    gl!.uniform1f(uTime, (now - start) / 1000);
    gl!.uniform2f(uMouse, mouseSmooth.x, mouseSmooth.y);
    gl!.uniform1f(uMouseInfluence, mouseInfluence);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);

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
      window.removeEventListener('pointermove', onPointerMove);
      gl!.deleteTexture(atlasTex);
      gl!.deleteBuffer(quad);
      gl!.deleteProgram(program);
      gl!.deleteShader(vs!);
      gl!.deleteShader(fs!);
    }
  };
}
