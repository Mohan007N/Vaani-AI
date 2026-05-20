import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { ttsAPI, translateAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'

const LANGUAGES = [
  { code: 'hi-IN', name: 'हिन्दी', eng: 'Hindi', flag: '🇮🇳', color: '#FF9933' },
  { code: 'ta-IN', name: 'தமிழ்', eng: 'Tamil', flag: '🇮🇳', color: '#00B4D8' },
  { code: 'te-IN', name: 'తెలుగు', eng: 'Telugu', flag: '🇮🇳', color: '#A8DADC' },
  { code: 'mr-IN', name: 'मराठी', eng: 'Marathi', flag: '🇮🇳', color: '#E76F51' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ', eng: 'Kannada', flag: '🇮🇳', color: '#06D6A0' },
  { code: 'pa-IN', name: 'ਪੰਜਾਬੀ', eng: 'Punjabi', flag: '🇮🇳', color: '#FFB703' },
  { code: 'bn-IN', name: 'বাংলা', eng: 'Bengali', flag: '🇮🇳', color: '#8338EC' },
  { code: 'ml-IN', name: 'മലയാളം', eng: 'Malayalam', flag: '🇮🇳', color: '#FB5607' },
  { code: 'gu-IN', name: 'ગુજરાતી', eng: 'Gujarati', flag: '🇮🇳', color: '#FFBE0B' },
  { code: 'en-IN', name: 'English', eng: 'English (India)', flag: '🇮🇳', color: '#00F5D4' },
  { code: 'en-US', name: 'English US', eng: 'English (US)', flag: '🇺🇸', color: '#3b82f6' },
  { code: 'en-GB', name: 'English UK', eng: 'English (UK)', flag: '🇬🇧', color: '#a855f7' },
]

const SAMPLE_TEXTS = {
  'hi-IN': 'नमस्ते! मैं वाणी AI हूं। मैं भारत की आवाज़ हूं, और मैं आपके हर शब्द को जीवन देता हूं।',
  'ta-IN': 'வணக்கம்! நான் வாணி AI. நான் இந்தியாவின் குரல், உங்கள் வார்த்தைகளுக்கு உயிர் கொடுக்கிறேன்.',
  'te-IN': 'నమస్కారం! నేను వాని AI. నేను భారతదేశం యొక్క స్వరం, మీ మాటలకు జీవం పోస్తాను.',
  'mr-IN': 'नमस्कार! मी वाणी AI आहे. मी भारताचा आवाज आहे आणि मी तुमच्या शब्दांना जीवन देतो.',
  'kn-IN': 'ನಮಸ್ಕಾರ! ನಾನು ವಾಣಿ AI. ನಾನು ಭಾರತದ ಧ್ವನಿ, ನಿಮ್ಮ ಮಾತುಗಳಿಗೆ ಜೀವ ಕೊಡುತ್ತೇನೆ.',
  'en-IN': 'Hello! I am Vaani AI, India\'s most advanced text-to-speech platform. I can speak every Indian language fluently.',
  'default': 'Welcome to Vaani AI. Type any text and I will give it a voice instantly.'
}

function WaveformVisualizer({ isPlaying, isLoading }) {
  const bars = 48
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, height: 60 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <motion.div key={i}
          animate={isPlaying ? {
            scaleY: [0.1 + Math.sin(i * 0.4) * 0.3, 0.4 + Math.sin(i * 0.3 + Date.now() * 0.001) * 0.6, 0.1 + Math.cos(i * 0.5) * 0.3],
          } : isLoading ? {
            scaleY: [0.1, 0.8, 0.1],
          } : { scaleY: 0.08 }}
          transition={{ duration: isLoading ? 0.6 : 0.4 + i * 0.01, repeat: Infinity, delay: i * 0.03, ease: 'easeInOut' }}
          style={{
            width: 3, height: '100%', borderRadius: 2, transformOrigin: 'center',
            background: isPlaying
              ? `hsl(${170 + i * 3},70%,${50 + Math.sin(i * 0.5) * 20}%)`
              : isLoading ? `rgba(0,245,212,${0.3 + Math.sin(i * 0.4) * 0.3})`
                : 'var(--border)'
          }}
        />
      ))}
    </div>
  )
}

export default function Studio() {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [inputLanguage, setInputLanguage] = useState('en-IN')
  const [outputLanguage, setOutputLanguage] = useState('hi-IN')
  const [translatedText, setTranslatedText] = useState('')
  const [translating, setTranslating] = useState(false)
  const [voiceType, setVoiceType] = useState('female')
  const [speed, setSpeed] = useState(1.0)
  const [pitch, setPitch] = useState(0)
  const [loading, setLoading] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [audioFilename, setAudioFilename] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [saveHistory, setSaveHistory] = useState(true)
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState('direct') // 'direct' or 'translate'
  const audioRef = useRef(null)

  const inputLang = LANGUAGES.find(l => l.code === inputLanguage) || LANGUAGES[0]
  const outputLang = LANGUAGES.find(l => l.code === outputLanguage) || LANGUAGES[0]
  const selectedLang = mode === 'translate' ? outputLang : inputLang
  const charCount = text.length
  const maxChars = 5000

  const loadSample = () => setText(SAMPLE_TEXTS[inputLanguage] || SAMPLE_TEXTS['default'])

  // Auto translate when text or languages change
  const handleTranslate = async () => {
    if (!text.trim() || mode !== 'translate') return
    if (inputLanguage === outputLanguage) {
      setTranslatedText(text)
      return
    }
    setTranslating(true)
    try {
      const res = await translateAPI.translate({
        text, source_language: inputLanguage, target_language: outputLanguage
      })
      setTranslatedText(res.data.translated_text)
    } catch {
      toast.error('Translation failed')
    } finally {
      setTranslating(false)
    }
  }

  const swapLanguages = () => {
    const temp = inputLanguage
    setInputLanguage(outputLanguage)
    setOutputLanguage(temp)
    if (translatedText) {
      setText(translatedText)
      setTranslatedText('')
    }
  }

  const handleGenerate = async () => {
    if (!text.trim()) return toast.error('Please enter some text')
    if (charCount > maxChars) return toast.error(`Text too long (max ${maxChars} chars)`)

    // Check credits
    if ((user?.voice_credits || 0) < charCount) {
      toast.error('Insufficient credits! Please upgrade your plan.')
      navigate('/app/pricing')
      return
    }

    setLoading(true)
    setAudioUrl(null)
    setIsPlaying(false)

    const textToSpeak = mode === 'translate' ? (translatedText || text) : text
    const targetLang = mode === 'translate' ? outputLanguage : inputLanguage

    try {
      const res = await ttsAPI.generate({
        text: textToSpeak, language: targetLang, voice_type: voiceType,
        speed, pitch, save_history: saveHistory, title: title || undefined
      })
      const fullUrl = `http://localhost:8000${res.data.audio_url}`
      setAudioUrl(fullUrl)
      setAudioFilename(res.data.audio_url?.split('/').pop())
      setDuration(res.data.duration || 0)
      updateUser({ voice_credits: user.voice_credits - charCount })
      toast.success('Voice generated!')
      setTimeout(() => { if (audioRef.current) { audioRef.current.play(); setIsPlaying(true) } }, 300)
    } catch (err) {
      const detail = err.response?.data?.detail || 'Generation failed'
      if (err.response?.status === 402) {
        toast.error('Out of credits! Redirecting to pricing...')
        setTimeout(() => navigate('/app/pricing'), 1500)
      } else {
        toast.error(detail)
      }
    } finally { setLoading(false) }
  }

  const togglePlay = () => {
    if (!audioRef.current) return
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false) }
    else { audioRef.current.play(); setIsPlaying(true) }
  }

  const handleDownload = () => {
    if (!audioFilename) return
    const a = document.createElement('a')
    a.href = `http://localhost:8000/audio/download/${audioFilename}`
    a.download = `vaani-${outputLanguage}-${voiceType}-${Date.now()}.mp3`
    a.click()
    toast.success('Downloading MP3...')
  }

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onEnded = () => setIsPlaying(false)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('ended', onEnded)
    return () => { audio.removeEventListener('timeupdate', onTimeUpdate); audio.removeEventListener('ended', onEnded) }
  }, [audioUrl])

  const fmtTime = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', letterSpacing: '-0.02em' }}>
              Voice <span className="gradient-text">Studio</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>Transform text into lifelike speech in any Indian language</p>
          </div>
          {/* Credits badge */}
          <motion.div whileHover={{ scale: 1.02 }} onClick={() => navigate('/app/pricing')}
            style={{ cursor: 'pointer', background: (user?.voice_credits || 0) < (user?.plan === 'free' ? 200 : 5000) ? 'rgba(244,63,94,0.08)' : 'rgba(0,245,212,0.06)', border: `1px solid ${(user?.voice_credits || 0) < (user?.plan === 'free' ? 200 : 5000) ? 'rgba(244,63,94,0.2)' : 'rgba(0,245,212,0.15)'}`, borderRadius: 14, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>{(user?.voice_credits || 0) < (user?.plan === 'free' ? 200 : 5000) ? '⚠️' : '✨'}</span>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: (user?.voice_credits || 0) < (user?.plan === 'free' ? 200 : 5000) ? 'var(--rose)' : 'var(--teal)' }}>
                {(user?.voice_credits || 0).toLocaleString()} credits
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {(user?.voice_credits || 0) < (user?.plan === 'free' ? 200 : 5000) ? 'Upgrade now →' : 'Click to upgrade'}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Mode tabs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        style={{ display: 'flex', background: 'var(--bg-card)', borderRadius: 14, padding: 4, marginBottom: 20, border: '1px solid var(--border)', maxWidth: 320 }}>
        {[{ m: 'direct', icon: '🎙', label: 'Direct Voice' }, { m: 'translate', icon: '🌐', label: 'Translate + Voice' }].map(({ m, icon, label }) => (
          <button key={m} onClick={() => setMode(m)}
            style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: 'none', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s', background: mode === m ? 'var(--teal-muted)' : 'transparent', color: mode === m ? 'var(--teal)' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <span>{icon}</span>{label}
          </button>
        ))}
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>
        {/* Left: Text input + translation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Translator-style header */}
          {mode === 'translate' && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', borderRadius: 14, padding: '10px 16px', border: '1px solid var(--border)' }}>
              {/* Input lang selector */}
              <select value={inputLanguage} onChange={e => setInputLanguage(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', outline: 'none', flex: 1, padding: '4px 0' }}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code} style={{ background: 'var(--bg-card)' }}>{l.flag} {l.eng}</option>)}
              </select>

              {/* Swap button */}
              <motion.button whileHover={{ scale: 1.15, rotate: 180 }} whileTap={{ scale: 0.9 }} onClick={swapLanguages}
                style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--teal-muted)', border: '1px solid rgba(0,245,212,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>
                ⇄
              </motion.button>

              {/* Output lang selector */}
              <select value={outputLanguage} onChange={e => setOutputLanguage(e.target.value)}
                style={{ background: 'transparent', border: 'none', color: 'var(--teal)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', outline: 'none', flex: 1, padding: '4px 0', textAlign: 'right' }}>
                {LANGUAGES.map(l => <option key={l.code} value={l.code} style={{ background: 'var(--bg-card)' }}>{l.flag} {l.eng}</option>)}
              </select>
            </motion.div>
          )}

          {/* Text areas container */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {mode === 'translate' ? 'INPUT TEXT' : 'TEXT TO SPEAK'}
                </span>
                <span className="badge" style={{ background: `${inputLang.color}15`, color: inputLang.color, border: `1px solid ${inputLang.color}30`, fontSize: '0.72rem' }}>
                  {inputLang.flag} {inputLang.eng}
                </span>
              </div>
              <button onClick={loadSample} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 12px', color: 'var(--text-muted)', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-display)', fontWeight: 600 }}>Load Sample</button>
            </div>

            {/* Input textarea */}
            <textarea
              value={text} onChange={e => setText(e.target.value)}
              placeholder={mode === 'translate' ? `Type text in ${inputLang.eng}... It will be translated to ${outputLang.eng} and spoken.` : `Type or paste text in ${inputLang.eng}...`}
              style={{ width: '100%', minHeight: mode === 'translate' ? 160 : 220, padding: '20px', background: 'transparent', border: 'none', color: 'var(--text-primary)', fontSize: '1rem', lineHeight: 1.7, resize: 'vertical', outline: 'none', fontFamily: 'var(--font-body)' }}
            />

            {/* Translate button (in translate mode) */}
            {mode === 'translate' && (
              <>
                <div style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderTop: '1px solid var(--border)' }}>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleTranslate} disabled={translating || !text.trim()}
                    style={{ background: 'linear-gradient(135deg,var(--teal),var(--blue))', border: 'none', borderRadius: 10, padding: '10px 28px', color: 'var(--bg-void)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: translating || !text.trim() ? 0.6 : 1 }}>
                    {translating ? (
                      <><div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--bg-void)', animation: 'spin-slow 0.8s linear infinite' }} />Translating...</>
                    ) : '🌐 Translate'}
                  </motion.button>
                </div>

                {/* Translated text display */}
                <div style={{ borderTop: '1px solid var(--border)', padding: '14px 20px', background: 'rgba(0,245,212,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--teal)' }}>TRANSLATED OUTPUT</span>
                    <span className="badge" style={{ background: `${outputLang.color}15`, color: outputLang.color, border: `1px solid ${outputLang.color}30`, fontSize: '0.72rem' }}>
                      {outputLang.flag} {outputLang.eng}
                    </span>
                  </div>
                  <div style={{ minHeight: 80, color: translatedText ? 'var(--text-primary)' : 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.7 }}>
                    {translating ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(0,245,212,0.3)', borderTopColor: 'var(--teal)', animation: 'spin-slow 0.8s linear infinite' }} />
                        <span style={{ color: 'var(--teal)' }}>Translating...</span>
                      </div>
                    ) : translatedText || 'Translation will appear here...'}
                  </div>
                </div>
              </>
            )}

            {/* Footer */}
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button onClick={() => { setText(''); setTranslatedText('') }} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-body)' }}>✕ Clear</button>
              <span style={{ color: charCount > maxChars * 0.9 ? 'var(--rose)' : 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 500 }}>
                {charCount.toLocaleString()} / {maxChars.toLocaleString()}
              </span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Give this generation a name (optional)" className="input-field" />
          </motion.div>

          {/* Audio Player */}
          <AnimatePresence>
            {(audioUrl || loading) && (
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                style={{ background: 'linear-gradient(135deg,rgba(0,245,212,0.05),rgba(59,130,246,0.05))', border: '1px solid rgba(0,245,212,0.2)', borderRadius: 20, padding: '24px' }}>
                <WaveformVisualizer isPlaying={isPlaying} isLoading={loading} />
                {audioUrl && (
                  <>
                    <audio ref={audioRef} src={audioUrl} />
                    <div style={{ marginTop: 16 }}>
                      <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', cursor: 'pointer' }}
                        onClick={e => { const r = e.currentTarget.getBoundingClientRect(); const pct = (e.clientX - r.left) / r.width; if (audioRef.current) audioRef.current.currentTime = pct * duration }}>
                        <motion.div animate={{ width: `${progressPct}%` }} style={{ height: '100%', background: 'linear-gradient(90deg,var(--teal),var(--blue))', borderRadius: 2 }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                        <span>{fmtTime(currentTime)}</span><span>{fmtTime(duration)}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 16 }}>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.max(0, currentTime - 5) }}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>⏮</motion.button>
                      <motion.button whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={togglePlay}
                        style={{ background: 'var(--teal)', border: 'none', borderRadius: '50%', width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, boxShadow: '0 4px 16px rgba(0,245,212,0.4)' }}>
                        {isPlaying ? '⏸' : '▶'}
                      </motion.button>
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => { if (audioRef.current) audioRef.current.currentTime = Math.min(duration, currentTime + 5) }}
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>⏭</motion.button>
                      <motion.button whileHover={{ scale: 1.05 }} onClick={handleDownload} className="btn-primary"
                        style={{ marginLeft: 8, padding: '10px 20px', fontSize: '0.85rem', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        ↓ Download MP3
                      </motion.button>
                    </div>
                  </>
                )}
                {loading && (
                  <div style={{ textAlign: 'center', marginTop: 16 }}>
                    <p style={{ color: 'var(--teal)', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>
                      ✨ Synthesizing voice with neural AI...
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Generate Button */}
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }} onClick={handleGenerate} disabled={loading || !text.trim()} className="btn-primary"
            style={{ padding: '16px', fontSize: '1.1rem', borderRadius: 14, opacity: loading || !text.trim() ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            {loading ? (
              <><div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(0,0,0,0.3)', borderTopColor: 'var(--bg-void)', animation: 'spin-slow 0.8s linear infinite' }} />Generating Neural Voice...</>
            ) : <>🎙 {mode === 'translate' ? 'Translate & Generate Voice' : 'Generate Voice'}</>}
          </motion.button>
        </div>

        {/* Right: Controls panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Language Selector (for direct mode) */}
          {mode === 'direct' && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 14 }}>LANGUAGE</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                {LANGUAGES.map(lang => (
                  <motion.button key={lang.code} whileTap={{ scale: 0.96 }} onClick={() => setInputLanguage(lang.code)}
                    style={{ padding: '10px 8px', borderRadius: 10, border: `1px solid ${inputLanguage === lang.code ? lang.color + '60' : 'var(--border)'}`, background: inputLanguage === lang.code ? `${lang.color}12` : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: inputLanguage === lang.code ? lang.color : 'var(--text-primary)' }}>{lang.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{lang.eng}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Voice Type */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 14 }}>VOICE TYPE</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[{ v: 'female', icon: '👩', label: 'Female', color: 'var(--teal)' }, { v: 'male', icon: '👨', label: 'Male', color: 'var(--blue)' }].map(({ v, icon, label, color }) => (
                <motion.button key={v} whileTap={{ scale: 0.95 }} onClick={() => setVoiceType(v)}
                  style={{ padding: '16px 12px', borderRadius: 12, border: `1px solid ${voiceType === v ? color + '60' : 'var(--border)'}`, background: voiceType === v ? `${color}12` : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: voiceType === v ? color : 'var(--text-secondary)', fontSize: '0.85rem' }}>{label}</div>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Speed & Pitch */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: 1, marginBottom: 16 }}>VOICE CONTROLS</h3>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>⚡ Speed</span>
                <span style={{ color: 'var(--teal)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem' }}>{speed.toFixed(1)}x</span>
              </div>
              <input type="range" min="0.5" max="2" step="0.1" value={speed} onChange={e => setSpeed(parseFloat(e.target.value))} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Slow</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Fast</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 500 }}>🎵 Pitch</span>
                <span style={{ color: 'var(--purple)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem' }}>{pitch > 0 ? '+' : ''}{pitch}</span>
              </div>
              <input type="range" min="-10" max="10" step="1" value={pitch} onChange={e => setPitch(parseInt(e.target.value))} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>Low</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>High</span>
              </div>
            </div>
          </motion.div>

          {/* Options */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <div onClick={() => setSaveHistory(p => !p)}
                style={{ width: 44, height: 24, borderRadius: 12, background: saveHistory ? 'var(--teal)' : 'var(--border)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                <motion.div animate={{ x: saveHistory ? 22 : 2 }} transition={{ type: 'spring', stiffness: 500 }}
                  style={{ position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: 'white' }} />
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>Save to History</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Keep a record of this generation</div>
              </div>
            </label>
          </motion.div>

          {/* Credits + Upgrade CTA */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}
            onClick={() => navigate('/app/pricing')}
            style={{ cursor: 'pointer', background: (user?.voice_credits || 0) < (user?.plan === 'free' ? 200 : 5000) ? 'rgba(244,63,94,0.06)' : 'rgba(0,245,212,0.04)', border: `1px solid ${(user?.voice_credits || 0) < (user?.plan === 'free' ? 200 : 5000) ? 'rgba(244,63,94,0.2)' : 'rgba(0,245,212,0.15)'}`, borderRadius: 14, padding: '14px 16px', transition: 'all 0.2s' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Credits remaining</span>
              <span style={{ color: (user?.voice_credits || 0) < (user?.plan === 'free' ? 200 : 5000) ? 'var(--rose)' : 'var(--teal)', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                {(user?.voice_credits || 0).toLocaleString()}
              </span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>
              This will use ~{charCount} credits
            </div>
            {(user?.voice_credits || 0) < 10000 && (
              <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(0,245,212,0.08)', borderRadius: 8, textAlign: 'center', fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.8rem', color: 'var(--teal)' }}>
                💎 Upgrade for more credits →
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
