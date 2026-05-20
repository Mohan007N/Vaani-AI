import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion'

// ─── DATA ───────────────────────────────────────────────────────────────────
const TYPING_WORDS = [
  { text: 'एक देशी आवाज़।', lang: 'Hindi', color: '#FF9933' },
  { text: 'ஒரு நேட்டிவ் குரல்.', lang: 'Tamil', color: '#00B4D8' },
  { text: 'ఒక స్వదేశీ గొంతు.', lang: 'Telugu', color: '#A8DADC' },
  { text: 'A Native Voice.', lang: 'English', color: '#00F5D4' },
  { text: 'ਇੱਕ ਦੇਸੀ ਆਵਾਜ਼।', lang: 'Punjabi', color: '#FFB703' },
  { text: 'ഒരു നാടൻ ശബ്ദം.', lang: 'Malayalam', color: '#FB5607' },
  { text: 'ಒಂದು ಸ್ಥಳೀಯ ಧ್ವನಿ.', lang: 'Kannada', color: '#06D6A0' },
  { text: 'একটি দেশীয় কণ্ঠস্বর।', lang: 'Bengali', color: '#8338EC' },
]

const LANGUAGES = [
  { name: 'हिन्दी', eng: 'Hindi', sample: 'नमस्ते! मैं वाणी AI हूं।', color: '#FF9933' },
  { name: 'தமிழ்', eng: 'Tamil', sample: 'வணக்கம்! நான் வாணி AI.', color: '#00B4D8' },
  { name: 'తెలుగు', eng: 'Telugu', sample: 'నమస్కారం! నేను వాని AI.', color: '#A8DADC' },
  { name: 'मराठी', eng: 'Marathi', sample: 'नमस्कार! मी वाणी AI आहे.', color: '#E76F51' },
  { name: 'ಕನ್ನಡ', eng: 'Kannada', sample: 'ನಮಸ್ಕಾರ! ನಾನು ವಾಣಿ AI.', color: '#06D6A0' },
  { name: 'ਪੰਜਾਬੀ', eng: 'Punjabi', sample: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਵਾਣੀ AI ਹਾਂ।', color: '#FFB703' },
  { name: 'বাংলা', eng: 'Bengali', sample: 'নমস্কার! আমি ভাণি AI।', color: '#8338EC' },
  { name: 'മലയാളം', eng: 'Malayalam', sample: 'നമസ്കാരം! ഞാൻ വാണി AI.', color: '#FB5607' },
  { name: 'English', eng: 'English', sample: "Hello! I am Vaani AI, India's voice.", color: '#00F5D4' },
  { name: 'ગુજરાતી', eng: 'Gujarati', sample: 'નમસ્તે! હું Vaani AI છું.', color: '#FFBE0B' },
]

const FEATURES = [
  { icon: '🎙', title: 'Neural Voices', desc: 'Microsoft-powered neural TTS with ultra-realistic intonation and emotion', color: '#00F5D4' },
  { icon: '🌐', title: '12+ Languages', desc: 'Hindi, Tamil, Telugu, Marathi, Kannada, Punjabi and every major Indian language', color: '#3b82f6' },
  { icon: '⚡', title: 'Instant Synthesis', desc: 'Lightning-fast — hear your text spoken in under 2 seconds', color: '#a855f7' },
  { icon: '🎛', title: 'Voice Control', desc: 'Fine-tune speed, pitch, tone and emotional style with precision sliders', color: '#f59e0b' },
  { icon: '🧬', title: 'Voice Cloning', desc: 'Train a custom AI voice from just 30 seconds of your audio sample', color: '#f43f5e' },
  { icon: '📥', title: 'MP3 Export', desc: 'Download studio-quality MP3 files ready for YouTube, podcasts and more', color: '#06d6a0' },
]

const STATS = [
  { value: 50000, display: '50K+', label: 'Active Creators', icon: '👥', suffix: '+' },
  { value: 12, display: '12', label: 'Languages', icon: '🌐', suffix: '' },
  { value: 24, display: '24', label: 'Neural Voices', icon: '🎙', suffix: '' },
  { value: 1000000, display: '1M+', label: 'Words Generated', icon: '⚡', suffix: '+' },
]

const TESTIMONIALS = [
  { name: 'Priya Sharma', role: 'Podcast Creator', text: 'Vaani AI transformed my Hindi podcasts. The neural voices sound so natural that my listeners thought I hired a voice artist!', avatar: '👩', stars: 5, lang: 'Hindi' },
  { name: 'Arjun Nair', role: 'EdTech Startup', text: 'We generate Tamil and Malayalam TTS for 50,000 students daily. Vaani\'s speed and quality is unmatched at this price point.', avatar: '👨', stars: 5, lang: 'Tamil' },
  { name: 'Deepika Reddy', role: 'YouTube Creator', text: 'My Telugu channel grew 3x after I started using Vaani AI for narrations. Best investment for content creators!', avatar: '👩‍💼', stars: 5, lang: 'Telugu' },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Type or Paste Text', desc: 'Enter any text in any Indian language up to 5,000 characters per generation.', icon: '✍️', color: '#00F5D4' },
  { step: '02', title: 'Choose Voice & Style', desc: 'Pick from 24+ neural voices, set speed, pitch and emotional style.', icon: '🎛', color: '#3b82f6' },
  { step: '03', title: 'Generate & Download', desc: 'AI renders studio-quality audio in seconds. Download as MP3 instantly.', icon: '⚡', color: '#a855f7' },
]

// ─── TYPEWRITER HOOK ─────────────────────────────────────────────────────────
function useTypewriter(words, typingSpeed = 60, deletingSpeed = 30, pauseMs = 1800) {
  const [display, setDisplay] = useState('')
  const [wordIdx, setWordIdx] = useState(0)
  const [phase, setPhase] = useState('typing')
  const [charIdx, setCharIdx] = useState(0)

  useEffect(() => {
    const word = words[wordIdx].text
    let timeout
    if (phase === 'typing') {
      if (charIdx < word.length) {
        timeout = setTimeout(() => { setDisplay(word.slice(0, charIdx + 1)); setCharIdx(c => c + 1) }, typingSpeed + Math.random() * 30)
      } else {
        timeout = setTimeout(() => setPhase('pause'), pauseMs)
      }
    } else if (phase === 'pause') {
      timeout = setTimeout(() => setPhase('deleting'), 400)
    } else if (phase === 'deleting') {
      if (charIdx > 0) {
        timeout = setTimeout(() => { setDisplay(word.slice(0, charIdx - 1)); setCharIdx(c => c - 1) }, deletingSpeed)
      } else {
        setWordIdx((wordIdx + 1) % words.length); setPhase('typing')
      }
    }
    return () => clearTimeout(timeout)
  }, [phase, charIdx, wordIdx, words, typingSpeed, deletingSpeed, pauseMs])

  return { display, word: words[wordIdx], phase }
}

// ─── COUNTER HOOK ─────────────────────────────────────────────────────────────
function useCounter(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * target))
      if (progress >= 1) clearInterval(timer)
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration, start])
  return count
}

// ─── PARTICLE SYSTEM ─────────────────────────────────────────────────────────
function Particles({ count = 40 }) {
  const particles = useRef(
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      dur: Math.random() * 20 + 15,
      delay: Math.random() * 10,
      color: ['#00F5D4', '#3b82f6', '#a855f7', '#f59e0b'][Math.floor(Math.random() * 4)],
      dx: (Math.random() - 0.5) * 40,
      dy: (Math.random() - 0.5) * 60,
    }))
  ).current

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      {particles.map(p => (
        <motion.div key={p.id}
          style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, borderRadius: '50%', background: p.color, opacity: 0.15 }}
          animate={{ x: [0, p.dx, 0], y: [0, p.dy, 0], opacity: [0.05, 0.3, 0.05] }}
          transition={{ duration: p.dur, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  )
}

// ─── MAGNETIC GLOW ────────────────────────────────────────────────────────────
function MagneticGlow() {
  const x = useMotionValue(-1000); const y = useMotionValue(-1000)
  const sx = useSpring(x, { stiffness: 40, damping: 20 }); const sy = useSpring(y, { stiffness: 40, damping: 20 })
  useEffect(() => {
    const fn = e => { x.set(e.clientX - 400); y.set(e.clientY - 400) }
    window.addEventListener('mousemove', fn)
    return () => window.removeEventListener('mousemove', fn)
  }, [])
  return <motion.div style={{ x: sx, y: sy, position: 'fixed', width: 800, height: 800, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,245,212,0.035) 0%, rgba(59,130,246,0.02) 40%, transparent 70%)', pointerEvents: 'none', zIndex: 0, top: 0, left: 0 }} />
}

function FloatOrb({ style, dur = 20, dx = [0, 40, 0], dy = [0, -60, 0] }) {
  return <motion.div animate={{ x: dx, y: dy }} transition={{ duration: dur, repeat: Infinity, ease: 'easeInOut' }} style={{ position: 'absolute', borderRadius: '50%', filter: 'blur(90px)', pointerEvents: 'none', ...style }} />
}

function WaveBar({ color = '#00F5D4', active = true, bars = 32, height = 48 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height }}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div key={i}
          animate={active ? { scaleY: [0.15, 0.3 + Math.abs(Math.sin(i * 0.6)) * 0.85, 0.15] } : { scaleY: 0.12 }}
          transition={{ duration: 0.55 + (i % 7) * 0.08, repeat: Infinity, delay: i * 0.035, ease: 'easeInOut' }}
          style={{ width: 3, height: '100%', background: color, borderRadius: 2, transformOrigin: 'center', opacity: 0.75 + Math.sin(i) * 0.25 }}
        />
      ))}
    </div>
  )
}

function LanguageTicker() {
  const doubled = [...LANGUAGES, ...LANGUAGES, ...LANGUAGES]
  return (
    <div style={{ overflow: 'hidden', width: '100%', position: 'relative', padding: '18px 0' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 160, background: 'linear-gradient(to right, var(--bg-void), transparent)', zIndex: 2 }} />
      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 160, background: 'linear-gradient(to left, var(--bg-void), transparent)', zIndex: 2 }} />
      <motion.div
        animate={{ x: [0, -(56 * LANGUAGES.length)] }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        style={{ display: 'flex', gap: 12, width: 'max-content' }}>
        {doubled.map((l, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px', borderRadius: 50, border: `1px solid ${l.color}25`, background: `${l.color}07`, whiteSpace: 'nowrap', flexShrink: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, flexShrink: 0, boxShadow: `0 0 6px ${l.color}` }} />
            <span style={{ color: 'rgba(241,245,249,0.85)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.95rem' }}>{l.name}</span>
            <span style={{ color: 'rgba(100,116,139,0.7)', fontSize: '0.75rem' }}>{l.eng}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}

// ─── CINEMATIC INTRO ─────────────────────────────────────────────────────────
function IntroScreen({ onDone }) {
  const [phase, setPhase] = useState('logo') // logo → tagline → loading
  const [loadPct, setLoadPct] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('tagline'), 900)
    const t2 = setTimeout(() => setPhase('loading'), 1600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => {
    if (phase !== 'loading') return
    let val = 0
    const iv = setInterval(() => {
      val += Math.random() * 8 + 3
      if (val >= 100) { val = 100; clearInterval(iv); setTimeout(onDone, 350) }
      setLoadPct(Math.min(val, 100))
    }, 55)
    return () => clearInterval(iv)
  }, [phase, onDone])

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.06 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
      style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#020409', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', overflow: 'hidden' }}>

      {/* Background rings */}
      {[200, 340, 500, 700].map((r, i) => (
        <motion.div key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: [0, 0.07 - i * 0.012, 0] }}
          transition={{ duration: 2.5, delay: i * 0.3, ease: 'easeOut', repeat: Infinity, repeatDelay: 1.5 }}
          style={{ position: 'absolute', width: r, height: r, borderRadius: '50%', border: `1px solid rgba(0,245,212,0.6)`, pointerEvents: 'none' }}
        />
      ))}

      {/* Rotating gradient ring */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'conic-gradient(from 0deg, transparent, #00F5D4, transparent, #3b82f6, transparent, #a855f7, transparent)', filter: 'blur(2px)', opacity: 0.5 }}
      />

      {/* Logo orb */}
      <motion.div
        initial={{ scale: 0, opacity: 0, rotate: -45 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
        style={{ position: 'relative', width: 90, height: 90, borderRadius: 26, background: 'linear-gradient(135deg, #00F5D4 0%, #3b82f6 50%, #a855f7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 32, boxShadow: '0 0 80px rgba(0,245,212,0.6), 0 0 180px rgba(59,130,246,0.3), 0 0 40px rgba(0,0,0,0.8)', zIndex: 1 }}>
        {/* Inner glow pulse */}
        <motion.div
          animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, borderRadius: 26, background: 'radial-gradient(circle at center, rgba(255,255,255,0.3), transparent 70%)' }}
        />
        🎙
      </motion.div>

      {/* Brand name */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 10, overflow: 'hidden' }}>
        {'Vaani'.split('').map((ch, i) => (
          <motion.span key={i}
            initial={{ y: 80, opacity: 0, filter: 'blur(8px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            transition={{ delay: 0.25 + i * 0.07, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '4.5rem', background: 'linear-gradient(135deg, #00F5D4, #3b82f6, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.04em', display: 'inline-block' }}>
            {ch}
          </motion.span>
        ))}
        <motion.span
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: '2.8rem', color: 'rgba(148,163,184,0.45)', marginLeft: 4 }}>
          AI
        </motion.span>
      </div>

      {/* Tagline */}
      <AnimatePresence>
        {phase !== 'logo' && (
          <motion.p
            initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ color: 'rgba(71,85,105,0.9)', fontFamily: 'var(--font-body)', letterSpacing: '0.25em', fontSize: '0.72rem', textTransform: 'uppercase', marginBottom: 44 }}>
            India's Neural Voice Platform
          </motion.p>
        )}
      </AnimatePresence>

      {/* Loading bar */}
      <AnimatePresence>
        {phase === 'loading' && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            style={{ width: 220, transformOrigin: 'left' }}>
            <div style={{ width: '100%', height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1, overflow: 'hidden' }}>
              <motion.div
                style={{ height: '100%', background: 'linear-gradient(90deg, #00F5D4, #3b82f6, #a855f7)', borderRadius: 1, width: `${loadPct}%`, transition: 'width 0.06s linear' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <span style={{ color: 'rgba(71,85,105,0.6)', fontSize: '0.65rem', letterSpacing: '0.15em' }}>INITIALIZING</span>
              <span style={{ color: '#00F5D4', fontSize: '0.65rem', letterSpacing: '0.05em', fontFamily: 'monospace' }}>{Math.floor(loadPct)}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ stat, i, inView }) {
  const count = useCounter(stat.value, 2200, inView)
  const display = count >= stat.value ? stat.display : (count >= 1000000 ? `${(count / 1000000).toFixed(1)}M+` : count >= 1000 ? `${(count / 1000).toFixed(0)}K+` : count + stat.suffix)

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: i * 0.12, duration: 0.6, type: 'spring' }}
      whileHover={{ scale: 1.04, borderColor: 'rgba(0,245,212,0.2)' }}
      style={{ textAlign: 'center', padding: '40px 24px', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.012)', cursor: 'default', transition: 'border-color 0.3s' }}>
      <div style={{ fontSize: 28, marginBottom: 12 }}>{stat.icon}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '3.6rem', background: 'linear-gradient(135deg,#00F5D4 0%,#3b82f6 50%,#a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.04em', lineHeight: 1 }}>
        {inView ? display : '0'}
      </div>
      <div style={{ color: 'rgba(100,116,139,0.85)', fontSize: '0.75rem', marginTop: 10, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>{stat.label}</div>
    </motion.div>
  )
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate()
  const { scrollYProgress } = useScroll()
  const heroY = useTransform(scrollYProgress, [0, 0.4], [0, -100])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.32], [1, 0])

  const [showIntro, setShowIntro] = useState(true)
  const [introDone, setIntroDone] = useState(false)
  const [activeLang, setActiveLang] = useState(0)
  const [statsInView, setStatsInView] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const statsRef = useRef(null)

  const { display: typedText, word: activeWord, phase } = useTypewriter(TYPING_WORDS, 55, 28, 1800)

  useEffect(() => {
    const t = setInterval(() => setActiveLang(i => (i + 1) % LANGUAGES.length), 3400)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setActiveTestimonial(i => (i + 1) % TESTIMONIALS.length), 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!statsRef.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsInView(true) }, { threshold: 0.3 })
    obs.observe(statsRef.current)
    return () => obs.disconnect()
  }, [])

  const lang = LANGUAGES[activeLang]

  return (
    <div style={{ background: 'var(--bg-void)', minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
      <MagneticGlow />
      <Particles count={35} />

      <AnimatePresence>
        {showIntro && (
          <IntroScreen onDone={() => {
            setShowIntro(false)
            setTimeout(() => setIntroDone(true), 100)
          }} />
        )}
      </AnimatePresence>

      {/* ─── NAVBAR ─────────────────────────────────────────────────────────── */}
      <motion.nav
        initial={{ y: -70, opacity: 0 }}
        animate={introDone ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(2,4,9,0.85)', backdropFilter: 'blur(30px)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '14px 52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <motion.div
            whileHover={{ rotate: [0, -15, 15, 0], scale: 1.15 }}
            transition={{ duration: 0.5 }}
            style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#00F5D4,#3b82f6,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, boxShadow: '0 0 20px rgba(0,245,212,0.4)' }}>
            🎙
          </motion.div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
            <span className="gradient-text">Vaani</span><span style={{ color: 'rgba(148,163,184,0.35)', fontWeight: 400 }}> AI</span>
          </span>
        </div>

        {/* Nav Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {['Features', 'How It Works', 'Pricing'].map(link => (
            <motion.a key={link} href={`#${link.toLowerCase().replace(/ /g, '-')}`}
              whileHover={{ color: '#00F5D4' }}
              style={{ color: 'rgba(148,163,184,0.7)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s', textDecoration: 'none', fontFamily: 'var(--font-display)' }}>
              {link}
            </motion.a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.button whileHover={{ background: 'rgba(255,255,255,0.06)' }} onClick={() => navigate('/auth')}
            style={{ padding: '9px 20px', borderRadius: 10, border: 'none', background: 'transparent', color: 'rgba(148,163,184,0.85)', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.88rem' }}>
            Sign In
          </motion.button>
          <motion.button whileHover={{ scale: 1.06, boxShadow: '0 8px 32px rgba(0,245,212,0.4)' }} whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/auth?mode=register')}
            style={{ padding: '9px 22px', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg,#00F5D4,#3b82f6)', color: '#020409', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.88rem', boxShadow: '0 4px 20px rgba(0,245,212,0.25)' }}>
            Get Started Free
          </motion.button>
        </div>
      </motion.nav>

      {/* ─── HERO ─────────────────────────────────────────────────────────────── */}
      <motion.section style={{ y: heroY, opacity: heroOpacity, position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '140px 24px 80px', textAlign: 'center', overflow: 'hidden' }}>

        <FloatOrb style={{ top: '5%', left: '-5%', width: 800, height: 800, background: 'radial-gradient(circle, rgba(0,245,212,0.07), transparent 68%)' }} dur={24} dy={[0, -80, 0]} dx={[0, 30, 0]} />
        <FloatOrb style={{ top: '20%', right: '-8%', width: 800, height: 800, background: 'radial-gradient(circle, rgba(168,85,247,0.07), transparent 68%)' }} dur={30} dy={[0, 60, 0]} dx={[0, -20, 0]} />
        <FloatOrb style={{ bottom: '0%', left: '20%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.06), transparent 68%)' }} dur={20} dy={[0, -40, 0]} />

        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={introDone ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ delay: 0.05, duration: 0.55 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 100, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 36, backdropFilter: 'blur(12px)' }}>
            <motion.span animate={{ opacity: [1, 0.2, 1], scale: [1, 1.4, 1] }} transition={{ duration: 1.6, repeat: Infinity }}
              style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#00F5D4', boxShadow: '0 0 10px #00F5D4' }} />
            <span style={{ color: 'rgba(148,163,184,0.8)', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>India's Most Advanced AI Voice Platform</span>
          </div>
        </motion.div>

        {/* Headline */}
        <div style={{ overflow: 'hidden', marginBottom: 4 }}>
          <motion.h1
            initial={{ y: '110%' }}
            animate={introDone ? { y: '0%' } : {}}
            transition={{ delay: 0.1, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(3rem, 8vw, 7rem)', lineHeight: 1.02, letterSpacing: '-0.04em', margin: 0, color: '#f1f5f9' }}>
            Your ideas,
          </motion.h1>
        </div>

        {/* Typewriter */}
        <div style={{ overflow: 'hidden', marginBottom: 36 }}>
          <motion.div
            initial={{ y: '110%' }}
            animate={introDone ? { y: '0%' } : {}}
            transition={{ delay: 0.2, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(3rem, 8vw, 7rem)', lineHeight: 1.02, letterSpacing: '-0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, flexWrap: 'wrap', minHeight: '1.05em' }}>
            <span style={{ color: activeWord.color, textShadow: `0 0 80px ${activeWord.color}55, 0 0 160px ${activeWord.color}22`, transition: 'color 0.4s ease, text-shadow 0.4s ease' }}>
              {typedText}
            </span>
            <motion.span
              animate={{ opacity: phase === 'pause' ? [1, 0] : 1 }}
              transition={phase === 'pause' ? { duration: 0.5, repeat: Infinity, repeatType: 'reverse' } : {}}
              style={{ display: 'inline-block', width: 4, height: '0.85em', background: activeWord.color, borderRadius: 2, verticalAlign: 'middle', boxShadow: `0 0 16px ${activeWord.color}`, transition: 'background 0.4s ease', flexShrink: 0 }}
            />
          </motion.div>
        </div>

        {/* Lang badge */}
        <motion.div initial={{ opacity: 0 }} animate={introDone ? { opacity: 1 } : {}} transition={{ delay: 0.55 }} style={{ marginBottom: 28 }}>
          <AnimatePresence mode="wait">
            <motion.span key={activeWord.lang}
              initial={{ opacity: 0, y: 6, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }}
              className="badge"
              style={{ background: `${activeWord.color}15`, color: activeWord.color, border: `1px solid ${activeWord.color}30`, fontSize: '0.78rem', padding: '6px 16px', letterSpacing: '0.06em' }}>
              {activeWord.lang} Neural Voice
            </motion.span>
          </AnimatePresence>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={introDone ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.45, duration: 0.6 }}
          style={{ color: 'rgba(148,163,184,0.75)', fontSize: 'clamp(1rem, 2vw, 1.2rem)', maxWidth: 560, lineHeight: 1.8, marginBottom: 44, fontWeight: 400 }}>
          Transform any text into lifelike speech in Hindi, Tamil, Telugu, and <strong style={{ color: 'rgba(241,245,249,0.75)', fontWeight: 600 }}>9 more Indian languages</strong> — powered by neural AI.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={introDone ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.55 }}
          style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 72 }}>
          <motion.button
            whileHover={{ scale: 1.06, boxShadow: '0 24px 70px rgba(0,245,212,0.5)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/auth?mode=register')}
            style={{ fontSize: '1.05rem', padding: '16px 48px', borderRadius: 15, border: 'none', background: 'linear-gradient(135deg,#00F5D4,#3b82f6)', color: '#020409', fontFamily: 'var(--font-display)', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 36px rgba(0,245,212,0.3)', position: 'relative', overflow: 'hidden' }}>
            <motion.div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,255,255,0.2),transparent)', opacity: 0 }} whileHover={{ opacity: 1 }} />
            🚀 Start Creating Free
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.04, background: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.18)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/auth')}
            style={{ fontSize: '1.05rem', padding: '16px 44px', borderRadius: 15, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', fontFamily: 'var(--font-display)', fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(12px)' }}>
            Sign In
          </motion.button>
        </motion.div>

        {/* Interactive demo card */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.92 }}
          animate={introDone ? { opacity: 1, y: 0, scale: 1 } : {}}
          transition={{ delay: 0.75, duration: 0.9, type: 'spring', bounce: 0.25 }}
          style={{ width: '100%', maxWidth: 560, position: 'relative' }}>
          <motion.div
            animate={{ background: [`linear-gradient(135deg, ${lang.color}55, rgba(59,130,246,0.4), rgba(168,85,247,0.4))`, `linear-gradient(225deg, ${lang.color}65, rgba(168,85,247,0.5), rgba(59,130,246,0.3))`] }}
            transition={{ duration: 3, repeat: Infinity, repeatType: 'reverse' }}
            style={{ position: 'absolute', inset: -2, borderRadius: 28, zIndex: 0 }}
          />
          <div style={{ position: 'relative', zIndex: 1, background: 'rgba(8,14,26,0.98)', borderRadius: 26, padding: '28px 32px', backdropFilter: 'blur(30px)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <AnimatePresence mode="wait">
                <motion.div key={lang.eng} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <motion.span animate={{ boxShadow: [`0 0 0px ${lang.color}`, `0 0 16px ${lang.color}`, `0 0 0px ${lang.color}`] }} transition={{ duration: 1.5, repeat: Infinity }}
                    style={{ width: 9, height: 9, borderRadius: '50%', background: lang.color, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.82rem', color: lang.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{lang.eng} Neural Voice</span>
                </motion.div>
              </AnimatePresence>
              <WaveBar color={lang.color} active={true} bars={28} height={38} />
            </div>
            <AnimatePresence mode="wait">
              <motion.p key={lang.eng}
                initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -14, filter: 'blur(4px)' }}
                transition={{ duration: 0.4 }}
                style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, textAlign: 'left', color: '#f1f5f9', lineHeight: 1.45, textShadow: `0 0 40px ${lang.color}22` }}>
                {lang.sample}
              </motion.p>
            </AnimatePresence>
            <div style={{ display: 'flex', gap: 5, marginTop: 20, justifyContent: 'center' }}>
              {LANGUAGES.map((l, i) => (
                <motion.div key={i}
                  animate={{ scale: i === activeLang ? 1.7 : 1, background: i === activeLang ? l.color : 'rgba(255,255,255,0.1)', boxShadow: i === activeLang ? `0 0 10px ${l.color}` : 'none' }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setActiveLang(i)}
                  style={{ width: 6, height: 6, borderRadius: '50%', cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={introDone ? { opacity: 1 } : {}} transition={{ delay: 1.1 }}
          style={{ marginTop: 28, color: 'rgba(71,85,105,0.75)', fontSize: '0.82rem', fontWeight: 500, letterSpacing: '0.02em' }}>
          ✨ 1,000 free credits every week · No credit card required
        </motion.p>
      </motion.section>

      {/* ─── LANGUAGE TICKER ─────────────────────────────────────────────────── */}
      <section style={{ zIndex: 1, position: 'relative', borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
        <LanguageTicker />
      </section>

      {/* ─── STATS ───────────────────────────────────────────────────────────── */}
      <section ref={statsRef} style={{ position: 'relative', zIndex: 1, padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 2 }}>
          {STATS.map((s, i) => <StatCard key={i} stat={s} i={i} inView={statsInView} />)}
        </div>
      </section>

      {/* ─── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" style={{ position: 'relative', zIndex: 1, padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7 }} style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(0,245,212,0.07)', border: '1px solid rgba(0,245,212,0.18)', marginBottom: 20 }}>
              <span style={{ color: '#00F5D4', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Simple Process</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2.2rem, 5vw, 3.8rem)', letterSpacing: '-0.03em', lineHeight: 1.08 }}>
              Studio audio in<br /><span className="gradient-text">3 easy steps.</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, position: 'relative' }}>
            {/* Connector line */}
            <div style={{ position: 'absolute', top: 48, left: '8%', right: '8%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(0,245,212,0.2), transparent)', pointerEvents: 'none', display: 'none' }} />

            {HOW_IT_WORKS.map((step, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                whileHover={{ y: -8 }}
                style={{ padding: '40px 32px', borderRadius: 26, background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', position: 'relative', overflow: 'hidden', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${step.color}40`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
                {/* Step number */}
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '5rem', color: `${step.color}10`, position: 'absolute', top: 10, right: 20, lineHeight: 1, userSelect: 'none' }}>{step.step}</div>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: `${step.color}15`, border: `1px solid ${step.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: 24 }}>{step.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.3rem', marginBottom: 12, color: '#f1f5f9' }}>{step.title}</h3>
                <p style={{ color: 'rgba(148,163,184,0.75)', lineHeight: 1.72, fontSize: '0.93rem' }}>{step.desc}</p>
                {/* Bottom accent */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${step.color}, transparent)`, opacity: 0.4 }} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" style={{ position: 'relative', zIndex: 1, padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.7 }} style={{ textAlign: 'center', marginBottom: 72 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', marginBottom: 20 }}>
              <span style={{ color: '#3b82f6', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Platform Capabilities</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2.4rem, 5vw, 4rem)', letterSpacing: '-0.03em', lineHeight: 1.08 }}>
              Everything to build<br /><span className="gradient-text">vocal magic.</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ delay: i * 0.07, duration: 0.55 }}
                whileHover={{ y: -10, boxShadow: `0 30px 80px ${f.color}12` }}
                style={{ padding: '36px 32px', borderRadius: 26, background: 'rgba(255,255,255,0.014)', border: '1px solid rgba(255,255,255,0.055)', backdropFilter: 'blur(16px)', cursor: 'default', transition: 'border-color 0.3s, box-shadow 0.3s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = `${f.color}40`}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.055)'}>
                <motion.div whileHover={{ scale: 1.12, rotate: 8 }}
                  style={{ width: 60, height: 60, borderRadius: 18, background: `${f.color}14`, border: `1px solid ${f.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', marginBottom: 22 }}>
                  {f.icon}
                </motion.div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem', marginBottom: 10, color: '#f1f5f9' }}>{f.title}</h3>
                <p style={{ color: 'rgba(148,163,184,0.75)', lineHeight: 1.72, fontSize: '0.93rem' }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', zIndex: 1, padding: '100px 24px', overflow: 'hidden' }}>
        <FloatOrb style={{ top: '20%', left: '0%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(168,85,247,0.05), transparent 70%)' }} dur={20} />
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 36 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 100, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', marginBottom: 20 }}>
              <span style={{ color: '#a855f7', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Loved by Creators</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', letterSpacing: '-0.03em' }}>
              What creators <span className="gradient-text">are saying</span>
            </h2>
          </motion.div>

          <div style={{ position: 'relative', minHeight: 260 }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeTestimonial}
                initial={{ opacity: 0, x: 60, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -60, scale: 0.96 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 28, padding: '44px 48px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: 6 }}>{TESTIMONIALS[activeTestimonial].avatar}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 20 }}>
                  {Array.from({ length: TESTIMONIALS[activeTestimonial].stars }).map((_, i) => (
                    <span key={i} style={{ color: '#f59e0b', fontSize: '1.1rem' }}>★</span>
                  ))}
                </div>
                <p style={{ color: 'rgba(241,245,249,0.85)', fontSize: 'clamp(1rem, 2vw, 1.18rem)', lineHeight: 1.8, fontStyle: 'italic', marginBottom: 24, maxWidth: 640, margin: '0 auto 24px' }}>
                  "{TESTIMONIALS[activeTestimonial].text}"
                </p>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#f1f5f9', fontSize: '1rem' }}>
                  {TESTIMONIALS[activeTestimonial].name}
                </div>
                <div style={{ color: 'rgba(100,116,139,0.8)', fontSize: '0.85rem', marginTop: 4 }}>
                  {TESTIMONIALS[activeTestimonial].role} · {TESTIMONIALS[activeTestimonial].lang}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 28 }}>
              {TESTIMONIALS.map((_, i) => (
                <motion.div key={i}
                  onClick={() => setActiveTestimonial(i)}
                  animate={{ scale: i === activeTestimonial ? 1.4 : 1, background: i === activeTestimonial ? '#00F5D4' : 'rgba(255,255,255,0.2)' }}
                  style={{ width: 8, height: 8, borderRadius: '50%', cursor: 'pointer' }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── FREE PLAN HIGHLIGHT ─────────────────────────────────────────────── */}
      <section id="pricing" style={{ position: 'relative', zIndex: 1, padding: '80px 24px' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 40 }} whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ maxWidth: 920, margin: '0 auto', padding: '64px 56px', borderRadius: 36, background: 'linear-gradient(135deg,rgba(0,245,212,0.055),rgba(59,130,246,0.05),rgba(168,85,247,0.035))', border: '1px solid rgba(0,245,212,0.15)', position: 'relative', overflow: 'hidden', boxShadow: '0 40px 120px rgba(0,0,0,0.5)' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 22, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', top: -180, right: -180, width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle,rgba(0,245,212,0.1),transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
          <motion.div animate={{ rotate: -360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
            style={{ position: 'absolute', bottom: -130, left: -130, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.1),transparent 70%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity }}
              style={{ display: 'inline-block', width: 9, height: 9, borderRadius: '50%', background: '#00F5D4', boxShadow: '0 0 24px #00F5D4', marginBottom: 28 }} />

            {/* Free plan grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 700, margin: '0 auto 40px', textAlign: 'left' }}>
              {[
                { icon: '🎁', label: '1,000 credits free', sub: 'Refreshes every 7 days automatically' },
                { icon: '💳', label: 'No credit card', sub: 'Sign up instantly with Google or email' },
                { icon: '🌐', label: 'All 12 languages', sub: 'Hindi, Tamil, Telugu and 9 more' },
                { icon: '⚡', label: 'Instant access', sub: 'Start generating in under 60 seconds' },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.5rem', flexShrink: 0, marginTop: 2 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>{item.label}</div>
                    <div style={{ color: 'rgba(100,116,139,0.8)', fontSize: '0.82rem', marginTop: 2 }}>{item.sub}</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: 'clamp(2rem, 5vw, 3.4rem)', letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.1 }}>
              Ready to give your<br /><span className="gradient-text">thoughts a voice?</span>
            </h2>
            <p style={{ color: 'rgba(148,163,184,0.75)', marginBottom: 40, lineHeight: 1.78, fontSize: '1rem', maxWidth: 500, margin: '0 auto 40px' }}>
              Join forward-thinking creators generating professional studio-quality audio in seconds.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.button whileHover={{ scale: 1.06, boxShadow: '0 24px 70px rgba(0,245,212,0.45)' }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/auth?mode=register')}
                style={{ fontSize: '1.1rem', padding: '18px 64px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg,#00F5D4,#3b82f6)', color: '#020409', fontFamily: 'var(--font-display)', fontWeight: 800, cursor: 'pointer', boxShadow: '0 12px 44px rgba(0,245,212,0.3)' }}>
                Start for Free Now →
              </motion.button>
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/pricing')}
                style={{ fontSize: '1.05rem', padding: '18px 40px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', fontFamily: 'var(--font-display)', fontWeight: 700, cursor: 'pointer' }}>
                View Pricing Plans
              </motion.button>
            </div>
            <p style={{ color: 'rgba(71,85,105,0.7)', marginTop: 20, fontSize: '0.85rem', fontWeight: 500 }}>
              ✨ 1,000 free credits · Refreshes every week · No credit card
            </p>
          </div>
        </motion.div>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '36px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,4,9,0.95)', backdropFilter: 'blur(20px)', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <motion.div whileHover={{ scale: 1.3, rotate: 15 }} style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#00F5D4,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, cursor: 'pointer' }}>🎙</motion.div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem' }}>
            <span className="gradient-text">Vaani</span><span style={{ color: 'rgba(71,85,105,0.6)', fontWeight: 400 }}> AI</span>
          </span>
          <span style={{ color: 'rgba(71,85,105,0.55)', fontSize: '0.8rem', marginLeft: 8 }}>© 2025 · Built for Bharat 🇮🇳</span>
        </div>
        <p style={{ color: 'rgba(71,85,105,0.7)', fontSize: '0.82rem' }}>
          Developed by{' '}
          <motion.a whileHover={{ color: '#00F5D4' }}
            href="https://www.linkedin.com/in/mohanakrishnan-n-576565312/" target="_blank" rel="noopener noreferrer"
            style={{ color: 'rgba(148,163,184,0.8)', textDecoration: 'none', fontWeight: 700, transition: 'color 0.2s' }}>
            Mohana Krishnan
          </motion.a>
        </p>
      </footer>
    </div>
  )
}
