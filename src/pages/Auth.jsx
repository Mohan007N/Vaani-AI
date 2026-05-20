import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGoogleLogin } from '@react-oauth/google'
import toast from 'react-hot-toast'
import { authAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'

function ParticleBg() {
  return (
    <div style={{ position:'fixed',inset:0,overflow:'hidden',pointerEvents:'none' }}>
      {Array.from({length:20}).map((_,i) => (
        <motion.div key={i}
          animate={{ y:[0,-30,0], opacity:[0.05,0.15,0.05], scale:[1,1.1,1] }}
          transition={{ duration:4+i*0.7, repeat:Infinity, delay:i*0.3 }}
          style={{
            position:'absolute',
            left:`${(i*17)%100}%`,
            top:`${(i*23)%100}%`,
            width:i%3===0?200:i%3===1?120:80,
            height:i%3===0?200:i%3===1?120:80,
            borderRadius:'50%',
            background:i%3===0?'radial-gradient(circle,rgba(0,245,212,0.1),transparent 70%)':
                        i%3===1?'radial-gradient(circle,rgba(59,130,246,0.08),transparent 70%)':
                                'radial-gradient(circle,rgba(168,85,247,0.06),transparent 70%)',
            filter:'blur(30px)'
          }}
        />
      ))}
    </div>
  )
}

export default function Auth() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { login } = useAuth()
  const [mode, setMode] = useState(params.get('mode') === 'register' ? 'register' : 'login')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email:'', password:'', username:'', full_name:'' })
  const [showPw, setShowPw] = useState(false)

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    // Validate before showing loading state
    if (mode === 'register' && !form.username.trim()) {
      toast.error('Username is required')
      return
    }
    setLoading(true)
    try {
      let res
      if (mode === 'login') {
        res = await authAPI.login({ email: form.email, password: form.password })
      } else {
        res = await authAPI.register(form)
      }
      login(res.data.access_token, res.data.user)
      toast.success(`Welcome${mode === 'register' ? ' to Vaani AI' : ' back'}! 🎙`)
      navigate('/app')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong. Check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true)
      try {
        const res = await authAPI.googleAuth(tokenResponse.access_token)
        login(res.data.access_token, res.data.user)
        toast.success('Signed in with Google!')
        navigate('/app')
      } catch (err) {
        console.error("Google Auth Backend Error:", err)
        toast.error('Google sign in failed: ' + (err.response?.data?.detail || err.message))
      } finally { setLoading(false) }
    },
    onError: (err) => {
      console.error("Google OAuth Popup Error:", err)
      toast.error('Google sign in failed (Popup closed or blocked)')
    },
  })

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg-void)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative' }}>
      <ParticleBg />

      {/* Back button */}
      <motion.button initial={{ opacity:0 }} animate={{ opacity:1 }} onClick={() => navigate('/')}
        style={{ position:'fixed',top:24,left:24,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',borderRadius:10,padding:'8px 16px',color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:8,zIndex:10 }}>
        ← Back
      </motion.button>

      <motion.div initial={{ opacity:0, y:30, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} transition={{ duration:0.5 }}
        style={{ width:'100%', maxWidth:460, position:'relative', zIndex:1 }}>
        
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <motion.div animate={{ rotate:[0,5,-5,0] }} transition={{ duration:3, repeat:Infinity }}
            style={{ width:60,height:60,borderRadius:18,background:'linear-gradient(135deg,var(--teal),var(--blue))',display:'inline-flex',alignItems:'center',justifyContent:'center',fontSize:28,marginBottom:16,boxShadow:'0 8px 32px rgba(0,245,212,0.3)' }}>
            🎙
          </motion.div>
          <h1 style={{ fontFamily:'var(--font-display)',fontWeight:800,fontSize:'2rem',letterSpacing:'-0.02em' }}>
            <span className="gradient-text">Vaani AI</span>
          </h1>
          <p style={{ color:'var(--text-muted)',marginTop:6,fontSize:'0.9rem' }}>
            {mode==='login' ? 'Welcome back, voice creator' : 'Start your voice journey today'}
          </p>
        </div>

        {/* Card */}
        <div style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:24,padding:'36px 32px',boxShadow:'0 24px 64px rgba(0,0,0,0.5)' }}>
          {/* Tabs */}
          <div style={{ display:'flex',background:'var(--bg-deep)',borderRadius:12,padding:4,marginBottom:28,position:'relative' }}>
            {['login','register'].map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ flex:1,padding:'10px',borderRadius:9,border:'none',fontFamily:'var(--font-display)',fontWeight:600,fontSize:'0.9rem',transition:'all 0.25s',background:mode===m?'var(--bg-card)':'transparent',color:mode===m?'var(--text-primary)':'var(--text-muted)',boxShadow:mode===m?'0 2px 8px rgba(0,0,0,0.3)':'none' }}>
                {m==='login'?'Sign In':'Create Account'}
              </button>
            ))}
          </div>

          {/* Google Button */}
          <button onClick={() => googleLogin()} disabled={loading}
            style={{ width:'100%',padding:'12px',borderRadius:12,background:'rgba(255,255,255,0.05)',border:'1px solid var(--border)',color:'var(--text-primary)',fontFamily:'var(--font-display)',fontWeight:600,fontSize:'0.95rem',display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:20,transition:'all 0.2s' }}
            onMouseEnter={e=>{e.target.style.background='rgba(255,255,255,0.08)';e.target.style.borderColor='rgba(255,255,255,0.2)'}}
            onMouseLeave={e=>{e.target.style.background='rgba(255,255,255,0.05)';e.target.style.borderColor='var(--border)'}}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:20 }}>
            <div style={{ flex:1,height:1,background:'var(--border)' }} />
            <span style={{ color:'var(--text-muted)',fontSize:'0.8rem' }}>or</span>
            <div style={{ flex:1,height:1,background:'var(--border)' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {mode === 'register' && (
                <motion.div key="reg-fields" initial={{ opacity:0,height:0 }} animate={{ opacity:1,height:'auto' }} exit={{ opacity:0,height:0 }} style={{ overflow:'hidden' }}>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:'block',color:'var(--text-secondary)',fontSize:'0.85rem',fontWeight:500,marginBottom:6 }}>Full Name</label>
                    <input name="full_name" value={form.full_name} onChange={handleChange} placeholder="Arjun Sharma" className="input-field" />
                  </div>
                  <div style={{ marginBottom:16 }}>
                    <label style={{ display:'block',color:'var(--text-secondary)',fontSize:'0.85rem',fontWeight:500,marginBottom:6 }}>Username <span style={{color:'var(--rose)'}}>*</span></label>
                    <input name="username" value={form.username} onChange={handleChange} placeholder="arjunvoice" className="input-field" required />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block',color:'var(--text-secondary)',fontSize:'0.85rem',fontWeight:500,marginBottom:6 }}>Email <span style={{color:'var(--rose)'}}>*</span></label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className="input-field" required />
            </div>

            <div style={{ marginBottom:24, position:'relative' }}>
              <label style={{ display:'block',color:'var(--text-secondary)',fontSize:'0.85rem',fontWeight:500,marginBottom:6 }}>Password <span style={{color:'var(--rose)'}}>*</span></label>
              <input name="password" type={showPw?'text':'password'} value={form.password} onChange={handleChange} placeholder="••••••••" className="input-field" required style={{ paddingRight:48 }} />
              <button type="button" onClick={()=>setShowPw(p=>!p)} style={{ position:'absolute',right:14,top:34,background:'none',border:'none',color:'var(--text-muted)',fontSize:16 }}>
                {showPw?'🙈':'👁'}
              </button>
            </div>

            <motion.button type="submit" disabled={loading} className="btn-primary" whileTap={{ scale:0.98 }}
              style={{ width:'100%', fontSize:'1rem', padding:'13px', borderRadius:12, opacity:loading?0.7:1 }}>
              {loading ? (
                <span style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
                  <div style={{ width:18,height:18,borderRadius:'50%',border:'2px solid rgba(0,0,0,0.3)',borderTopColor:'var(--bg-void)',animation:'spin-slow 0.8s linear infinite' }} />
                  {mode==='login'?'Signing in...':'Creating account...'}
                </span>
              ) : mode==='login' ? 'Sign In to Vaani AI' : 'Create Free Account'}
            </motion.button>
          </form>

          {mode==='register' && (
            <p style={{ color:'var(--text-muted)',fontSize:'0.78rem',textAlign:'center',marginTop:16,lineHeight:1.6 }}>
              By registering you agree to our Terms of Service. Get 1,000 free credits on signup.
            </p>
          )}
        </div>
      </motion.div>
    </div>
  )
}
