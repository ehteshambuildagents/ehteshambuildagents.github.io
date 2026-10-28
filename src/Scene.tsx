import { useCallback, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import { projects, type Project } from './content'
import { sampleScroll } from './scroll'

const N = projects.length
const TAU = Math.PI * 2
const CAM_Z = 8
const TAN = Math.tan(THREE.MathUtils.degToRad(35 / 2))
const SUN = new THREE.Vector2(0.62, 0.55).normalize()
const W = 1024
const H = 640
const CARD_W = 3.2
const CARD_H = 2
const RING_R = 3.4 // carousel radius, in card units
const ORBIT_R = 2.15 // chip orbit radius, in planet units
const ORBIT_ROT = [1.18, 0.22, -0.4] as const
const Q_ORBIT = new THREE.Quaternion().setFromEuler(new THREE.Euler(...ORBIT_ROT))
const LIME = '#d7ff00'
const FONT_D = '"Space Grotesk Variable", "Space Grotesk", sans-serif'
const FONT_B = '"Inter Variable", Inter, sans-serif'
const FONT_M = '"Roboto Mono", ui-monospace, monospace'
const TINT = ['#0f2c24', '#0f1d36', '#1f2510', '#2d200c', '#2a1121', '#0d2933']

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const ease = (t: number) => t * t * (3 - 2 * t)
const smooth = (a: number, b: number, v: number) => ease(clamp01((v - a) / (b - a)))
const mix = THREE.MathUtils.lerp
const pad = (n: number) => String(n).padStart(2, '0')

/* ---------- screen artwork: each project's workflow, drawn as a live illustration ---------- */

function fit(g: CanvasRenderingContext2D, text: string, weight: number, size: number, family: string, max: number) {
  let s = size
  g.font = `${weight} ${s}px ${family}`
  while (s > 12 && g.measureText(text).width > max) {
    s -= 2
    g.font = `${weight} ${s}px ${family}`
  }
}

function drawPill(g: CanvasRenderingContext2D, p: Project, i: number) {
  g.clearRect(0, 0, W, H)
  g.textBaseline = 'middle'
  const num = pad(i + 1)
  g.font = `500 54px ${FONT_M}`
  const nw = g.measureText(num).width
  fit(g, p.short, 600, 104, FONT_D, W - 200 - nw)
  const lw = g.measureText(p.short).width
  const h = 184
  const w = 70 + nw + 30 + lw + 76
  const x = (W - w) / 2
  g.beginPath()
  g.roundRect(x, (H - h) / 2, w, h, h / 2)
  g.fillStyle = 'rgba(9, 10, 13, 0.9)'
  g.fill()
  g.lineWidth = 3
  g.strokeStyle = 'rgba(255, 255, 255, 0.3)'
  g.stroke()
  g.fillStyle = '#f6f7f9'
  g.fillText(p.short, x + 70 + nw + 30, H / 2 + 6)
  g.font = `500 54px ${FONT_M}`
  g.fillStyle = LIME
  g.fillText(num, x + 70, H / 2 + 3)
}

// t: seconds since this screen came to the front; Infinity draws the finished run
function drawScreen(g: CanvasRenderingContext2D, p: Project, i: number, t: number) {
  const live = Number.isFinite(t)
  g.clearRect(0, 0, W, H)
  g.save()
  g.beginPath()
  g.roundRect(6, 6, W - 12, H - 12, 30)
  g.clip()
  const bg = g.createLinearGradient(0, 0, W * 0.7, H)
  bg.addColorStop(0, TINT[i % TINT.length])
  bg.addColorStop(1, '#060709')
  g.fillStyle = bg
  g.fillRect(0, 0, W, H)
  const glow = g.createRadialGradient(W * 0.78, H * 0.45, 10, W * 0.78, H * 0.45, W * 0.42)
  glow.addColorStop(0, 'rgba(215, 255, 0, 0.09)')
  glow.addColorStop(1, 'rgba(215, 255, 0, 0)')
  g.fillStyle = glow
  g.fillRect(0, 0, W, H)
  g.beginPath()
  for (let x = 32; x < W; x += 32) {
    g.moveTo(x + 0.5, 82)
    g.lineTo(x + 0.5, H)
  }
  for (let y = 98; y < H; y += 32) {
    g.moveTo(0, y + 0.5)
    g.lineTo(W, y + 0.5)
  }
  g.strokeStyle = 'rgba(255, 255, 255, 0.03)'
  g.lineWidth = 1
  g.stroke()

  g.textBaseline = 'middle'
  g.fillStyle = '#3b3e46'
  for (let k = 0; k < 3; k++) {
    g.beginPath()
    g.arc(44 + k * 24, 44, 7, 0, TAU)
    g.fill()
  }
  g.font = `500 19px ${FONT_M}`
  g.fillStyle = '#8b909a'
  g.fillText(`${p.id} / workflow`, 124, 45)
  g.textAlign = 'right'
  g.fillStyle = '#5f646d'
  g.fillText('ILLUSTRATION', W - 40, 45)
  g.textAlign = 'left'
  g.fillStyle = 'rgba(255, 255, 255, 0.08)'
  g.fillRect(0, 82, W, 1)

  fit(g, p.name, 600, 56, FONT_D, 560)
  g.fillStyle = '#f6f7f9'
  g.fillText(p.name, 44, 140)
  g.font = `400 22px ${FONT_B}`
  g.fillStyle = '#9a9ea8'
  g.fillText(p.kicker, 44, 184)

  // run log: steps tick through in order and the current one types itself out
  const steps = p.flow
  const run = live ? (t * 0.85) % (steps.length + 2.5) : steps.length
  const cur = Math.floor(run)
  const typed = Math.min(1, (run - cur) * 1.8)
  const blink = !live || Math.sin(t * 9) > 0
  g.font = `500 19px ${FONT_M}`
  steps.forEach((s, k) => {
    const y = 240 + k * 36
    const human = /human/i.test(s)
    const done = k < cur
    const now = k === cur
    g.fillStyle = '#585d66'
    g.fillText(pad(k + 1), 44, y)
    const label = now ? s.toLowerCase().slice(0, Math.ceil(s.length * typed)) : s.toLowerCase()
    g.fillStyle = done ? '#c9ccd3' : now ? '#f6f7f9' : '#3f434b'
    g.fillText(label, 92, y)
    if (now && typed < 1 && blink) g.fillRect(96 + g.measureText(label).width, y - 11, 11, 22)
    if (!done && !now) return
    g.textAlign = 'right'
    g.fillStyle = now || human ? LIME : '#6f907a'
    g.globalAlpha = now && !blink ? 0.45 : 1
    g.fillText(done ? (human ? 'approved' : 'ok') : human ? 'awaiting human' : 'running', 600, y)
    g.globalAlpha = 1
    g.textAlign = 'left'
  })

  // pipeline: a spine of nodes with a pulse travelling to the next step
  const nx = 820
  const top = 132
  const gap = (520 - top) / Math.max(1, steps.length - 1)
  g.lineWidth = 2
  g.strokeStyle = 'rgba(255, 255, 255, 0.12)'
  g.beginPath()
  g.moveTo(nx, top)
  g.lineTo(nx, top + gap * (steps.length - 1))
  g.stroke()
  g.strokeStyle = 'rgba(215, 255, 0, 0.6)'
  g.beginPath()
  g.moveTo(nx, top)
  g.lineTo(nx, top + gap * Math.min(steps.length - 1, cur + (live ? typed : 0)))
  g.stroke()
  steps.forEach((s, k) => {
    const y = top + k * gap
    const human = /human/i.test(s)
    const done = k < cur
    const now = k === cur
    g.beginPath()
    if (human) {
      g.moveTo(nx, y - 14)
      g.lineTo(nx + 14, y)
      g.lineTo(nx, y + 14)
      g.lineTo(nx - 14, y)
      g.closePath()
    } else g.arc(nx, y, 10, 0, TAU)
    g.fillStyle = now || (human && done) ? LIME : done ? '#c9ccd3' : '#0b0c10'
    g.fill()
    g.strokeStyle = now || human ? LIME : done ? '#c9ccd3' : '#41454d'
    g.stroke()
    if (now && live) {
      g.globalAlpha = 0.25 + 0.2 * Math.sin(t * 5)
      g.beginPath()
      g.arc(nx, y, 24, 0, TAU)
      g.strokeStyle = LIME
      g.stroke()
      g.globalAlpha = 1
    }
    g.font = `500 15px ${FONT_M}`
    g.fillStyle = '#585d66'
    g.textAlign = 'right'
    g.fillText(pad(k + 1), nx - 34, y)
    g.textAlign = 'left'
  })

  g.font = `500 16px ${FONT_M}`
  let x = 44
  for (const tech of p.tech) {
    const w = g.measureText(tech).width + 28
    if (x + w > 660) break
    g.beginPath()
    g.roundRect(x, H - 76, w, 34, 17)
    g.strokeStyle = 'rgba(255, 255, 255, 0.2)'
    g.lineWidth = 1.5
    g.stroke()
    g.fillStyle = '#b5b9c1'
    g.fillText(tech, x + 14, H - 58)
    x += w + 10
  }
  g.textAlign = 'right'
  g.fillStyle = '#62666f'
  g.fillText(`step ${pad(Math.min(cur + 1, steps.length))} / ${pad(steps.length)}`, W - 40, H - 58)
  g.textAlign = 'left'
  g.restore()
  g.beginPath()
  g.roundRect(6, 6, W - 12, H - 12, 30)
  g.lineWidth = 2
  g.strokeStyle = 'rgba(255, 255, 255, 0.16)'
  g.stroke()
}

/* ---------- materials ---------- */

const NOISE = /* glsl */ `
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x), mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x), mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}`

// the planet: a dark body, back-lit, so its limb burns lime on the side facing the hidden sun
const PLANET = new THREE.ShaderMaterial({
  uniforms: { uSun: { value: SUN }, uFade: { value: 0 } },
  vertexShader: /* glsl */ `
    varying vec3 vN; varying vec3 vV; varying vec3 vP;
    void main() {
      vP = position;
      vN = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vV = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: /* glsl */ `
    uniform vec2 uSun; uniform float uFade;
    varying vec3 vN; varying vec3 vV; varying vec3 vP;
    ${NOISE}
    void main() {
      vec3 n = normalize(vN);
      float rim = pow(1.0 - max(dot(n, normalize(vV)), 0.0), 2.6);
      float toward = max(dot(normalize(n.xy + 1e-4), uSun), 0.0);
      float bands = noise(vec3(vP.x * 1.4, vP.y * 10.0, vP.z * 1.4)) * 0.65 + noise(vP * 5.0) * 0.35;
      vec3 col = mix(vec3(0.010, 0.011, 0.015), vec3(0.055, 0.06, 0.075), bands);
      col += vec3(0.84, 1.0, 0.0) * 0.035 * smoothstep(0.2, 1.0, toward) * (1.0 - rim);
      col += mix(vec3(0.84, 1.0, 0.0), vec3(1.0, 1.0, 0.9), 0.35) * rim * (0.12 + 2.4 * pow(toward, 3.0)) * uFade;
      gl_FragColor = vec4(col, 1.0);
    }`,
})

const BILLBOARD_VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`

// corona: light spilling round the limb, strongest toward the sun, with slow rays
const CORONA = new THREE.ShaderMaterial({
  uniforms: { uSun: { value: SUN }, uFade: { value: 0 }, uTime: { value: 0 } },
  vertexShader: BILLBOARD_VERT,
  fragmentShader: /* glsl */ `
    uniform vec2 uSun; uniform float uFade; uniform float uTime; varying vec2 vUv;
    void main() {
      vec2 p = (vUv - 0.5) * 4.6;
      float r = length(p);
      float side = dot(p / max(r, 1e-4), uSun) * 0.5 + 0.5;
      float a = atan(p.y, p.x);
      float fall = exp(-max(r - 1.0, 0.0) * mix(4.4, 2.1, side));
      float rays = 0.8 + 0.2 * sin(a * 18.0 + uTime * 0.25) * sin(a * 7.0 - uTime * 0.17);
      float k = fall * rays * smoothstep(2.3, 1.45, r) * (0.16 + 1.3 * pow(side, 2.2)) * uFade;
      gl_FragColor = vec4(mix(vec3(0.84, 1.0, 0.0), vec3(1.0, 1.0, 0.92), side * 0.6) * k, min(k, 1.0));
    }`,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  premultipliedAlpha: true,
})

// the diamond-ring bead where the sun breaks the limb
const FLARE = new THREE.ShaderMaterial({
  uniforms: { uFade: { value: 0 }, uTime: { value: 0 } },
  vertexShader: BILLBOARD_VERT,
  fragmentShader: /* glsl */ `
    uniform float uFade; uniform float uTime; varying vec2 vUv;
    void main() {
      vec2 p = (vUv - 0.5) * 2.0;
      float r = length(p);
      float spikes = exp(-abs(p.x) * 42.0) * exp(-abs(p.y) * 3.2) + exp(-abs(p.y) * 42.0) * exp(-abs(p.x) * 3.2);
      float k = (exp(-r * 9.0) * 1.4 + spikes * 0.55) * (0.85 + 0.15 * sin(uTime * 1.7)) * smoothstep(1.0, 0.55, r) * uFade;
      gl_FragColor = vec4(vec3(0.95, 1.0, 0.75) * k, min(k, 1.0));
    }`,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  premultipliedAlpha: true,
})

const RING = new THREE.ShaderMaterial({
  uniforms: { uFade: { value: 0 } },
  vertexShader: /* glsl */ `varying vec2 vP; void main() { vP = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform float uFade; varying vec2 vP;
    float h(float x) { return fract(sin(x * 127.1) * 43758.5453); }
    float n(float x) { float i = floor(x); float f = fract(x); return mix(h(i), h(i + 1.0), f * f * (3.0 - 2.0 * f)); }
    void main() {
      float t = (length(vP) - 1.3) / 0.55;
      float bands = n(t * 38.0) * 0.6 + n(t * 9.0 + 3.0) * 0.4;
      float gap = 1.0 - smoothstep(0.56, 0.58, t) * (1.0 - smoothstep(0.62, 0.64, t));
      float a = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.82, t) * (0.12 + 0.38 * bands) * gap;
      gl_FragColor = vec4(mix(vec3(0.62, 0.65, 0.7), vec3(0.84, 1.0, 0.0), 0.12 * bands), a * uFade);
    }`,
  transparent: true,
  depthWrite: false,
  side: THREE.DoubleSide,
})

const ORBIT = new THREE.MeshStandardMaterial({ color: '#c3c7cf', metalness: 0.6, roughness: 0.35, transparent: true, opacity: 0 })
const SAT = new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.5, roughness: 0.2 })
const SAT_LIME = new THREE.MeshBasicMaterial({ color: LIME })

// a project card: the orbiting chip morphs into the curved screen; switching screens glitches and sweeps
const CARD_FRAG = /* glsl */ `
  uniform sampler2D uPill; uniform sampler2D uScreen;
  uniform float uMorph; uniform float uGlitch; uniform float uSweep; uniform float uOpacity; uniform float uTime; uniform float uHover;
  varying vec2 vUv;
  float rnd(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec2 uv = vUv;
    float row = floor(uv.y * 28.0);
    float tick = floor(uTime * 24.0);
    uv.x += (rnd(vec2(tick, row)) - 0.5) * 0.09 * uGlitch * step(0.72, rnd(vec2(row, tick)));
    float ca = 0.012 * uGlitch;
    vec4 s = texture2D(uScreen, uv);
    s.r = texture2D(uScreen, uv + vec2(ca, 0.0)).r;
    s.b = texture2D(uScreen, uv - vec2(ca, 0.0)).b;
    float y = 1.0 - vUv.y;
    s.rgb *= mix(0.35, 1.0, step(y, uSweep + 0.02));
    s.rgb += vec3(0.84, 1.0, 0.0) * smoothstep(0.03, 0.0, abs(y - uSweep)) * (1.0 - step(1.0, uSweep)) * 0.55;
    s.rgb *= 0.94 + 0.06 * sin(vUv.y * 900.0);
    vec4 p = texture2D(uPill, vUv);
    p.rgb += uHover * 0.12 * p.a;
    vec4 c = mix(p, s, uMorph);
    gl_FragColor = vec4(c.rgb, c.a * uOpacity);
  }`

function curvedPlane() {
  const g = new THREE.PlaneGeometry(CARD_W, CARD_H, 40, 1)
  const pos = g.attributes.position
  const bend = 5
  for (let i = 0; i < pos.count; i++) {
    const a = pos.getX(i) / bend
    pos.setXYZ(i, Math.sin(a) * bend, pos.getY(i), (1 - Math.cos(a)) * bend)
  }
  g.computeVertexNormals()
  return g
}
const CARD_GEO = curvedPlane()

function surface(scale: number) {
  const c = document.createElement('canvas')
  c.width = W * scale
  c.height = H * scale
  const g = c.getContext('2d')!
  g.setTransform(scale, 0, 0, scale, 0, 0)
  return { g, tex: new THREE.CanvasTexture(c) }
}

const CARDS = projects.map((p, i) => {
  const screen = surface(innerWidth < 700 ? 0.75 : 1)
  const pill = surface(0.5)
  screen.tex.anisotropy = 4
  drawScreen(screen.g, p, i, Infinity)
  drawPill(pill.g, p, i)
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uPill: { value: pill.tex },
      uScreen: { value: screen.tex },
      uMorph: { value: 0 },
      uGlitch: { value: 0 },
      uSweep: { value: 1 },
      uOpacity: { value: 0 },
      uTime: { value: 0 },
      uHover: { value: 0 },
    },
    vertexShader: BILLBOARD_VERT,
    fragmentShader: CARD_FRAG,
    transparent: true,
    depthWrite: false,
  })
  return { p, i, screen, pill, mat, glitch: 0, sweep: 1, hover: 0, since: 0 }
})

// canvas text needs the web fonts; redraw once they are in
Promise.all([
  document.fonts.load(`600 64px ${FONT_D}`),
  document.fonts.load(`400 22px ${FONT_B}`),
  document.fonts.load(`500 19px ${FONT_M}`),
]).then(() =>
  CARDS.forEach((c) => {
    drawScreen(c.screen.g, c.p, c.i, Infinity)
    drawPill(c.pill.g, c.p, c.i)
    c.screen.tex.needsUpdate = true
    c.pill.tex.needsUpdate = true
  }),
)

const STAR_POS = new Float32Array(1200)
for (let i = 0; i < STAR_POS.length; i += 3) {
  STAR_POS[i] = (Math.random() - 0.5) * 34
  STAR_POS[i + 1] = (Math.random() - 0.5) * 20
  STAR_POS[i + 2] = -5 - Math.random() * 12
}

/* ---------- layout: where everything sits for each section, per viewport ---------- */

// a card placed so it fills a screen-space box (fractions of the viewport) at a given depth
function rectAt(aspect: number, fx: number, fy: number, depth: number, maxW: number, maxH: number) {
  const vh = 2 * (CAM_Z - depth) * TAN
  const vw = vh * aspect
  return { x: (fx - 0.5) * vw, y: (0.5 - fy) * vh, z: depth, s: Math.min((maxW * vw) / CARD_W, (maxH * vh) / CARD_H) }
}

// stops per section: [planet x, y, z, scale, chips→screens, card visibility, canvas opacity]
function layout(w: number, h: number) {
  const aspect = w / h
  const portrait = aspect < 0.85
  const vh0 = 2 * CAM_Z * TAN
  const vw0 = vh0 * aspect
  const front = portrait ? rectAt(aspect, 0.5, 0.24, 2.2, 0.84, 0.25) : rectAt(aspect, 0.5, 0.36, 2.2, 0.5, 0.46)
  const car = { x: front.x, y: front.y, z: front.z - RING_R * front.s, s: front.s }
  const det = portrait ? rectAt(aspect, 0.5, 0.165, 3, 0.86, 0.19) : rectAt(aspect, 0.71, 0.46, 2.6, 0.5, 0.62)
  if (portrait) {
    // the hero reserves a band above the copy for the planet (see .hero in index.css)
    const ps = Math.min(0.62, vw0 * 0.24)
    const heroY = (0.5 - (72 + 0.17 * h) / h) * vh0
    return {
      portrait, car, det, chip: 0.5,
      stops: [
        [0, heroY, 0, ps, 0, 1, 1],
        [vw0 * 0.32, heroY + 0.2, 1.4, ps * 1.3, 0, 0.3, 0.45],
        [car.x, car.y + 0.25, car.z - 0.6, 1.5, 1, 1, 1],
        [-vw0 * 0.45, 0.4, -1.5, ps, 1, 0, 0.3],
        [-vw0 * 0.45, 0.4, -1.5, ps, 1, 0, 0],
        [0, vh0 * 0.17, 0, ps * 1.05, 0, 0.5, 0.85],
      ],
    }
  }
  return {
    portrait, car, det, chip: 0.34,
    stops: [
      [vw0 * 0.19, 0.55, 0, 1.15, 0, 1, 1],
      [vw0 * 0.33, 0.05, 2, 1.3, 0, 0.3, 0.6],
      [car.x, car.y + 0.35, car.z - 0.6, 2.3, 1, 1, 1],
      [-vw0 * 0.4, -0.2, -1.5, 0.9, 1, 0, 0.35],
      [-vw0 * 0.4, -0.2, -1.5, 0.9, 1, 0, 0],
      [0, 0.25, 0, 1, 0, 0.55, 0.9],
    ],
  }
}

/* ---------- the stage ---------- */

const _o = new THREE.Vector3()
const _c = new THREE.Vector3()
const _d = new THREE.Vector3()

type StageProps = { detail: boolean; still: boolean; fade: (o: number) => void; onReady: () => void; onPick: (i: number) => void }

function Stage({ detail, still, fade, onReady, onPick }: StageProps) {
  const size = useThree((s) => s.size)
  const L = useMemo(() => layout(size.width, size.height), [size.width, size.height])
  const sys = useRef<THREE.Group>(null!)
  const planet = useRef<THREE.Mesh>(null!)
  const sat = useRef<THREE.Group>(null!)
  const meshes = useRef<THREE.Mesh[]>([])
  const hovered = useRef(-1)
  const st = useRef({ p: 0, k: 0, d: 0, t0: -1, frames: 0, active: -1, spin: 0, kick: 0, lastY: 0, theta: 0, op: -1, drawn: -1 })

  useFrame((state, delta) => {
    const dt = Math.min(delta, 1 / 20)
    const s = st.current
    const t = state.clock.elapsedTime
    if (s.t0 < 0) {
      s.t0 = t
      s.lastY = scrollY
    }
    if (++s.frames === 3) onReady()
    const follow = (cur: number, target: number, rate: number) => (still ? target : cur + (target - cur) * (1 - Math.exp(-rate * dt)))

    const { p, k } = sampleScroll()
    s.p = follow(s.p, p, 4.5)
    s.k = follow(s.k, k, 4)
    s.d = follow(s.d, detail ? 1 : 0, 3.6)
    const dd = ease(s.d)
    const intro = still ? 1 : 1 - Math.pow(1 - clamp01((t - s.t0 - 0.3) / 1.8), 3)

    const i0 = Math.min(Math.floor(s.p), L.stops.length - 1)
    const i1 = Math.min(i0 + 1, L.stops.length - 1)
    const f = ease(s.p - i0)
    const [px, py, pz, ps, mx, vis, op] = L.stops[i0].map((v, n) => mix(v, L.stops[i1][n], f))

    // the planet system drifts between section stops; it revolves one step per project and spins up with scroll speed
    const g = sys.current
    g.position.set(px, py, pz - 1.4 * dd)
    g.scale.setScalar(ps * (0.72 + 0.28 * intro))
    const vy = (scrollY - s.lastY) / Math.max(dt, 1e-3)
    s.lastY = scrollY
    s.kick = follow(s.kick, THREE.MathUtils.clamp(vy * 0.0005, -0.9, 0.9), 2.5)
    if (!still) {
      s.spin += dt * (0.05 + s.kick)
      s.theta += dt * 0.065
      sat.current.rotation.z += dt * 0.22
    }
    planet.current.rotation.y = s.spin - s.k * 0.6
    const glow = intro * (1 - 0.45 * dd)
    PLANET.uniforms.uFade.value = glow
    CORONA.uniforms.uFade.value = glow
    CORONA.uniforms.uTime.value = t
    FLARE.uniforms.uFade.value = glow
    FLARE.uniforms.uTime.value = t
    RING.uniforms.uFade.value = intro * (1 - 0.5 * mx)
    ORBIT.opacity = 0.75 * intro * (1 - 0.55 * mx)

    // the canvas dims for reading sections, and stays lit while a case study is open
    const o = Math.max(op, dd)
    if (Math.abs(o - s.op) > 0.002) {
      fade(o)
      s.op = o
    }

    const par = still || L.portrait ? 0 : 1 - dd
    const cam = state.camera
    cam.position.x = follow(cam.position.x, state.pointer.x * 0.2 * par, 2)
    cam.position.y = follow(cam.position.y, state.pointer.y * 0.12 * par, 2)
    cam.lookAt(0, 0, 0)

    const active = Math.min(N - 1, Math.max(0, Math.round(s.k)))
    if (active !== s.active) {
      const prev = CARDS[s.active]
      if (prev) {
        prev.glitch = Math.max(prev.glitch, 0.5)
        drawScreen(prev.screen.g, prev.p, prev.i, Infinity)
        prev.screen.tex.needsUpdate = true
      }
      Object.assign(CARDS[active], { glitch: 1, sweep: 0, since: t })
      s.active = active
    }

    const gs = g.scale.x
    CARDS.forEach((c, i) => {
      const mesh = meshes.current[i]
      if (!mesh) return
      const theta = s.theta + (i * TAU) / N
      _o.set(Math.cos(theta) * ORBIT_R, Math.sin(theta) * ORBIT_R, 0).applyQuaternion(Q_ORBIT).multiplyScalar(gs).add(g.position)
      const a = ((i - s.k) * TAU) / N
      const phi = Math.atan2(Math.sin(a), Math.cos(a))
      _c.set(L.car.x + Math.sin(phi) * RING_R * L.car.s, L.car.y, L.car.z + Math.cos(phi) * RING_R * L.car.s)
      // chips leave the orbit one after another
      const m = ease(clamp01(mx * 1.4 - i * 0.07))
      mesh.position.lerpVectors(_o, _c, m)
      let sc = mix(L.chip * gs, L.car.s, m)
      let yaw = phi * m
      let opacity = vis * mix(1, Math.pow(clamp01((Math.cos(phi) + 0.15) / 1.15), 1.6), m)
      if (i === active) {
        mesh.position.lerp(_d.set(L.det.x, L.det.y, L.det.z), dd)
        sc = mix(sc, L.det.s, dd)
        yaw = mix(yaw, -0.18, dd)
      } else opacity *= 1 - dd
      if (!still) opacity *= ease(clamp01((t - s.t0 - 0.9 - i * 0.09) / 0.7))
      // on wide screens the headline owns the left half; chips passing behind it fade back
      if (!L.portrait && m < 1) {
        const nx = _c.copy(mesh.position).project(cam).x
        opacity *= mix(mix(0.22, 1, smooth(-0.25, 0.12, nx)), 1, m * clamp01(s.p - 0.5))
      }
      c.hover = follow(c.hover, hovered.current === i ? 1 : 0, 10)
      mesh.scale.setScalar(sc * (1 + 0.14 * c.hover * (1 - m)))
      mesh.rotation.set(0, yaw, 0)
      mesh.visible = opacity > 0.004
      const u = c.mat.uniforms
      u.uOpacity.value = opacity
      u.uMorph.value = smooth(0.3, 0.8, m)
      u.uGlitch.value = still ? 0 : c.glitch * c.glitch
      u.uSweep.value = still ? 1 : c.sweep
      u.uHover.value = c.hover
      u.uTime.value = t
      c.glitch = Math.max(0, c.glitch - dt / 0.85)
      c.sweep = Math.min(1, c.sweep + dt / 1.3)
    })

    // the screen in front runs its workflow live; ~30 fps is plenty for a canvas texture
    const frame = Math.floor(t * 30)
    if ((mx > 0.5 || dd > 0.01) && frame !== s.drawn) {
      s.drawn = frame
      const c = CARDS[active]
      drawScreen(c.screen.g, c.p, active, still ? Infinity : t - c.since)
      c.screen.tex.needsUpdate = true
    }
  })

  // DOM controls and text sit over the canvas; only empty space reaches the cards
  const blocked = (e: ThreeEvent<PointerEvent | MouseEvent>, i: number) => {
    const el = e.nativeEvent.target as Element | null
    return !!el?.closest?.('a, button, input, label, dialog, p, h1, h2, h3, li, dl') || CARDS[i].mat.uniforms.uOpacity.value < 0.3
  }

  return (
    <>
      <group ref={sys}>
        <mesh ref={planet} material={PLANET}>
          <sphereGeometry args={[1, 96, 64]} />
        </mesh>
        <mesh material={CORONA} position={[0, 0, -0.25]}>
          <planeGeometry args={[4.6, 4.6]} />
        </mesh>
        <mesh material={FLARE} position={[SUN.x, SUN.y, 0.3]}>
          <planeGeometry args={[1.1, 1.1]} />
        </mesh>
        <mesh material={RING} rotation={[1.36, 0.08, -0.32]}>
          <ringGeometry args={[1.3, 1.85, 160, 1]} />
        </mesh>
        <mesh material={ORBIT} rotation={[...ORBIT_ROT]}>
          <torusGeometry args={[ORBIT_R, 0.006, 6, 256]} />
        </mesh>
        <group rotation={[1.28, -0.5, 0.6]}>
          <mesh material={ORBIT}>
            <torusGeometry args={[2.95, 0.006, 6, 256]} />
          </mesh>
          <group ref={sat}>
            <mesh position={[2.95, 0, 0]} material={SAT}>
              <sphereGeometry args={[0.07, 24, 16]} />
            </mesh>
            <mesh position={[-2.95, 0, 0]} material={SAT_LIME}>
              <sphereGeometry args={[0.045, 16, 12]} />
            </mesh>
          </group>
        </group>
      </group>
      {CARDS.map((c, i) => (
        <mesh
          key={c.p.id}
          ref={(el) => {
            if (el) meshes.current[i] = el
          }}
          geometry={CARD_GEO}
          material={c.mat}
          onPointerOver={(e) => {
            if (blocked(e, i)) return
            e.stopPropagation()
            hovered.current = i
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            if (hovered.current !== i) return
            hovered.current = -1
            document.body.style.cursor = ''
          }}
          onClick={(e) => {
            if (blocked(e, i)) return
            e.stopPropagation()
            onPick(i)
          }}
        />
      ))}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[STAR_POS, 3]} />
        </bufferGeometry>
        <pointsMaterial size={0.03} color="#7d828c" sizeAttenuation transparent opacity={0.75} />
      </points>
    </>
  )
}

type Props = { detail: boolean; onReady: () => void; onPick: (i: number) => void }

export default function Scene({ detail, onReady, onPick }: Props) {
  const wrap = useRef<HTMLDivElement>(null)
  // integrated GPUs drop to 1x pixel ratio instead of stuttering
  const [dpr, setDpr] = useState(1.25)
  const still = useMemo(() => matchMedia('(prefers-reduced-motion: reduce)').matches, [])
  const fade = useCallback((o: number) => wrap.current?.style.setProperty('opacity', o.toFixed(3)), [])

  return (
    <div ref={wrap} className="scene" aria-hidden="true">
      <Canvas
        flat
        dpr={dpr}
        camera={{ position: [0, 0, CAM_Z], fov: 35 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        eventSource={document.getElementById('root')!}
        eventPrefix="client"
      >
        <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[4, 5, 6]} intensity={1.6} />
        <Stage detail={detail} still={still} fade={fade} onReady={onReady} onPick={onPick} />
      </Canvas>
    </div>
  )
}
