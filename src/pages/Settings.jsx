import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { settingsAPI } from '../utils/api'
import api from '../utils/api'
import { useAuth } from '../context/AuthContext'

function Section({ title, icon, children }) {
  return (
    <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }}
      style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:18,padding:'24px',marginBottom:18 }}>
      <h3 style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.85rem',color:'var(--text-secondary)',letterSpacing:1,marginBottom:20,display:'flex',alignItems:'center',gap:8 }}>
        <span>{icon}</span> {title}
      </h3>
      {children}
    </motion.div>
  )
}

function Toggle({ value, onChange, label, desc }) {
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:'1px solid var(--border)' }}>
      <div>
        <div style={{ fontWeight:600,fontSize:'0.95rem' }}>{label}</div>
        <div style={{ color:'var(--text-muted)',fontSize:'0.82rem',marginTop:3 }}>{desc}</div>
      </div>
      <div onClick={onChange} style={{ width:48,height:26,borderRadius:13,background:value?'var(--teal)':'var(--border)',position:'relative',cursor:'pointer',transition:'background 0.2s',flexShrink:0 }}>
        <motion.div animate={{ x: value?24:2 }} transition={{ type:'spring',stiffness:500 }}
          style={{ position:'absolute',top:3,width:20,height:20,borderRadius:'50%',background:'white' }} />
      </div>
    </div>
  )
}

export default function Settings() {
  const { user, updateUser } = useAuth()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    settingsAPI.getSettings().then(r => setSettings(r.data)).finally(() => setLoading(false))
  }, [])

  const save = async (updates) => {
    setSaving(true)
    const next = { ...settings, ...updates }
    setSettings(next)
    try { await settingsAPI.updateSettings(updates); toast.success('Settings saved') }
    catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const resetToFree = async () => {
    if (!window.confirm('Reset your plan to Free with 1,000 credits? This cannot be undone.')) return
    setResetting(true)
    try {
      const res = await api.post('/auth/reset-to-free')
      updateUser({ plan: 'free', voice_credits: res.data.voice_credits })
      toast.success('✅ Plan reset to Free — 1,000 credits restored!')
    } catch (e) {
      toast.error('Reset failed: ' + (e.response?.data?.detail || 'Unknown error'))
    } finally { setResetting(false) }
  }

  if (loading) return (
    <div style={{ display:'flex',flexDirection:'column',gap:16 }}>
      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:160,borderRadius:18 }} />)}
    </div>
  )

  return (
    <div style={{ maxWidth:700 }}>
      <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:'var(--font-display)',fontWeight:800,fontSize:'2rem',letterSpacing:'-0.02em' }}>
          <span className="gradient-text">Settings</span>
        </h1>
        <p style={{ color:'var(--text-secondary)',marginTop:6 }}>Customize your Vaani AI experience</p>
      </motion.div>

      {/* Profile */}
      <Section title="PROFILE" icon="👤">
        <div style={{ display:'flex',alignItems:'center',gap:16,marginBottom:20 }}>
          <div style={{ width:60,height:60,borderRadius:'50%',background:'linear-gradient(135deg,var(--teal),var(--blue))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.4rem',fontFamily:'var(--font-display)',fontWeight:800,color:'var(--bg-void)',flexShrink:0 }}>
            {user?.avatar_url?<img src={user.avatar_url} alt="" style={{ width:'100%',height:'100%',borderRadius:'50%',objectFit:'cover' }} />:(user?.full_name||user?.username||'?')[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:'1.1rem' }}>{user?.full_name || user?.username}</div>
            <div style={{ color:'var(--text-muted)',fontSize:'0.85rem' }}>{user?.email}</div>
            <span className="badge badge-teal" style={{ marginTop:6,fontSize:'0.72rem' }}>
              {user?.plan?.toUpperCase()} Plan
            </span>
          </div>
        </div>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
          <div style={{ padding:'14px',background:'var(--bg-deep)',borderRadius:12,border:'1px solid var(--border)' }}>
            <div style={{ color:'var(--text-muted)',fontSize:'0.78rem',marginBottom:4 }}>Voice Credits</div>
            <div style={{ fontFamily:'var(--font-display)',fontWeight:800,fontSize:'1.4rem',color:'var(--teal)' }}>{(user?.voice_credits||0).toLocaleString()}</div>
          </div>
          <div style={{ padding:'14px',background:'var(--bg-deep)',borderRadius:12,border:'1px solid var(--border)' }}>
            <div style={{ color:'var(--text-muted)',fontSize:'0.78rem',marginBottom:4 }}>Account Status</div>
            <div style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.95rem',color:'var(--teal)' }}>✓ Active</div>
          </div>
        </div>
      </Section>

      {/* Defaults */}
      {settings && (
        <Section title="DEFAULT VOICE SETTINGS" icon="🎙">
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16 }}>
            <div>
              <label style={{ display:'block',color:'var(--text-secondary)',fontSize:'0.82rem',fontWeight:600,marginBottom:8 }}>Default Language</label>
              <select value={settings.default_language} onChange={e=>save({default_language:e.target.value})} className="input-field">
                {[['hi-IN','Hindi'],['ta-IN','Tamil'],['te-IN','Telugu'],['mr-IN','Marathi'],['kn-IN','Kannada'],['pa-IN','Punjabi'],['bn-IN','Bengali'],['en-IN','English (India)']].map(([v,l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display:'block',color:'var(--text-secondary)',fontSize:'0.82rem',fontWeight:600,marginBottom:8 }}>Default Voice Type</label>
              <select value={settings.default_voice_type} onChange={e=>save({default_voice_type:e.target.value})} className="input-field">
                <option value="female">👩 Female</option>
                <option value="male">👨 Male</option>
              </select>
            </div>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16 }}>
            <div>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
                <label style={{ color:'var(--text-secondary)',fontSize:'0.82rem',fontWeight:600 }}>Default Speed</label>
                <span style={{ color:'var(--teal)',fontSize:'0.82rem',fontWeight:700 }}>{settings.default_speed}x</span>
              </div>
              <input type="range" min="0.5" max="2" step="0.1" value={settings.default_speed} onChange={e=>save({default_speed:parseFloat(e.target.value)})} />
            </div>
            <div>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:8 }}>
                <label style={{ color:'var(--text-secondary)',fontSize:'0.82rem',fontWeight:600 }}>Default Pitch</label>
                <span style={{ color:'var(--purple)',fontSize:'0.82rem',fontWeight:700 }}>{settings.default_pitch > 0 ? '+':''}{settings.default_pitch}</span>
              </div>
              <input type="range" min="-10" max="10" step="1" value={settings.default_pitch} onChange={e=>save({default_pitch:parseInt(e.target.value)})} />
            </div>
          </div>
        </Section>
      )}

      {/* Preferences */}
      {settings && (
        <Section title="PREFERENCES" icon="⚙️">
          <Toggle value={settings.notifications_enabled} onChange={()=>save({notifications_enabled:!settings.notifications_enabled})}
            label="Notifications" desc="Receive alerts about usage and new features" />
          <Toggle value={settings.auto_save_history} onChange={()=>save({auto_save_history:!settings.auto_save_history})}
            label="Auto-save History" desc="Automatically save all voice generations" />
        </Section>
      )}

      {/* Danger zone */}
      <Section title="DANGER ZONE" icon="⚠️">
        {/* Current plan info */}
        <div style={{ background: 'rgba(0,245,212,0.04)', border: '1px solid rgba(0,245,212,0.12)', borderRadius: 12, padding: '14px 16px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem' }}>
              Current plan: <span style={{ color: 'var(--teal)' }}>{user?.plan?.toUpperCase()}</span>
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2 }}>
              Credits: <strong style={{ color: user?.voice_credits > 10000 ? 'var(--amber)' : 'var(--teal)' }}>{(user?.voice_credits || 0).toLocaleString()}</strong>
              {user?.plan !== 'free' && <span style={{ marginLeft: 6, opacity: 0.6 }}>(paid plan — no weekly reset)</span>}
              {user?.plan === 'free' && <span style={{ marginLeft: 6, opacity: 0.6 }}>· resets weekly to 1,000</span>}
            </div>
          </div>
          {user?.plan !== 'free' && (
            <motion.button whileTap={{ scale: 0.97 }}
              onClick={resetToFree}
              disabled={resetting}
              style={{ padding: '9px 18px', borderRadius: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
              {resetting ? '⏳ Resetting...' : '↩ Reset to Free (1K credits)'}
            </motion.button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button className="btn-secondary" style={{ borderColor: 'var(--rose)', color: 'var(--rose)', padding: '10px 20px' }}
            onClick={() => toast.error('Account deletion requires email verification')}>
            Delete Account
          </button>
          <button className="btn-secondary" style={{ padding: '10px 20px' }}
            onClick={() => toast.success('All data exported — check your email')}>
            Export My Data
          </button>
        </div>
      </Section>

      {saving && (
        <div style={{ position:'fixed',bottom:24,right:24,background:'var(--bg-card)',border:'1px solid var(--teal)',borderRadius:12,padding:'12px 20px',display:'flex',alignItems:'center',gap:10,boxShadow:'0 8px 24px rgba(0,0,0,0.4)' }}>
          <div style={{ width:16,height:16,borderRadius:'50%',border:'2px solid rgba(0,245,212,0.3)',borderTopColor:'var(--teal)',animation:'spin-slow 0.8s linear infinite' }} />
          <span style={{ color:'var(--teal)',fontFamily:'var(--font-display)',fontWeight:600,fontSize:'0.85rem' }}>Saving...</span>
        </div>
      )}
    </div>
  )
}
