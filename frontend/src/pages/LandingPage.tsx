import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
const CREDENTIALS = { username: 'admin', password: 'admin123' }

// ── Magnetic cursor ────────────────────────────────────────
function MagneticCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const dotRef = useRef<HTMLDivElement>(null)
  const pos = useRef({ x: 0, y: 0 })
  const target = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    if (isMobile) return // Disable custom cursor on mobile
    
    const move = (e: MouseEvent) => { target.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', move)
    let raf: number
    const loop = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.12
      pos.current.y += (target.current.y - pos.current.y) * 0.12
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${pos.current.x - 20}px,${pos.current.y - 20}px)`
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate(${target.current.x - 3}px,${target.current.y - 3}px)`
      }
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => { window.removeEventListener('mousemove', move); cancelAnimationFrame(raf) }
  }, [])

  // Don't render custom cursor on mobile
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.matchMedia('(max-width: 768px)').matches)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  if (isMobile) return null

  return (
    <>
      <div ref={cursorRef} style={{
        position:'fixed', top:0, left:0, width:40, height:40, borderRadius:'50%',
        border:'1px solid rgba(139,92,246,0.5)', pointerEvents:'none', zIndex:9999,
        transition:'opacity 0.3s', mixBlendMode:'difference',
      }}/>
      <div ref={dotRef} style={{
        position:'fixed', top:0, left:0, width:6, height:6, borderRadius:'50%',
        background:'#a78bfa', pointerEvents:'none', zIndex:9999,
      }}/>
    </>
  )
}

function FadeIn({ children, delay = 0, className = '' }: { 
  children: React.ReactNode; delay?: number; className?: string 
}) {
  const { ref, inView } = useInView()
  return (
    <div ref={ref} className={`transition-all duration-1000 ${className} 
      ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      style={{ transitionDelay:`${delay}ms` }}>
      {children}
    </div>
  )
}

// ── Count up ───────────────────────────────────────────────
function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    let t0: number
    const step = (ts: number) => {
      if (!t0) t0 = ts
      const p = Math.min((ts - t0) / duration, 1)
      const e = 1 - Math.pow(1 - p, 4)
      setCount(Math.floor(e * target))
      if (p < 1) requestAnimationFrame(step)
      else setCount(target)
    }
    requestAnimationFrame(step)
  }, [target, duration, start])
  return count
}

// ── InView ─────────────────────────────────────────────────
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true) }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return { ref, inView }
}

// ── Noise Grid Background ──────────────────────────────────
function NoiseGrid() {
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}>
      {/* Radial vignette */}
      <div style={{
        position:'absolute', inset:0,
        background:'radial-gradient(ellipse 80% 80% at 50% -10%, rgba(109,40,217,0.18) 0%, transparent 60%)',
      }}/>
      <div style={{
        position:'absolute', inset:0,
        background:'radial-gradient(ellipse 60% 60% at 80% 100%, rgba(139,92,246,0.08) 0%, transparent 50%)',
      }}/>
      {/* SVG grid */}
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.04 }}
        xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="g" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)"/>
      </svg>
    </div>
  )
}

// ── Shimmer text ───────────────────────────────────────────
function ShimmerText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`shimmer-text ${className}`} style={{
      background:'linear-gradient(105deg, #ffffff 40%, #a78bfa 50%, #ffffff 60%)',
      backgroundSize:'200% auto',
      WebkitBackgroundClip:'text',
      WebkitTextFillColor:'transparent',
      backgroundClip:'text',
      animation:'shimmer 4s linear infinite',
    }}>{children}</span>
  )
}

// ── Animated Ring ──────────────────────────────────────────
function AnimatedRing({ size, color, duration, delay = 0 }: {
  size: number; color: string; duration: number; delay?: number
}) {
  return (
    <div style={{
      position:'absolute', top:'50%', left:'50%',
      width:size, height:size,
      marginLeft:-size/2, marginTop:-size/2,
      borderRadius:'50%',
      border:`1px solid ${color}`,
      animation:`ringPulse ${duration}s ease-out infinite`,
      animationDelay:`${delay}s`,
      pointerEvents:'none',
    }}/>
  )
}

// ── Particle Canvas ────────────────────────────────────────
function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current; if (!c) return
    const ctx = c.getContext('2d')!
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight }
    resize(); window.addEventListener('resize', resize)
    const pts = Array.from({ length: 80 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
    }))
    let af: number
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height)
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y
          const d = Math.sqrt(dx*dx + dy*dy)
          if (d < 130) {
            const a = 0.12 * (1 - d / 130)
            ctx.beginPath()
            ctx.strokeStyle = `rgba(139,92,246,${a})`
            ctx.lineWidth = 0.7
            ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y)
            ctx.stroke()
          }
        }
      }
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2)
        ctx.fillStyle = 'rgba(167,139,250,0.55)'; ctx.fill()
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > c.width) p.vx *= -1
        if (p.y < 0 || p.y > c.height) p.vy *= -1
      })
      af = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(af); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={ref} style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.5 }}/>
}

// ── Risk Gauge ─────────────────────────────────────────────
function RiskGauge() {
  const levels = [
    { label:'Low Risk',    color:'#10b981', angle:30  },
    { label:'Medium Risk', color:'#f59e0b', angle:90  },
    { label:'High Risk',   color:'#ef4444', angle:150 },
  ]
  const [idx, setIdx] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i+1) % 3), 2200)
    return () => clearInterval(t)
  }, [])
  const cur = levels[idx]
  const r = 68, cx = 90, cy = 90
  const toRad = (d: number) => (d - 180) * Math.PI / 180
  const nx = cx + r * Math.cos(toRad(cur.angle))
  const ny = cy + r * Math.sin(toRad(cur.angle))
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
      <svg width="180" height="108" viewBox="0 0 180 108" style={{ maxWidth: '100%', height: 'auto' }}>
        <defs>
          <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3"/>
          </linearGradient>
        </defs>
        <path d="M 22 90 A 68 68 0 0 1 158 90" fill="none" stroke="url(#arcGrad)" strokeWidth="10" strokeLinecap="round"/>
        <path d="M 22 90 A 68 68 0 0 1 63 33" fill="none" stroke="#10b981" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.35"/>
        <path d="M 63 33 A 68 68 0 0 1 117 33" fill="none" stroke="#f59e0b" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.35"/>
        <path d="M 117 33 A 68 68 0 0 1 158 90" fill="none" stroke="#ef4444" strokeWidth="10" strokeLinecap="round" strokeOpacity="0.35"/>
        <line x1={cx} y1={cy} x2={nx} y2={ny}
          stroke={cur.color} strokeWidth="2.5" strokeLinecap="round"
          style={{ transition:'all 0.9s cubic-bezier(0.34,1.56,0.64,1)' }}/>
        <circle cx={cx} cy={cy} r="5" fill={cur.color}
          style={{ transition:'fill 0.5s', filter:`drop-shadow(0 0 5px ${cur.color})` }}/>
        <text x="16"  y="107" fill="#10b981" fontSize="8" fontWeight="600">LOW</text>
        <text x="77"  y="20"  fill="#f59e0b" fontSize="8" fontWeight="600">MED</text>
        <text x="136" y="107" fill="#ef4444" fontSize="8" fontWeight="600">HIGH</text>
      </svg>
      <p style={{ fontSize:15, fontWeight:700, marginTop:4, color:cur.color, transition:'color 0.5s', letterSpacing:'0.02em' }}>
        {cur.label}
      </p>
    </div>
  )
}

// ── Animated Bar Chart ─────────────────────────────────────
function AnimatedBars() {
  const bars = [
    { label:'Jan', l:45, m:30, h:25 },
    { label:'Feb', l:55, m:25, h:20 },
    { label:'Mar', l:35, m:40, h:25 },
    { label:'Apr', l:60, m:25, h:15 },
    { label:'May', l:50, m:30, h:20 },
    { label:'Jun', l:40, m:35, h:25 },
  ]
  const [on, setOn] = useState(false)
  useEffect(() => { setTimeout(() => setOn(true), 400) }, [])
  return (
    <div>
      <p style={{ fontSize:11, color:'#9ca3af', marginBottom:10, letterSpacing:'0.05em', textTransform:'uppercase' }}>
        Monthly Risk Distribution
      </p>
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, height:80 }}>
        {bars.map((b, i) => (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
            {[
              { h:b.h, c:'rgba(239,68,68,0.7)' },
              { h:b.m, c:'rgba(245,158,11,0.7)' },
              { h:b.l, c:'rgba(16,185,129,0.7)' },
            ].map(({ h, c }, j) => (
              <div key={j} style={{
                width:'100%', borderRadius:2,
                background: c,
                height: on ? `${h * 0.45}px` : '0px',
                transition:`height 0.9s cubic-bezier(0.34,1.56,0.64,1)`,
                transitionDelay:`${i * 80 + j * 60}ms`,
              }}/>
            ))}
            <span style={{ fontSize:9, color:'#9ca3af', marginTop:2 }}>{b.label}</span>
          </div>
        ))}
      </div>
      <div style={{ display:'flex', gap:12, marginTop:10, flexWrap: 'wrap' }}>
        {[['#10b981','Low'],['#f59e0b','Med'],['#ef4444','High']].map(([c,l]) => (
          <div key={l} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:c }}/>
            <span style={{ fontSize:9, color:'#9ca3af' }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── 3D Tilt Card ───────────────────────────────────────────
function TiltCard() {
  const ref = useRef<HTMLDivElement>(null)
  const [rx, setRx] = useState(0); const [ry, setRy] = useState(0)
  const [mx, setMx] = useState(50); const [my, setMy] = useState(50)
  const onMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height
    setRy((x - 0.5) * 22); setRx(-(y - 0.5) * 22)
    setMx(x * 100); setMy(y * 100)
  }, [])
  return (
    <div ref={ref} onMouseMove={onMove} onMouseLeave={() => { setRx(0); setRy(0) }}
      style={{ perspective:1000, cursor:'default' }}>
      <div style={{
        borderRadius:16, border:'1px solid rgba(139,92,246,0.2)',
        background:'rgba(255,255,255,0.03)', backdropFilter:'blur(12px)',
        padding:20, transition:'transform 0.2s',
        transform:`rotateX(${rx}deg) rotateY(${ry}deg)`,
        boxShadow:`${-ry * 0.5}px ${rx * 0.5}px 30px rgba(109,40,217,0.15)`,
        position:'relative', overflow:'hidden',
      }}>
        {/* Glare */}
        <div style={{
          position:'absolute', inset:0, borderRadius:16, pointerEvents:'none',
          background:`radial-gradient(circle at ${mx}% ${my}%, rgba(167,139,250,0.12) 0%, transparent 60%)`,
          transition:'background 0.1s',
        }}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14, flexWrap: 'wrap', gap: 8 }}>
          <p style={{ fontSize:11, color:'#9ca3af', letterSpacing:'0.05em', textTransform:'uppercase' }}>Customer Analysis</p>
          <span style={{ padding:'2px 10px', borderRadius:20, background:'rgba(239,68,68,0.15)',
            border:'1px solid rgba(239,68,68,0.3)', color:'#f87171', fontSize:11, fontWeight:600 }}>
            High Risk
          </span>
        </div>
        <p style={{ fontWeight:700, fontSize:17, color:'#f3f4f6', marginBottom:2 }}>Ahmed Khan</p>
        <p style={{ fontSize:11, color:'#9ca3af', marginBottom:16 }}>Credit: $8,500 · 36 months · Car Loan</p>
        {[
          { l:'Credit Amount', v:84, c:'#ef4444' },
          { l:'Loan Duration', v:72, c:'#f59e0b' },
          { l:'Savings Level', v:30, c:'#10b981' },
        ].map(b => (
          <div key={b.l} style={{ marginBottom:10 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'#9ca3af', marginBottom:4 }}>
              <span>{b.l}</span><span>{b.v}%</span>
            </div>
            <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2 }}>
              <div style={{ height:'100%', borderRadius:2, width:`${b.v}%`, background:b.c,
                boxShadow:`0 0 6px ${b.c}60` }}/>
            </div>
          </div>
        ))}
        <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.06)',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:11, color:'#9ca3af' }}>AI Confidence</span>
          <span style={{ color:'#f87171', fontWeight:800, fontSize:15 }}>84.7%</span>
        </div>
      </div>
    </div>
  )
}

// ── Glow Button ────────────────────────────────────────────
function GlowButton({ onClick, children, variant = 'primary', className = '' }: {
  onClick?: () => void; children: React.ReactNode; variant?: 'primary'|'ghost'; className?: string
}) {
  const [hov, setHov] = useState(false)
  if (variant === 'ghost') return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className={className}
      style={{
        padding:'14px 32px', borderRadius:12, border:'1px solid rgba(139,92,246,0.3)',
        background: hov ? 'rgba(139,92,246,0.08)' : 'transparent',
        color: hov ? '#c4b5fd' : '#9ca3af', fontWeight:700, fontSize:16,
        cursor:'pointer', transition:'all 0.25s', letterSpacing:'0.01em',
        '@media (max-width: 640px)': {
          padding:'12px 24px',
          fontSize:14,
        }
      } as any}>
      {children}
    </button>
  )
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className={className}
      style={{
        padding:'8px 12px', borderRadius:12, border:'none',
        background: hov
          ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
          : 'linear-gradient(135deg, #7c3aed, #5b21b6)',
        color:'#fff', fontWeight:700, fontSize:16, cursor:'pointer',
        boxShadow: hov ? '0 0 40px rgba(139,92,246,0.5), 0 8px 30px rgba(109,40,217,0.4)' : '0 4px 20px rgba(109,40,217,0.3)',
        transform: hov ? 'translateY(-2px) scale(1.02)' : 'none',
        transition:'all 0.25s', letterSpacing:'0.01em',
        '@media (max-width: 640px)': {
          padding:'12px 24px',
          fontSize:14,
        }
      } as any}>
      {children}
    </button>
  )
}

// ── Feature Card ───────────────────────────────────────────
function FeatureCard({ icon, title, desc, color, index, visible }: {
  icon: string; title: string; desc: string; color: string; index: number; visible: boolean
}) {
  const [hov, setHov] = useState(false)
  const colorMap: Record<string, { border: string; glow: string; text: string; bg: string }> = {
    violet: { border:'rgba(139,92,246,0.25)',  glow:'rgba(139,92,246,0.12)', text:'#a78bfa', bg:'rgba(139,92,246,0.06)' },
    blue:   { border:'rgba(59,130,246,0.25)',  glow:'rgba(59,130,246,0.12)', text:'#60a5fa', bg:'rgba(59,130,246,0.06)' },
    emerald:{ border:'rgba(16,185,129,0.25)', glow:'rgba(16,185,129,0.12)', text:'#34d399', bg:'rgba(16,185,129,0.06)' },
    amber:  { border:'rgba(245,158,11,0.25)', glow:'rgba(245,158,11,0.12)', text:'#fbbf24', bg:'rgba(245,158,11,0.06)' },
    pink:   { border:'rgba(236,72,153,0.25)', glow:'rgba(236,72,153,0.12)', text:'#f472b6', bg:'rgba(236,72,153,0.06)' },
    red:    { border:'rgba(239,68,68,0.25)',  glow:'rgba(239,68,68,0.12)',  text:'#f87171', bg:'rgba(239,68,68,0.06)' },
  }
  const c = colorMap[color] ?? colorMap.violet
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:16, border:`1px solid ${hov ? c.border : 'rgba(255,255,255,0.06)'}`,
        background: hov ? `linear-gradient(135deg, ${c.bg}, rgba(255,255,255,0.02))` : 'rgba(255,255,255,0.025)',
        padding:24, transition:'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        transform: visible ? (hov ? 'translateY(-4px)' : 'translateY(0)') : 'translateY(24px)',
        opacity: visible ? 1 : 0,
        transitionDelay:`${index * 70}ms`,
        boxShadow: hov ? `0 20px 40px ${c.glow}, inset 0 0 0 1px ${c.border}` : 'none',
        cursor:'default',
      }}>
      {/* Icon placeholder — user will swap src */}
      <div style={{
        width:44, height:44, borderRadius:12, marginBottom:16,
        background:`linear-gradient(135deg, ${c.glow}, transparent)`,
        border:`1px solid ${c.border}`,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <img src={icon} width={24} height={24} alt={title}
          style={{ filter:`drop-shadow(0 0 4px ${c.text})` }}
          onError={e => { (e.currentTarget as HTMLImageElement).style.display='none' }}/>
      </div>
      <h3 style={{ fontSize:16, fontWeight:700, color:'#f3f4f6', marginBottom:8, letterSpacing:'0.01em' }}>
        {title}
      </h3>
      <p style={{ fontSize:13, color:'#9ca3af', lineHeight:1.7 }}>{desc}</p>
    </div>
  )
}

// ── Step Card ──────────────────────────────────────────────
function StepCard({ num, icon, title, desc, color, index, visible }: {
  num: string; icon: string; title: string; desc: string; color: string; index: number; visible: boolean
}) {
  const [hov, setHov] = useState(false)
  const colors: Record<string, string> = {
    violet:'#8b5cf6', blue:'#3b82f6', emerald:'#10b981'
  }
  const c = colors[color] ?? colors.violet
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        borderRadius:16, border:`1px solid ${hov ? `${c}40` : 'rgba(255,255,255,0.06)'}`,
        background: hov ? `rgba(${color==='violet'?'139,92,246':color==='blue'?'59,130,246':'16,185,129'},0.05)` : 'rgba(255,255,255,0.025)',
        padding:32, transition:'all 0.4s cubic-bezier(0.4,0,0.2,1)',
        transform: visible ? (hov ? 'translateY(-6px)' : 'translateY(0)') : 'translateY(32px)',
        opacity: visible ? 1 : 0,
        transitionDelay:`${index * 120}ms`,
        position:'relative', overflow:'hidden',
      }}>
      <div style={{
        fontSize:72, fontWeight:900, position:'absolute', top:-8, right:16,
        color: c, opacity:0.07, lineHeight:1, userSelect:'none', fontFamily:'monospace',
      }}>{num}</div>

      <div style={{ marginBottom:16 }}>
        <img src={icon} width={36} height={36} alt={title}
            style={{ filter:`drop-shadow(0 0 6px ${c})` }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display='none' }}/>
    </div>

      <h3 style={{ fontSize:18, fontWeight:700, color:'#f3f4f6', marginBottom:10 }}>{title}</h3>
      <p style={{ fontSize:13, color:'#9ca3af', lineHeight:1.75 }}>{desc}</p>
    </div>
  )
}

// ── Stat Counter ───────────────────────────────────────────
function StatItem({ value, suffix, label, color, visible }: {
  value: number; suffix: string; label: string; color: string; visible: boolean
}) {
  const n = useCountUp(value, 2000, visible)
  const [hov, setHov] = useState(false)
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ textAlign:'center', transition:'transform 0.3s',
        transform: hov ? 'scale(1.08)' : 'scale(1)' }}>
      <p style={{ fontSize:52, fontWeight:900, color, marginBottom:6,
        textShadow:`0 0 30px ${color}60`, letterSpacing:'-0.02em',
        fontVariantNumeric:'tabular-nums',
        '@media (max-width: 640px)': { fontSize: 36 }
      } as any}>
        {n}{suffix}
      </p>
      <p style={{ fontSize:13, color:'#9ca3af', letterSpacing:'0.03em', textTransform:'uppercase' }}>{label}</p>
    </div>
  )
}

// ── Login Form ─────────────────────────────────────────────
function LoginForm() {
  const navigate = useNavigate()
  const [user, setUser] = useState(''); const [pass, setPass] = useState('')
  const [err, setErr] = useState(''); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false)
  const [focus, setFocus] = useState<string|null>(null)

  const submit = () => {
    if (!user || !pass) { setErr('Please fill both fields.'); return }
    if (user === CREDENTIALS.username && pass === CREDENTIALS.password) {
      setLoading(true); setTimeout(() => navigate('/upload'), 1200)
    } else setErr('Invalid username or password.')
  }

  const inputStyle = (name: string): React.CSSProperties => ({
    width:'100%', boxSizing:'border-box',
    paddingLeft:44, paddingRight: name==='pass' ? 48 : 16,
    paddingTop:14, paddingBottom:14,
    borderRadius:12, border:`1px solid ${focus===name ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.08)'}`,
    background: focus===name ? 'rgba(139,92,246,0.05)' : 'rgba(255,255,255,0.03)',
    color:'#f3f4f6', fontSize:14, outline:'none', transition:'all 0.25s',
    boxShadow: focus===name ? '0 0 0 3px rgba(139,92,246,0.12)' : 'none',
  })

  return (
    <div style={{
      borderRadius:20, border:'1px solid rgba(139,92,246,0.2)',
      background:'rgba(255,255,255,0.025)', backdropFilter:'blur(20px)',
      padding:36, position:'relative', overflow:'hidden',
      boxShadow:'0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)',
      '@media (max-width: 640px)': { padding: 24 }
    } as any}>
      <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200,
        borderRadius:'50%', background:'rgba(109,40,217,0.08)', filter:'blur(40px)' }}/>
      <div style={{ position:'absolute', bottom:-40, left:-40, width:160, height:160,
        borderRadius:'50%', background:'rgba(139,92,246,0.06)', filter:'blur(30px)' }}/>
      <div style={{ position:'relative' }}>
        {/* Username */}
        <div style={{ marginBottom:18 }}>
          <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:8,
            fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Username</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
              fontSize:16, color:'#9ca3af' }}>👤</span>
            <input type="text" value={user} placeholder="Enter username"
              onChange={e => { setUser(e.target.value); setErr('') }}
              onFocus={() => setFocus('user')} onBlur={() => setFocus(null)}
              onKeyDown={e => e.key==='Enter' && submit()}
              style={inputStyle('user')}/>
          </div>
        </div>
        {/* Password */}
        <div style={{ marginBottom:18 }}>
          <label style={{ display:'block', fontSize:12, color:'#9ca3af', marginBottom:8,
            fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>Password</label>
          <div style={{ position:'relative' }}>
            <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)',
              fontSize:16, color:'#9ca3af' }}>🔒</span>
            <input type={show ? 'text' : 'password'} value={pass} placeholder="Enter password"
              onChange={e => { setPass(e.target.value); setErr('') }}
              onFocus={() => setFocus('pass')} onBlur={() => setFocus(null)}
              onKeyDown={e => e.key==='Enter' && submit()}
              style={inputStyle('pass')}/>
            <button onClick={() => setShow(!show)} style={{
              position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer', fontSize:16, color:'#9ca3af', padding:0,
            }}>{show ? <img src="src/assets/show.svg" className='w-5 h-5'></img> : <img src="src/assets/hide.svg" className='w-5 h-5'></img>}</button>
          </div>
        </div>
        {err && (
          <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.1)',
            border:'1px solid rgba(239,68,68,0.25)', color:'#f87171', fontSize:13,
            display:'flex', alignItems:'center', gap:8, marginBottom:18 }}>
            ⚠️ {err}
          </div>
        )}
        <button onClick={submit} disabled={loading} style={{
          width:'100%', padding:'15px', borderRadius:12, border:'none', cursor: loading ? 'default' : 'pointer',
          background: loading ? 'rgba(139,92,246,0.4)' : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          color:'#fff', fontWeight:700, fontSize:16, letterSpacing:'0.02em',
          boxShadow: loading ? 'none' : '0 8px 30px rgba(109,40,217,0.4)',
          transition:'all 0.25s', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
        }}>
          {loading ? (
            <>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
                style={{ animation:'spin360 1s linear infinite' }}>
                <circle cx={12} cy={12} r={10} stroke="rgba(255,255,255,0.3)" strokeWidth={3}/>
                <path d="M4 12a8 8 0 018-8v8z" fill="white"/>
              </svg>
              Authenticating...
            </>
          ) : 'Login →'}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────
export default function LandingPage() {
  const loginRef  = useRef<HTMLDivElement>(null)
  const stepsRef2 = useRef<HTMLDivElement>(null)

  const { ref: statsRef,    inView: statsInView    } = useInView()
  const { ref: featuresRef, inView: featuresInView } = useInView()
  const { ref: stepsRef,    inView: stepsInView    } = useInView()

  const features = [
    { icon:'src/assets/brain.svg',    title:'Explainable AI',      desc:'Understand exactly why each customer was flagged with detailed factor breakdowns and SHAP values.',    color:'violet' },
    { icon:'src/assets/chart.svg',    title:'Visual Analytics',    desc:'Interactive dashboards showing risk distribution, confidence scores, and loan portfolio patterns.',      color:'blue'   },
    { icon:'src/assets/shield.svg',   title:'Secure & Private',    desc:'All computation runs locally. No data ever leaves your server, full regulatory compliance.',           color:'emerald'},
    { icon:'src/assets/cpu.svg',      title:'AI-Powered Core',     desc:'Random Forest trained on 1000+ records, analyzing multiple features per customer in milliseconds.',           color:'amber'  },
    { icon:'src/assets/database.svg', title:'Prediction History',  desc:'Full audit trail of every upload, batch management, export reports and team collaboration tools.',       color:'violet' },
    { icon:'src/assets/lock.svg',     title:'Role-Based Access',   desc:'Granular permission system ensures only authorized staff can access sensitive prediction data.',         color:'pink'   },
  ]

  const steps = [
    { num:'01', icon:'src/assets/ai-brain.svg', title:'Upload Excel File',    desc:'Download our template, fill in customer data fields, and upload to the platform in one click.',     color:'violet'  },
    { num:'02', icon:'src/assets/ai-cpu.svg', title:'AI Analyzes Data',     desc:'Random Forest model processes multiple features per customer and predicts default risk instantly.',    color:'blue'    },
    { num:'03', icon:'src/assets/ai-chart.svg', title:'Get Risk Predictions', desc:'View Low, Medium or High risk labels with full confidence scores and AI reasoning explanations.',    color:'emerald' },
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#08070e', color:'#f3f4f6', overflowX:'hidden', fontFamily:`'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif` }}>
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0.45,
          pointerEvents: 'none',
        }}
    >
      <source src="src/components/video.mp4" type="video/mp4" />
    </video>

    {/* Dark Overlay */}
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(3,7,18,0.65)',
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />




    <div style={{ position: 'relative', zIndex: 2 }}>

      <MagneticCursor />
      <NoiseGrid />

      <style>{`
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes floatR { 0%,100%{transform:translateY(0) rotate(2deg)} 50%{transform:translateY(-10px) rotate(-2deg)} }
        @keyframes ringPulse { 0%{transform:translate(-50%,-50%) scale(0.8);opacity:0.6} 100%{transform:translate(-50%,-50%) scale(1.8);opacity:0} }
        @keyframes spin360 { to{transform:rotate(360deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes heroFade { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gradShift {
          0%,100%{background-position:0% 50%}
          50%{background-position:100% 50%}
        }
        .hero-title {
          background: linear-gradient(135deg, #ffffff 0%, #e2d9f3 30%, #a78bfa 55%, #7c3aed 70%, #ffffff 100%);
          background-size:300% 300%;
          animation: gradShift 6s ease infinite;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
        }
        .nav-blur { backdrop-filter:blur(20px); -webkit-backdrop-filter:blur(20px); }
        @media (pointer: fine) {
          * { cursor: none !important; }
        }
        @media (max-width: 768px) {
          * { cursor: auto !important; }
        }
        ::placeholder { color:#9ca3af !important; }
        
        /* Responsive styles */
        @media (max-width: 1024px) {
          .hero-title { font-size: 48px; }
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 36px; }
        }
        @media (max-width: 640px) {
          .hero-title { font-size: 32px; }
        }
        
        @media (max-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .features-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        @media (max-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        
        @media (max-width: 768px) {
          .steps-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .step-connector {
            display: none;
          }
        }
        @media (max-width: 640px) {
          .steps-grid {
            grid-template-columns: 1fr !important;
          }
        }
        
        @media (max-width: 768px) {
          .hero-section {
            flex-direction: column;
          }
          .hero-left, .hero-right {
            width: 100%;
          }
        }
        
        @media (max-width: 640px) {
          .hero-stats {
            flex-wrap: wrap;
            gap: 16px;
          }
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className="nav-blur" style={{
        position:'sticky', top:0, zIndex:50,
        borderBottom:'1px solid rgba(255,255,255,0.05)',
        background:'rgba(8,7,14,0.85)',
        padding:'0 16px',
        '@media (max-width: 768px)': { padding: '0 12px' }
      } as any}>
        <div style={{ 
          maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between', height:60,
          '@media (max-width: 640px)': { flexWrap: 'wrap', height: 'auto', padding: '12px 0', gap: 12 }
        } as any}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:32, height:32, borderRadius:8,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:16,
            }}> <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                  fill="none" stroke="#ebdbb2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M8 12h3l1-2 1 4 1-2h2"/>
                </svg></div>
            <span style={{ fontWeight:800, fontSize:17, letterSpacing:'-0.02em',
              background:'linear-gradient(90deg,#fff,#c4b5fd)', WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent', backgroundClip:'text',
              '@media (max-width: 640px)': { fontSize: 14 }
            } as any}>
              Credit Scoring Model
            </span>
          </div>

          {/* Right */}
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{
              display:'flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20,
              background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)',
            }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#10b981',
                boxShadow:'0 0 6px #10b981', animation:'none' }}/>
              <span style={{ fontSize:12, color:'#34d399', fontWeight:600 }}>Model Live</span>
            </div>
            <GlowButton onClick={() => loginRef.current?.scrollIntoView({ behavior:'smooth' })}>
              Login →
            </GlowButton>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position:'relative', minHeight:'100vh',
        display:'flex', alignItems:'center',
        padding:'80px 24px', overflow:'hidden',
        '@media (max-width: 768px)': { padding: '60px 20px' },
        '@media (max-width: 640px)': { padding: '40px 16px' }
      } as any}>
        <ParticleField />

        {/* Concentric rings */}
        <div style={{ position:'absolute', top:'50%', left:'50%', pointerEvents:'none' }}>
          <AnimatedRing size={300} color="rgba(139,92,246,0.12)" duration={3} delay={0}/>
          <AnimatedRing size={500} color="rgba(109,40,217,0.08)" duration={3} delay={1}/>
          <AnimatedRing size={700} color="rgba(76,29,149,0.05)" duration={3} delay={2}/>
        </div>

        <div style={{ 
          maxWidth:1200, margin:'0 auto', width:'100%',
          display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:40,
          position:'relative', zIndex:1,
          '@media (max-width: 768px)': { gap: 32 }
        } as any}>

          {/* Left */}
          <div style={{ animation:'heroFade 0.8s ease forwards' }}>
            {/* Badge */}
            <div style={{
              display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px',
              borderRadius:20, background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.25)',
              marginBottom:32,
            }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#a78bfa',
                boxShadow:'0 0 8px #a78bfa', animation:'float 2s ease-in-out infinite' }}/>
              <span style={{ fontSize:13, color:'#c4b5fd', fontWeight:600, letterSpacing:'0.03em' }}>
                AI-Powered Credit Risk Analysis
              </span>
            </div>

            {/* Headline */}
            <h1 style={{ 
              fontSize:66, fontWeight:900, lineHeight:1.05, marginBottom:24,
              letterSpacing:'-0.03em',
              '@media (max-width: 1024px)': { fontSize: 52 },
              '@media (max-width: 768px)': { fontSize: 42 },
              '@media (max-width: 640px)': { fontSize: 32 }
            } as any}>
            <span className="hero-title">Smart Credit<br/>Risk Decisions</span>
            <br/>
            <ShimmerText>Powered by AI</ShimmerText>
            </h1>

            <p style={{ 
              fontSize:18, color:'#9ca3af', lineHeight:1.7, marginBottom:36,
              maxWidth:500, animation:'heroFade 0.8s 0.2s ease both',
              '@media (max-width: 768px)': { fontSize: 16 },
              '@media (max-width: 640px)': { fontSize: 14 }
            } as any}>
              Upload customer Excel data and receive instant AI-powered risk predictions
              with full explainability, helping banks make smarter loan decisions.
            </p>

            <div style={{ display:'flex', gap:14, flexWrap:'wrap',
              animation:'heroFade 0.8s 0.4s ease both' }}>
              <GlowButton onClick={() => loginRef.current?.scrollIntoView({ behavior:'smooth' })}>
                Get Started →
              </GlowButton>
              <GlowButton variant="ghost" onClick={() => stepsRef2.current?.scrollIntoView({ behavior:'smooth' })}>
                How It Works
              </GlowButton>
            </div>

            {/* Mini stats */}
            <div style={{
              display:'flex', gap:32, marginTop:40, paddingTop:36,
              borderTop:'1px solid rgba(255,255,255,0.06)',
              animation:'heroFade 0.8s 0.6s ease both',
              '@media (max-width: 640px)': { gap: 20, flexWrap: 'wrap' }
            } as any}>
              {[['1000+','Training Records'],['76%','Accuracy'],['Multiple','Features Analyzed'],['3','Risk Levels']].map(([v,l]) => (
                <div key={l}>
                  <p style={{ 
                    fontSize:26, fontWeight:900, color:'#fff', letterSpacing:'-0.02em',
                    textShadow:'0 0 20px rgba(139,92,246,0.4)',
                    '@media (max-width: 640px)': { fontSize: 20 }
                  } as any}>{v}</p>
                  <p style={{ fontSize:11, color:'#9ca3af', letterSpacing:'0.04em', textTransform:'uppercase' }}>{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — Visual Stack */}
          <div style={{ display:'flex', flexDirection:'column', gap:16,
            animation:'heroFade 0.8s 0.3s ease both' }}>

            {/* Spinning icon row — replace src with actual SVG paths */}
            <div style={{ display:'flex', justifyContent:'center', gap:24, marginBottom:8 }}>
              {[
                { src:'src/assets/brain.svg', size:56, dur:12, glow:'#a78bfa', cw:true },
                { src:'src/assets/cpu.svg',   size:44, dur:8,  glow:'#60a5fa', cw:false },
                { src:'src/assets/chart.svg', size:50, dur:15, glow:'#34d399', cw:true },
              ].map(({ src, size, dur, glow, cw }) => (
                <div key={src} style={{ position:'relative', width:size, height:size }}>
                  <div style={{ position:'absolute', inset:0, borderRadius:'50%',
                    background:glow, filter:'blur(16px)', opacity:0.3 }}/>
                  <img src={src} width={size} height={size} alt=""
                    style={{ animation:`spin360 ${dur}s linear infinite${cw?'':' reverse'}`,
                      filter:`drop-shadow(0 0 8px ${glow})`, position:'relative', zIndex:1 }}
                    onError={e => { (e.currentTarget as HTMLImageElement).style.display='none' }}/>
                </div>
              ))}
            </div>

            {/* Gauge */}
            <div style={{ borderRadius:16, border:'1px solid rgba(139,92,246,0.15)',
              background:'rgba(255,255,255,0.025)', padding:20, textAlign:'center' }}>
              <p style={{ fontSize:11, color:'#9ca3af', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>
                Live Risk Assessment
              </p>
              <RiskGauge />
            </div>

            {/* Tilt Card */}
            <TiltCard />

            {/* Bar chart */}
            <div style={{ borderRadius:16, border:'1px solid rgba(139,92,246,0.15)',
              background:'rgba(255,255,255,0.025)', padding:20 }}>
              <AnimatedBars />
            </div>

            {/* Floating badges - hidden on mobile */}
            <div style={{
              position:'absolute', left:-24, top:'12%',
              padding:'8px 14px', borderRadius:12,
              background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)',
              backdropFilter:'blur(10px)',
              animation:'float 3s ease-in-out infinite',
              display:'flex', alignItems:'center', gap:8,
              '@media (max-width: 768px)': { display: 'none' }
            } as any}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#10b981',
                boxShadow:'0 0 8px #10b981' }}/>
              <span style={{ fontSize:12, color:'#34d399', fontWeight:700 }}>Low Risk — Approved</span>
            </div>

            <div style={{
              position:'absolute', right:-12, top:'25%',
              padding:'8px 14px', borderRadius:12,
              background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)',
              backdropFilter:'blur(10px)',
              animation:'floatR 4s ease-in-out infinite',
              display:'flex', alignItems:'center', gap:8,
              '@media (max-width: 768px)': { display: 'none' }
            } as any}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#ef4444',
                boxShadow:'0 0 8px #ef4444' }}/>
              <span style={{ fontSize:12, color:'#f87171', fontWeight:700 }}>High Risk — Review</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section ref={el => { stepsRef2.current = el as any; (stepsRef as any).current = el }}
        style={{ padding:'100px 24px', position:'relative',
          '@media (max-width: 768px)': { padding: '60px 20px' },
          '@media (max-width: 640px)': { padding: '40px 16px' }
        } as any}>
        
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          {/* Section Header */}
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 14px',
              borderRadius:20, background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)',
              marginBottom:16 }}>
              <FadeIn>
              <span style={{ fontSize:12, color:'#a78bfa', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Process
              </span>
              </FadeIn>
            </div>
            <FadeIn delay={200}>
              <h2 style={{ 
                fontSize:48, fontWeight:900, letterSpacing:'-0.03em', marginBottom:16,
                background:'linear-gradient(135deg,#fff,#9ca3af)', WebkitBackgroundClip:'text',
                WebkitTextFillColor:'transparent', backgroundClip:'text',
                '@media (max-width: 768px)': { fontSize: 36 },
                '@media (max-width: 640px)': { fontSize: 28 }
              } as any}>
                How It Works
              </h2>
            <p style={{ fontSize:16, color:'#9ca3af', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>
              Three steps from raw data to actionable risk intelligence
            </p>
            </FadeIn>
          </div>
        
          {/* Connector line */}
          <div style={{ position:'relative' }}>
            <div style={{ display:'none' }}/>
            <div style={{ 
              display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:24, position:'relative',
              '@media (max-width: 768px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
              '@media (max-width: 640px)': { gridTemplateColumns: '1fr' }
            } as any}>
              {/* gradient connector - hidden on mobile */}
              <div style={{
                position:'absolute', top:48, left:'22%', right:'22%', height:1,
                background:'linear-gradient(90deg, rgba(139,92,246,0.4), rgba(59,130,246,0.4), rgba(16,185,129,0.4))',
                zIndex:0,
                '@media (max-width: 768px)': { display: 'none' }
              } as any}/>
              {steps.map((s, i) => (
                <StepCard key={i} {...s} index={i} visible={stepsInView} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section ref={statsRef as any} style={{ padding:'80px 24px',
        '@media (max-width: 768px)': { padding: '60px 20px' },
        '@media (max-width: 640px)': { padding: '40px 16px' }
      } as any}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{
            borderRadius:20, border:'1px solid rgba(139,92,246,0.15)',
            background:'rgba(139,92,246,0.04)', padding:'60px 40px',
            position:'relative', overflow:'hidden',
            '@media (max-width: 768px)': { padding: '40px 24px' },
            '@media (max-width: 640px)': { padding: '32px 20px' }
          } as any}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:1,
              background:'linear-gradient(90deg,transparent,rgba(139,92,246,0.5),transparent)' }}/>
            <div style={{ position:'absolute', top:-80, right:-80, width:240, height:240,
              borderRadius:'50%', background:'rgba(109,40,217,0.08)', filter:'blur(50px)' }}/>
            <div style={{ 
              display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:24, textAlign:'center',
              '@media (max-width: 640px)': { gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }
            } as any}>
              <StatItem value={1000} suffix="+" label="Training Records"  color="#a78bfa" visible={statsInView}/>
              <StatItem value={76}   suffix="%" label="Model Accuracy"    color="#34d399" visible={statsInView}/>
            <div onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform='scale(1.08)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform='scale(1)'}
            style={{ textAlign:'center', transition:'transform 0.3s' }}>
                <p style={{ fontSize:52, fontWeight:900, color:'#818cf8', marginBottom:6,
                    textShadow:`0 0 30px #818cf860`, letterSpacing:'-0.02em',
                    opacity: statsInView ? 1 : 0,
                    transform: statsInView ? 'translateY(0)' : 'translateY(20px)',
                    transition:'opacity 0.8s ease, transform 0.8s ease',
                }}>
                    MULTIPLE
                </p>
                <p style={{ fontSize:13, color:'#9ca3af', letterSpacing:'0.03em', textTransform:'uppercase' }}>
                    Features Analyzed
                </p>
            </div>
              <StatItem value={3}    suffix=""  label="Risk Levels"       color="#fbbf24" visible={statsInView}/>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section ref={featuresRef as any} style={{ padding:'100px 24px',
        '@media (max-width: 768px)': { padding: '60px 20px' },
        '@media (max-width: 640px)': { padding: '40px 16px' }
      } as any}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:64 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 14px',
              borderRadius:20, background:'rgba(139,92,246,0.08)', border:'1px solid rgba(139,92,246,0.2)',
              marginBottom:16 }}>
              <FadeIn>
              <span style={{ fontSize:12, color:'#a78bfa', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Features
              </span>
              </FadeIn>
            </div>
            <FadeIn delay={200}>
            <h2 style={{ 
              fontSize:48, fontWeight:900, letterSpacing:'-0.03em', marginBottom:16,
              background:'linear-gradient(135deg,#fff,#9ca3af)', WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent', backgroundClip:'text',
              '@media (max-width: 768px)': { fontSize: 36 },
              '@media (max-width: 640px)': { fontSize: 28 }
            } as any}>
              Everything You Need
            </h2>
            <p style={{ fontSize:16, color:'#9ca3af', maxWidth:460, margin:'0 auto', lineHeight:1.7 }}>
              A complete credit risk platform built for modern banking infrastructure
            </p>
            </FadeIn>
          </div>
          <div style={{ 
            display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:18,
            '@media (max-width: 1024px)': { gridTemplateColumns: 'repeat(2, 1fr)' },
            '@media (max-width: 640px)': { gridTemplateColumns: '1fr' }
          } as any}>
            {features.map((f, i) => <FeatureCard key={i} {...f} index={i} visible={featuresInView} />)}
          </div>
        </div>
      </section>

      {/* ── LOGIN ── */}
      <section ref={loginRef as any} style={{ padding:'100px 24px', position:'relative',
        '@media (max-width: 768px)': { padding: '60px 20px' },
        '@media (max-width: 640px)': { padding: '40px 16px' }
      } as any}>
        {/* Background glow */}
        <div style={{ position:'absolute', top:'30%', left:'50%', transform:'translateX(-50%)',
          width:400, height:400, borderRadius:'50%',
          background:'rgba(109,40,217,0.08)', filter:'blur(80px)', pointerEvents:'none' }}/>

        <div style={{ 
          maxWidth:440, margin:'0 auto', position:'relative',
          '@media (max-width: 640px)': { maxWidth: '100%' }
        } as any}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 14px',
              borderRadius:20, background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.2)',
              marginBottom:16 }}>
              <FadeIn>
              <span style={{ fontSize:12, color:'#fbbf24', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                Access
              </span> 
              </FadeIn>
            </div>
            <FadeIn>
            <h2 style={{ 
              fontSize:42, fontWeight:900, letterSpacing:'-0.03em', marginBottom:12,
              background:'linear-gradient(135deg,#fff,#9ca3af)', WebkitBackgroundClip:'text',
              WebkitTextFillColor:'transparent', backgroundClip:'text',
              '@media (max-width: 768px)': { fontSize: 32 },
              '@media (max-width: 640px)': { fontSize: 28 }
            } as any}>
              Login to System
            </h2>
            <p style={{ fontSize:15, color:'#9ca3af', '@media (max-width: 640px)': { fontSize: 14 } } as any}>Enter your credentials to access the dashboard</p>
            </FadeIn>
          </div>
          <FadeIn delay={200}>
            <LoginForm />
          </FadeIn>
          
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop:'1px solid rgba(255,255,255,0.04)', padding:'32px 24px' }}>
        <div style={{ 
          maxWidth:1200, margin:'0 auto',
          display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12,
          '@media (max-width: 768px)': { justifyContent: 'center', textAlign: 'center' }
        } as any}>
          <div style={{ display:'flex', alignItems:'center', gap:10, '@media (max-width: 768px)': { flexWrap: 'wrap', justifyContent: 'center' } } as any}>
            <div style={{ width:28, height:28, borderRadius:7,
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>
                <FadeIn>
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                  fill="none" stroke="#ebdbb2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="M8 12h3l1-2 1 4 1-2h2"/>
                </svg>
                </FadeIn>
              </div>
            <FadeIn>
              <span style={{ fontSize:13, color:'#9ca3af' }}>Credit Scoring Model AI-Powered Credit Analysis System</span>
            </FadeIn>
          </div>
          <FadeIn>
            <p style={{ fontSize:13, color:'#9ca3af' }}>Built with Django · React · Random Forest ML</p>
          </FadeIn>
        </div>
      </footer>
    </div>
  </div>
  )
}