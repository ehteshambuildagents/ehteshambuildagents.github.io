import { projects } from './content'

const N = projects.length
const IDS = ['intro', 'about', 'work', 'experience', 'capabilities', 'contact']
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

// 0..1 through the pinned part of the work section
export function workProgress() {
  const sec = document.getElementById('work')
  const pin = sec?.firstElementChild as HTMLElement | null
  if (!sec || !pin) return 0
  const r = sec.getBoundingClientRect()
  return clamp01(-r.top / Math.max(1, r.height - pin.offsetHeight))
}

// p: fractional section index (0 intro … 5 contact); a hand-off runs while the next
// section's top climbs from the bottom of the viewport to its middle.
// k: fractional project index inside the pinned work section.
export function sampleScroll() {
  const vh = innerHeight
  let p = 0
  for (let i = 1; i < IDS.length; i++) {
    const top = document.getElementById(IDS[i])?.getBoundingClientRect().top ?? vh
    p = i - 1 + clamp01((vh - top) / (vh * 0.5))
    if (top > vh * 0.5) break
  }
  return { p, k: workProgress() * (N - 1) }
}

export function projectScrollY(i: number) {
  const sec = document.getElementById('work')!
  const pin = sec.firstElementChild as HTMLElement
  const top = sec.getBoundingClientRect().top + scrollY
  return top + ((sec.offsetHeight - pin.offsetHeight) * Math.min(N - 1, Math.max(0, i))) / (N - 1)
}

// a scripted scroll with a long ease-in-out so the scene has time to travel; any user input takes over
let raf = 0
let run = 0
export function glide(to: number, still: boolean) {
  cancelAnimationFrame(raf)
  const root = document.documentElement
  const from = scrollY
  const d = to - from
  if (Math.abs(d) < 2) return
  const id = ++run
  const stop = () => {
    // a newer glide owns the frame loop now; only unhook this one's listeners
    if (id === run) {
      cancelAnimationFrame(raf)
      root.classList.remove('gliding')
    }
    removeEventListener('wheel', stop)
    removeEventListener('touchstart', stop)
    removeEventListener('keydown', stop)
  }
  root.classList.add('gliding')
  if (still) {
    scrollTo(0, to)
    stop()
    return
  }
  addEventListener('wheel', stop, { passive: true })
  addEventListener('touchstart', stop, { passive: true })
  addEventListener('keydown', stop)
  const dur = Math.min(2200, 800 + Math.abs(d) * 0.3)
  const t0 = performance.now()
  const step = (now: number) => {
    const t = Math.min(1, (now - t0) / dur)
    const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
    scrollTo(0, from + d * e)
    if (t < 1) raf = requestAnimationFrame(step)
    else stop()
  }
  raf = requestAnimationFrame(step)
}
