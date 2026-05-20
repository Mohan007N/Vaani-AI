import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { voiceAPI, API_BASE } from '../utils/api'

export default function VoiceClone() {
  const [songFile, setSongFile] = useState(null)
  const [songUrl, setSongUrl] = useState(null)
  const [voiceFile, setVoiceFile] = useState(null)
  const [voiceUrl, setVoiceUrl] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultUrl, setResultUrl] = useState(null)
  const [currentStage, setCurrentStage] = useState('upload') // upload -> process -> result

  const songInputRef = useRef(null)
  const voiceInputRef = useRef(null)

  const handleFileUpload = (e, type) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('audio/')) return toast.error('Please select an audio file')
    if (file.size > 50 * 1024 * 1024) return toast.error('File too large (Max 50MB)')
    
    if (type === 'song') {
      setSongFile(file)
      setSongUrl(URL.createObjectURL(file))
      toast.success('Source song uploaded!')
    } else {
      setVoiceFile(file)
      setVoiceUrl(URL.createObjectURL(file))
      toast.success('Target voice uploaded!')
    }
  }

  const handleConvert = async () => {
    if (!songFile) return toast.error('Please upload a source song first.')
    if (!voiceFile) return toast.error('Please upload your target voice first.')

    setCurrentStage('process')
    setIsProcessing(true)
    setProgress(15)

    try {
      // Since it's a long process, artificially simulate progress to 80%
      const interval = setInterval(() => {
        setProgress(p => (p < 85 ? p + 5 : p))
      }, 3000)

      const res = await voiceAPI.convertSong(songFile, voiceFile)
      
      clearInterval(interval)
      setProgress(100)
      setTimeout(() => {
        setIsProcessing(false)
        setCurrentStage('result')
        setResultUrl(`${API_BASE}${res.data.audio_url}`)
        toast.success(res.data.message || 'Voice conversion complete! 🎉')
      }, 1000)

    } catch (err) {
      setIsProcessing(false)
      setCurrentStage('upload')
      if (err.response?.status === 500 && err.response?.data?.detail?.includes('ELEVENLABS_API_KEY')) {
         toast.error('ElevenLabs API Key is not configured on the backend!')
      } else {
         toast.error(err.response?.data?.detail || 'Voice conversion failed.')
      }
    }
  }

  const resetAll = () => {
    setSongFile(null); setSongUrl(null)
    setVoiceFile(null); setVoiceUrl(null)
    setResultUrl(null); setCurrentStage('upload')
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.5rem', letterSpacing: '-0.02em', marginBottom: 12 }}>
          AI <span className="gradient-text">Voice Clone</span> & Song Cover
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 600, margin: '0 auto' }}>
          Upload any song and your own voice sample. Our neural engine will seamlessly replace the original vocals with your voice!
        </p>
      </motion.div>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          {currentStage === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 24, marginBottom: 32 }}>
                
                {/* 1. Upload Song */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: '32px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #3b82f6, #06b6d4)' }} />
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', marginBottom: 8 }}>1. Source Song</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20, lineHeight: 1.5 }}>
                    Upload the song you want to convert. Works best with clear vocals.
                  </p>
                  <input ref={songInputRef} type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'song')} style={{ display: 'none' }} />
                  
                  {songUrl ? (
                    <div style={{ background: 'rgba(6,182,212,0.1)', padding: 16, borderRadius: 12, border: '1px solid rgba(6,182,212,0.3)' }}>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        ✅ {songFile.name.substring(0, 20)}...
                      </p>
                      <audio controls src={songUrl} style={{ width: '100%', height: 32, borderRadius: 6 }} />
                      <button onClick={() => { setSongFile(null); setSongUrl(null) }} style={{ background: 'none', border: 'none', color: 'var(--rose)', fontSize: '0.8rem', marginTop: 12, cursor: 'pointer', fontWeight: 600 }}>
                        Change File
                      </button>
                    </div>
                  ) : (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => songInputRef.current?.click()}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '2px dashed var(--border)', width: '100%', padding: '24px', borderRadius: 16, cursor: 'pointer', color: 'var(--text-primary)', transition: 'all 0.2s', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      + Select Audio File
                    </motion.button>
                  )}
                </div>

                {/* 2. Upload Target Voice */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: '32px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #a855f7, #ec4899)' }} />
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🎙️</div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.3rem', marginBottom: 8 }}>2. Your Voice</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20, lineHeight: 1.5 }}>
                    Upload a clean acapella isolated tracking of your voice (30-60 secs).
                  </p>
                  <input ref={voiceInputRef} type="file" accept="audio/*" onChange={(e) => handleFileUpload(e, 'voice')} style={{ display: 'none' }} />
                  
                  {voiceUrl ? (
                    <div style={{ background: 'rgba(168,85,247,0.1)', padding: 16, borderRadius: 12, border: '1px solid rgba(168,85,247,0.3)' }}>
                      <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.9rem', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        ✅ {voiceFile.name.substring(0, 20)}...
                      </p>
                      <audio controls src={voiceUrl} style={{ width: '100%', height: 32, borderRadius: 6 }} />
                      <button onClick={() => { setVoiceFile(null); setVoiceUrl(null) }} style={{ background: 'none', border: 'none', color: 'var(--rose)', fontSize: '0.8rem', marginTop: 12, cursor: 'pointer', fontWeight: 600 }}>
                        Change File
                      </button>
                    </div>
                  ) : (
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => voiceInputRef.current?.click()}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '2px dashed var(--border)', width: '100%', padding: '24px', borderRadius: 16, cursor: 'pointer', color: 'var(--text-primary)', transition: 'all 0.2s', fontFamily: 'var(--font-display)', fontWeight: 600 }}>
                      + Select Voice Sample
                    </motion.button>
                  )}
                </div>

              </div>

              {/* Action */}
              <div style={{ textAlign: 'center' }}>
                <motion.button 
                  whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(0,245,212,0.4)' }} 
                  whileTap={{ scale: 0.95 }}
                  disabled={!songFile || !voiceFile}
                  onClick={handleConvert}
                  style={{ background: 'var(--gradient-primary)', color: 'var(--bg-void)', border: 'none', padding: '18px 48px', borderRadius: 100, fontSize: '1.2rem', fontFamily: 'var(--font-display)', fontWeight: 800, cursor: (!songFile || !voiceFile) ? 'not-allowed' : 'pointer', opacity: (!songFile || !voiceFile) ? 0.5 : 1, transition: 'all 0.3s' }}>
                  ✨ Convert My Song
                </motion.button>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 16 }}>
                  Estimated time: ~1 minute • Consumes 500 characters
                </p>
              </div>
            </motion.div>
          )}

          {currentStage === 'process' && (
            <motion.div key="process" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: '60px 40px', textAlign: 'center', minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              
              <div style={{ width: 120, height: 120, position: 'relative', marginBottom: 40 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <motion.div key={i} animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }} style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--teal)' }} />
                ))}
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(135deg, var(--teal), var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, zIndex: 10 }}>🧬</div>
              </div>

              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', marginBottom: 16 }}>
                Synthesizing Custom Cover
              </h2>
              
              <div style={{ width: '100%', maxWidth: 400, background: 'rgba(255,255,255,0.05)', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 16 }}>
                <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 0.5 }} style={{ height: '100%', background: 'var(--gradient-primary)', borderRadius: 4 }} />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: 400, color: 'var(--teal)', fontWeight: 600 }}>
                <span>{progress < 30 ? 'Extracting Vocals...' : progress < 60 ? 'Mapping Voice Model...' : progress < 90 ? 'Mixing Audio...' : 'Applying Mastering...'}</span>
                <span>{progress}%</span>
              </div>
            </motion.div>
          )}

          {currentStage === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,245,212,0.3)', borderRadius: 24, padding: '40px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,245,212,0.1)' }}>
              <div style={{ fontSize: 64, marginBottom: 20 }}>🎉</div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', marginBottom: 12, className: 'gradient-text' }}>
                Your Cover is Ready!
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: '1.1rem' }}>
                We successfully transformed "{songFile?.name}" entirely using your given voice profile.
              </p>

              <div style={{ background: 'var(--bg-deep)', padding: '24px', borderRadius: 16, border: '1px solid var(--border)', maxWidth: 500, margin: '0 auto 32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}><span style={{ color: 'var(--teal)' }}>▶</span> Listen Now</span>
                  <span className="badge badge-teal">HQ Audio</span>
                </div>
                <audio controls src={resultUrl} style={{ width: '100%', borderRadius: 8 }} />
              </div>

              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => resetAll()}
                  style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '14px 32px', borderRadius: 12, fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
                  Start Over
                </motion.button>
                <motion.a whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} href={resultUrl} download="AI_Cover_Vaani.wav"
                  style={{ textDecoration: 'none', background: 'var(--gradient-primary)', color: 'var(--bg-void)', border: 'none', padding: '14px 32px', borderRadius: 12, fontSize: '1rem', fontWeight: 800, fontFamily: 'var(--font-display)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 20px rgba(0,245,212,0.2)' }}>
                  📥 Download MP3
                </motion.a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
