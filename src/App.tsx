import { lazy, Suspense, useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { about, capabilities, experience, hero, profile, projects, sections } from './content'
import { glide, projectScrollY, workProgress } from './scroll'

const Scene = lazy(() => import('./Scene'))

const N = projects.length
const pad = (n: number) => String(n).padStart(2, '0')
const year = new Date().getFullYear()
const still = matchMedia('(prefers-reduced-motion: reduce)').matches
const webgl = !!document.createElement('canvas').getContext('webgl2')
const go = (i: number) => glide(projectScrollY(i), still)

export default function App() {
  const [ready, setReady] = useState(still || !webgl)
  const onSceneReady = useCallback(() => setReady(true), [])
  const [active, setActive] = useState('intro')
  const [hdrInverted, setHdrInverted] = useState(false)
  const [current, setCurrent] = useState(0)
  const [caseOpen, setCaseOpen] = useState(false)
  const menuRef = useRef<HTMLDialogElement>(null)
  const caseRef = useRef<HTMLDialogElement>(null)
  const swap = useSwap(current)
  const P = projects[current]
  const S = projects[swap.shown]

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    })
    // the header sits at the top edge, so it flips on its own band rather than the rail's
    const hdrIo = new IntersectionObserver(([e]) => setHdrInverted(e.isIntersecting), { rootMargin: '0px 0px -90% 0px' })
    hdrIo.observe(document.getElementById('capabilities')!)
    const revealIo = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return
        e.target.classList.add('in')
        revealIo.unobserve(e.target)
      }),
      { rootMargin: '0px 0px -12% 0px' },
    )
    document.querySelectorAll('[data-reveal]').forEach((el) => revealIo.observe(el))
    return () => {
      io.disconnect()
      hdrIo.disconnect()
      revealIo.disconnect()
    }
  }, [])

  useEffect(() => {
    // never hold the page hostage to the 3D scene
    const t = setTimeout(() => setReady(true), 3000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    let raf = 0
    const sync = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setCurrent(Math.round(workProgress() * (N - 1))))
    }
    sync()
    addEventListener('scroll', sync, { passive: true })
    addEventListener('resize', sync)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('scroll', sync)
      removeEventListener('resize', sync)
    }
  }, [])

  // projects snap into place, but only while the work section is on screen
  useEffect(() => {
    document.documentElement.classList.toggle('snap', active === 'work')
  }, [active])

  useEffect(() => {
    if (active !== 'work') return
    const onKey = (e: KeyboardEvent) => {
      if (menuRef.current?.open || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return
      go(current + (e.key === 'ArrowRight' ? 1 : -1))
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [active, current])

  const openCase = () => {
    document.documentElement.classList.add('case-open')
    caseRef.current?.showModal()
    setCaseOpen(true)
  }
  const onPick = (i: number) => (active === 'work' && i === current ? openCase() : go(i))

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      {webgl && (
        <Suspense fallback={null}>
          <Scene detail={caseOpen} onReady={onSceneReady} onPick={onPick} />
        </Suspense>
      )}
      {!still && <Loader ready={ready} />}

      <header className={hdrInverted ? 'hdr invert' : 'hdr'}>
        <a className="brand" href="#intro" aria-label={`${profile.name}, back to top`}>
          {profile.name}
          <i aria-hidden="true" />
        </a>
        <div className="hdr-actions">
          <a className="icon-btn cv-btn" href={profile.cv} download>
            CV <span aria-hidden="true">↓</span>
          </a>
          <button className="icon-btn" type="button" aria-label="Open menu" aria-haspopup="dialog" onClick={() => menuRef.current?.showModal()}>
            <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden="true">
              <path d="M0 1h18M0 6h18M0 11h18" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </header>

      <nav className={active === 'capabilities' ? 'rail invert' : 'rail'} aria-label="Sections">
        <ol>
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} aria-current={active === s.id ? 'true' : undefined}>
                <i aria-hidden="true" />
                {pad(i)} {s.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <dialog ref={menuRef} className="drawer" aria-label="Menu" onClick={(e) => e.target === e.currentTarget && menuRef.current?.close()}>
        <div className="drawer-inner">
          <button className="icon-btn drawer-close" type="button" aria-label="Close menu" onClick={() => menuRef.current?.close()}>
            ✕
          </button>
          <ol>
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} onClick={() => menuRef.current?.close()}>
                  <span className="mono">{pad(i)}</span>
                  {s.label}
                </a>
              </li>
            ))}
          </ol>
          <div className="drawer-foot mono">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a>
          </div>
        </div>
      </dialog>

      <main id="main">
        <section id="intro" className={ready ? 'hero ready' : 'hero'} aria-labelledby="hero-title">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <p className="eyebrow">{profile.role} — {profile.location}</p>
              <h1 id="hero-title" aria-label={hero.headline.join('')}>
                <Words text={hero.headline[0]} from={0} />
                <em><Words text={hero.headline[1]} from={3} tail={hero.headline[2].match(/^[^\s\w]*/)![0]} /></em>
                <Words text={hero.headline[2].replace(/^[^\s\w]*/, '')} from={5} />
              </h1>
              <p className="lede">{hero.lede}</p>
              <div className="actions">
                <a className="btn btn-primary" href="#work" onClick={(e) => { e.preventDefault(); go(0) }}><Slot>View projects</Slot></a>
                <a className="btn" href={profile.cv} download><Slot>Download CV</Slot></a>
                <a className="btn" href="#contact"><Slot>Contact me</Slot></a>
              </div>
            </div>
            <aside className="panel hero-panel" aria-label="Selected work">
              <p className="panel-hd mono">
                Selected work <i aria-hidden="true" />
              </p>
              <ul>
                {projects.map((p, i) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => go(i)}>
                      <span className="mono">{pad(i + 1)}</span>
                      {p.name}
                      <span aria-hidden="true">→</span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section id="about" className="sec" aria-labelledby="about-title">
          <div className="wrap">
            <Eyebrow n={1} label="About" />
            <h2 id="about-title" className="statement" data-reveal>{about.statement}</h2>
            <div className="about-body" data-reveal>
              {about.body.map((t) => <p key={t}>{t}</p>)}
              <dl className="facts mono">
                <div><dt>Based in</dt><dd>{profile.location}</dd></div>
                <div><dt>Availability</dt><dd>{profile.availability}</dd></div>
              </dl>
            </div>
          </div>
        </section>

        <section id="work" className={webgl ? 'work' : 'work flat'} aria-labelledby="work-title" style={{ '--n': N } as CSSProperties}>
          <div className="work-pin">
            {!webgl && (
              <figure className="panel work-fig">
                <Flow steps={S.flow} />
              </figure>
            )}
            <div className="wrap work-ui">
              <div className="wk-main">
                <h2 id="work-title" className="eyebrow">02 — Independent projects</h2>
                <div className={swap.leaving ? 'wk-text out' : 'wk-text'} key={swap.shown} style={{ '--dir': swap.dir } as CSSProperties}>
                  <h3 className="wk-title" style={{ '--k': 0 } as CSSProperties}>{S.name}</h3>
                  <p className="kicker" style={{ '--k': 1 } as CSSProperties}>{S.kicker}</p>
                  <div style={{ '--k': 2 } as CSSProperties}><Tags tags={S.tags} /></div>
                  <p className="wk-desc" style={{ '--k': 3 } as CSSProperties}>{S.summary}</p>
                  <p className="outcome" style={{ '--k': 4 } as CSSProperties}>{S.outcome}</p>
                </div>
              </div>
              <div className="wk-side">
                <p className="wk-count mono" aria-label={`Project ${current + 1} of ${N}`}>
                  <span>{pad(current + 1)}</span>
                  <i><b style={{ transform: `scaleX(${(current + 1) / N})` }} /></i>
                  <span>{pad(N)}</span>
                </p>
                <div className="actions">
                  <button className="btn" type="button" onClick={() => go(current - 1)} disabled={current === 0}><Slot>Prev</Slot></button>
                  <button className="btn" type="button" onClick={() => go(current + 1)} disabled={current === N - 1}><Slot>Next</Slot></button>
                  <button className="btn btn-primary" type="button" onClick={openCase}><Slot>Case study</Slot></button>
                </div>
              </div>
            </div>
            <p className="sr-only" aria-live="polite">{`${S.name}, project ${swap.shown + 1} of ${N}`}</p>
          </div>
          <div className="snaps" aria-hidden="true">
            {projects.map((p, i) => <i key={p.id} style={{ '--i': i } as CSSProperties} />)}
          </div>
        </section>

        <section id="experience" className="sec" aria-labelledby="exp-title">
          <div className="wrap">
            <Eyebrow n={3} label="Experience" />
            <h2 id="exp-title" data-reveal>Professional experience.</h2>
            <ol className="jobs">
              {experience.map((j) => (
                <li key={j.org} className="job" data-reveal>
                  <p className="mono job-period">{j.period}</p>
                  <div>
                    <h3>{j.role} <span>· {j.org}</span></h3>
                    <ul>{j.points.map((t) => <li key={t}>{t}</li>)}</ul>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="capabilities" className="sec invert" aria-labelledby="cap-title">
          <div className="wrap">
            <Eyebrow n={4} label="Capabilities" />
            <h2 id="cap-title" data-reveal>What I work with, and where it shows.</h2>
            <div className="caps">
              {capabilities.map((c) => (
                <div key={c.title} className="cap" data-reveal>
                  <h3>{c.title}</h3>
                  <ul className="pills">{c.items.map((t) => <li key={t}>{t}</li>)}</ul>
                  <p className="mono cap-ev">Evidence</p>
                  <ul className="evidence">
                    {c.evidence.map((e) => (
                      <li key={e.label}>
                        {'project' in e ? (
                          <button type="button" onClick={() => go(projects.findIndex((p) => p.id === e.project))}>{e.label} <span aria-hidden="true">→</span></button>
                        ) : (
                          <a href={`#${e.anchor}`}>{e.label} <span aria-hidden="true">↑</span></a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="sec contact" aria-labelledby="contact-title">
          <div className="wrap">
            <Eyebrow n={5} label="Contact" center />
            <h2 id="contact-title" data-reveal>Let’s build something that ships.</h2>
            <p className="sec-lede" data-reveal>{profile.availability}. Email is the fastest way to reach me.</p>
            <div className="actions center" data-reveal>
              <a className="btn btn-primary" href={`mailto:${profile.email}`}><Slot>Email me</Slot></a>
              <CopyEmail />
              <a className="btn" href={profile.github} target="_blank" rel="noreferrer"><Slot>GitHub ↗</Slot></a>
              <a className="btn" href={profile.cv} download><Slot>Download CV</Slot></a>
            </div>
            <p className="mono contact-meta" data-reveal>
              <a href={`mailto:${profile.email}`}>{profile.email}</a>
              <span>{profile.location}</span>
            </p>
          </div>
        </section>
      </main>

      <footer className="ftr mono">
        <span>© {year} {profile.name}</span>
        <a href="#intro">Back to top ↑</a>
      </footer>

      <dialog
        ref={caseRef}
        className="case"
        aria-labelledby="case-title"
        onClose={() => {
          document.documentElement.classList.remove('case-open')
          setCaseOpen(false)
        }}
        onClick={(e) => e.target === e.currentTarget && caseRef.current?.close()}
      >
        <div className="case-top">
          <p className="mono">{pad(current + 1)} / {pad(N)} · Case study</p>
          <button className="icon-btn" type="button" aria-label="Close case study" onClick={() => caseRef.current?.close()}>✕</button>
        </div>
        <article className="case-body" key={current}>
          <p className="eyebrow">{P.kicker}</p>
          <h2 id="case-title">{P.name}</h2>
          <Tags tags={P.tags} />
          <p className="case-lede">{P.summary}</p>

          <h3 className="mono">Problem</h3>
          <p>{P.problem}</p>

          <h3 className="mono">What I did</h3>
          <ul className="ticks">{P.contribution.map((t) => <li key={t}>{t}</li>)}</ul>

          <h3 className="mono">Workflow <span>· illustration</span></h3>
          <Flow steps={P.flow} />

          <h3 className="mono">Technology</h3>
          <ul className="pills">{P.tech.map((t) => <li key={t}>{t}</li>)}</ul>

          <h3 className="mono">Outcome</h3>
          <p className="outcome">{P.outcome}</p>
        </article>
        <div className="case-nav">
          <button className="btn" type="button" onClick={() => go(current - 1)} disabled={current === 0}><Slot>Prev</Slot></button>
          <button className="btn" type="button" onClick={() => go(current + 1)} disabled={current === N - 1}><Slot>Next</Slot></button>
          {P.repo && <a className="btn btn-primary" href={P.repo} target="_blank" rel="noreferrer"><Slot>Repository ↗</Slot></a>}
        </div>
      </dialog>
    </>
  )
}

// text leaves in the direction you are travelling, then the next project arrives from the other side
function useSwap(index: number) {
  const [swap, setSwap] = useState({ shown: index, dir: 1 })
  useEffect(() => {
    if (index === swap.shown) return
    const t = setTimeout(() => setSwap({ shown: index, dir: index > swap.shown ? 1 : -1 }), still ? 0 : 200)
    return () => clearTimeout(t)
  }, [index, swap.shown])
  const leaving = index !== swap.shown
  return { shown: swap.shown, leaving, dir: leaving ? (index > swap.shown ? 1 : -1) : swap.dir }
}

// the label rolls up and a copy rolls in from below on hover
function Slot({ children }: { children: string }) {
  return (
    <span className="slot">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  )
}

function Eyebrow({ n, label, center }: { n: number; label: string; center?: boolean }) {
  return <p className={center ? 'eyebrow center' : 'eyebrow'} data-reveal>{pad(n)} — {label}</p>
}

// each word rises out of its own clipped line box; --i staggers them
// tail: punctuation glued to the last word so it can't wrap onto its own line
function Words({ text, from, tail }: { text: string; from: number; tail?: string }) {
  const parts = text.split(/(\s+)/)
  return parts.map((w, i) =>
    /^\s+$/.test(w) || !w ? w : (
      <span key={i} className="w" aria-hidden="true">
        <span style={{ '--i': from + i / 2 } as CSSProperties}>
          {w}
          {tail && i === parts.length - 1 && <span className="plain">{tail}</span>}
        </span>
      </span>
    ),
  )
}

function Loader({ ready }: { ready: boolean }) {
  const [pct, setPct] = useState(0)
  const [done, setDone] = useState(false)
  const [gone, setGone] = useState(false)
  useEffect(() => {
    // a timer, not rAF: a throttled or background tab must still get past the loader
    const id = setInterval(() => setPct((p) => Math.min(100, p + (ready ? 9 : Math.max(0.5, (90 - p) * 0.06)))), 40)
    if (!ready) return () => clearInterval(id)
    const out = setTimeout(() => setDone(true), 450)
    const end = setTimeout(() => setGone(true), 1100)
    return () => {
      clearInterval(id)
      clearTimeout(out)
      clearTimeout(end)
    }
  }, [ready])
  if (gone) return null
  const ticks = Array.from({ length: 11 }, (_, i) => i * 25)
  return (
    <div className={done ? 'loader out' : 'loader'} aria-hidden="true">
      <p>AI engineer building agentic systems, RAG and LLM applications</p>
      <svg viewBox="-10 -10 270 20" width="270" height="20">
        <line x1="0" x2="250" stroke="#2a2b30" />
        <line x1="0" x2={pct * 2.5} stroke="#9a9ea8" />
        {ticks.map((x) => <line key={x} x1={x} x2={x} y1="-4" y2="4" stroke="#3a3c43" />)}
        <rect x={pct * 2.5 - 4} y="-4" width="8" height="8" fill="#d7ff00" transform={`rotate(45 ${pct * 2.5} 0)`} />
      </svg>
      <b>{Math.floor(pct)}%</b>
    </div>
  )
}

function Tags({ tags }: { tags: string[] }) {
  return <ul className="tags">{tags.map((t) => <li key={t}>{t}</li>)}</ul>
}

function Flow({ steps }: { steps: string[] }) {
  return (
    <ol className="flow">
      {steps.map((s, i) => (
        <li key={s} className={/human/i.test(s) ? 'human' : undefined}>
          <span className="mono">{pad(i + 1)}</span>
          {s}
        </li>
      ))}
    </ol>
  )
}

function CopyEmail() {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')
  useEffect(() => {
    if (state === 'idle') return
    const t = setTimeout(() => setState('idle'), 2500)
    return () => clearTimeout(t)
  }, [state])
  const copy = () => navigator.clipboard.writeText(profile.email).then(() => setState('copied'), () => setState('failed'))
  return (
    <>
      <button className="btn" type="button" onClick={copy}>
        <Slot>{state === 'copied' ? 'Copied ✓' : state === 'failed' ? 'Copy failed' : 'Copy email'}</Slot>
      </button>
      <span className="sr-only" aria-live="polite">
        {state === 'copied' ? 'Email address copied' : state === 'failed' ? `Copy failed. The address is ${profile.email}` : ''}
      </span>
    </>
  )
}
