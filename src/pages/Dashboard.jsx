import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { settingsAPI, historyAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'

function StatCard({ value, label, icon, color, delay }) {
  return (
    <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay }}
      whileHover={{ scale:1.02, y:-2 }}
      style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:18, padding:'24px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',background:`radial-gradient(circle,${color}20,transparent 70%)` }} />
      <div style={{ fontSize:28, marginBottom:12 }}>{icon}</div>
      <div style={{ fontFamily:'var(--font-display)', fontWeight:800, fontSize:'2rem', color }}>{value}</div>
      <div style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginTop:4, fontWeight:500 }}>{label}</div>
    </motion.div>
  )
}

function QuickAction({ icon, title, desc, color, onClick }) {
  return (
    <motion.button whileHover={{ scale:1.02, y:-3 }} whileTap={{ scale:0.98 }} onClick={onClick}
      style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:16, padding:'20px', textAlign:'left', cursor:'pointer', transition:'all 0.2s', width:'100%' }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=`${color}40`}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)'}}>
      <div style={{ width:44,height:44,borderRadius:12,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,marginBottom:12 }}>{icon}</div>
      <div style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:'0.95rem',color:'var(--text-primary)',marginBottom:4 }}>{title}</div>
      <div style={{ color:'var(--text-muted)',fontSize:'0.8rem',lineHeight:1.5 }}>{desc}</div>
    </motion.button>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([settingsAPI.getStats(), historyAPI.getHistory(0, 5)]).then(([s, h]) => {
      setStats(s.data); setRecent(h.data)
    }).finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.full_name?.split(' ')[0] || user?.username || 'Creator'

  return (
    <div>
      {/* Header */}
      <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} style={{ marginBottom:36 }}>
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:16 }}>
          <div>
            <p style={{ color:'var(--text-muted)',fontSize:'0.9rem',marginBottom:6 }}>{greeting} 👋</p>
            <h1 style={{ fontFamily:'var(--font-display)',fontWeight:800,fontSize:'2.2rem',letterSpacing:'-0.02em' }}>
              Welcome back, <span className="gradient-text">{firstName}</span>
            </h1>
            <p style={{ color:'var(--text-secondary)',marginTop:8,fontSize:'0.95rem' }}>Your voice studio is ready. What will you create today?</p>
          </div>
          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
            onClick={() => navigate('/app/studio')} className="btn-primary"
            style={{ padding:'12px 28px', fontSize:'0.95rem', borderRadius:12, flexShrink:0 }}>
            🎙 Open Studio
          </motion.button>
        </div>
      </motion.div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:36 }}>
        <StatCard value={loading?'—':stats?.total_conversions||0} label="Total Conversions" icon="🔊" color="var(--teal)" delay={0.1} />
        <StatCard value={loading?'—':`${((stats?.total_duration_seconds||0)/60).toFixed(1)}m`} label="Audio Generated" icon="⏱" color="var(--blue)" delay={0.15} />
        <StatCard value={loading?'—':(stats?.total_characters||0).toLocaleString()} label="Characters Voiced" icon="📝" color="var(--purple)" delay={0.2} />
        <StatCard value={loading?'—':stats?.favorites||0} label="Favorites Saved" icon="⭐" color="var(--amber)" delay={0.25} />
      </div>

      {/* Quick Actions */}
      <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.3 }} style={{ marginBottom:36 }}>
        <h2 style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:'1.1rem',color:'var(--text-secondary)',letterSpacing:1,marginBottom:16 }}>QUICK ACTIONS</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 }}>
          <QuickAction icon="🎙" title="Text to Speech" desc="Convert any text to natural Indian voices" color="var(--teal)" onClick={() => navigate('/app/studio')} />
          <QuickAction icon="🧬" title="Clone Your Voice" desc="Create a personalized AI voice from your recordings" color="var(--purple)" onClick={() => navigate('/app/voice-clone')} />
          <QuickAction icon="📋" title="Voice History" desc="Browse and replay all your generated audio" color="var(--blue)" onClick={() => navigate('/app/history')} />
          <QuickAction icon="⚙️" title="Settings" desc="Customize defaults, theme, and preferences" color="var(--amber)" onClick={() => navigate('/app/settings')} />
        </div>
      </motion.div>

      {/* Recent History */}
      {recent.length > 0 && (
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.4 }}>
          <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
            <h2 style={{ fontFamily:'var(--font-display)',fontWeight:700,fontSize:'1.1rem',color:'var(--text-secondary)',letterSpacing:1 }}>RECENT GENERATIONS</h2>
            <button onClick={() => navigate('/app/history')} style={{ background:'none',border:'none',color:'var(--teal)',fontSize:'0.85rem',fontFamily:'var(--font-display)',fontWeight:600,cursor:'pointer' }}>View all →</button>
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {recent.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity:0,x:-10 }} animate={{ opacity:1,x:0 }} transition={{ delay:0.45+i*0.05 }}
                style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ width:36,height:36,borderRadius:10,background:'var(--teal-muted)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0 }}>
                  {item.voice_type==='male'?'👨':'👩'}
                </div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontWeight:600,fontSize:'0.9rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis' }}>{item.title}</div>
                  <div style={{ color:'var(--text-muted)',fontSize:'0.78rem',marginTop:2 }}>{item.language} • {item.voice_type} • {item.character_count} chars</div>
                </div>
                <div style={{ color:'var(--text-muted)',fontSize:'0.78rem',flexShrink:0 }}>
                  {new Date(item.created_at).toLocaleDateString('en-IN')}
                </div>
                {item.is_favorite && <span style={{ color:'var(--amber)',fontSize:14 }}>⭐</span>}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {recent.length === 0 && !loading && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.5 }}
          style={{ textAlign:'center', padding:'60px 24px', background:'var(--bg-card)', borderRadius:20, border:'2px dashed var(--border)' }}>
          <div style={{ fontSize:48,marginBottom:16 }}>🎙</div>
          <h3 style={{ fontFamily:'var(--font-display)',fontWeight:700,marginBottom:8 }}>Your studio awaits</h3>
          <p style={{ color:'var(--text-muted)',marginBottom:24 }}>Generate your first voice and it will appear here</p>
          <button className="btn-primary" onClick={() => navigate('/app/studio')}>Create First Voice</button>
        </motion.div>
      )}
    </div>
  )
}
