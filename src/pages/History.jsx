import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { historyAPI } from '../utils/api'

const LANG_NAMES = {
  'hi-IN':'Hindi','ta-IN':'Tamil','te-IN':'Telugu','mr-IN':'Marathi',
  'kn-IN':'Kannada','pa-IN':'Punjabi','bn-IN':'Bengali','ml-IN':'Malayalam',
  'gu-IN':'Gujarati','en-IN':'English (IN)','en-US':'English (US)','en-GB':'English (UK)'
}

function HistoryItem({ item, onDelete, onFav, onPlay, playing }) {
  return (
    <motion.div layout initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} exit={{ opacity:0,x:-20 }}
      style={{ background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:16,padding:'18px 20px',display:'flex',alignItems:'center',gap:16 }}
      whileHover={{ borderColor:'rgba(0,245,212,0.2)' }}>
      {/* Play button */}
      <motion.button whileTap={{ scale:0.9 }} onClick={() => onPlay(item)}
        style={{ width:44,height:44,borderRadius:'50%',background:playing===item.id?'var(--teal)':'rgba(0,245,212,0.1)',border:'1px solid rgba(0,245,212,0.3)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,cursor:'pointer',flexShrink:0,color:playing===item.id?'var(--bg-void)':'var(--teal)' }}>
        {playing===item.id?'⏸':'▶'}
      </motion.button>

      {/* Info */}
      <div style={{ flex:1,minWidth:0 }}>
        <div style={{ fontWeight:600,fontSize:'0.95rem',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',marginBottom:4 }}>
          {item.title || item.text_input?.substring(0,60)+'...'}
        </div>
        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
          <span className="badge badge-teal" style={{ fontSize:'0.7rem',padding:'2px 8px' }}>{LANG_NAMES[item.language]||item.language}</span>
          <span className="badge" style={{ fontSize:'0.7rem',padding:'2px 8px',background:'rgba(255,255,255,0.05)',color:'var(--text-muted)',border:'1px solid var(--border)' }}>
            {item.voice_type==='male'?'👨':'👩'} {item.voice_type}
          </span>
          {item.duration_seconds && <span style={{ color:'var(--text-muted)',fontSize:'0.75rem',display:'flex',alignItems:'center' }}>⏱ {item.duration_seconds.toFixed(1)}s</span>}
          <span style={{ color:'var(--text-muted)',fontSize:'0.75rem' }}>{item.character_count} chars</span>
        </div>
      </div>

      {/* Date */}
      <div style={{ color:'var(--text-muted)',fontSize:'0.78rem',flexShrink:0,textAlign:'right' }}>
        {new Date(item.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
      </div>

      {/* Actions */}
      <div style={{ display:'flex',gap:6,flexShrink:0 }}>
        <motion.button whileTap={{ scale:0.9 }} onClick={() => onFav(item.id)}
          style={{ background:'none',border:'1px solid var(--border)',borderRadius:8,width:34,height:34,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>
          {item.is_favorite?'⭐':'☆'}
        </motion.button>
        {item.audio_file_path && (
          <motion.button whileTap={{ scale:0.9 }}
            onClick={() => { const a=document.createElement('a');a.href=`http://localhost:8000/audio/download/${item.audio_file_path}`;a.download=`vaani-${item.language}.mp3`;a.click() }}
            style={{ background:'none',border:'1px solid var(--border)',borderRadius:8,width:34,height:34,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14 }}>
            ↓
          </motion.button>
        )}
        <motion.button whileTap={{ scale:0.9 }} onClick={() => onDelete(item.id)}
          style={{ background:'none',border:'1px solid var(--border)',borderRadius:8,width:34,height:34,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,color:'var(--text-muted)' }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--rose)';e.currentTarget.style.color='var(--rose)'}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-muted)'}}>
          🗑
        </motion.button>
      </div>
    </motion.div>
  )
}

export default function History() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [playing, setPlaying] = useState(null)
  const audioRef = useRef(null)

  useEffect(() => {
    historyAPI.getHistory(0, 50).then(r => setItems(r.data)).finally(() => setLoading(false))
  }, [])

  const handleDelete = async id => {
    if (!confirm('Delete this audio?')) return
    try { await historyAPI.deleteHistory(id); setItems(p=>p.filter(i=>i.id!==id)); toast.success('Deleted') }
    catch { toast.error('Delete failed') }
  }

  const handleFav = async id => {
    try {
      const res = await historyAPI.toggleFavorite(id)
      setItems(p => p.map(i => i.id===id?{...i,is_favorite:res.data.is_favorite}:i))
    } catch { toast.error('Failed') }
  }

  const handlePlay = item => {
    if (!item.audio_file_path) return toast.error('No audio file')
    const url = `http://localhost:8000/audio/${item.audio_file_path}`
    if (playing === item.id) {
      audioRef.current?.pause(); setPlaying(null)
    } else {
      if (audioRef.current) { audioRef.current.src = url; audioRef.current.play() }
      setPlaying(item.id)
    }
  }

  const filtered = items.filter(i => {
    if (filter === 'favorites' && !i.is_favorite) return false
    if (search && !i.title?.toLowerCase().includes(search.toLowerCase()) && !i.text_input?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div>
      <audio ref={audioRef} onEnded={() => setPlaying(null)} />
      <motion.div initial={{ opacity:0,y:-10 }} animate={{ opacity:1,y:0 }} style={{ marginBottom:28 }}>
        <h1 style={{ fontFamily:'var(--font-display)',fontWeight:800,fontSize:'2rem',letterSpacing:'-0.02em' }}>
          Voice <span className="gradient-text">History</span>
        </h1>
        <p style={{ color:'var(--text-secondary)',marginTop:6 }}>{items.length} generations stored</p>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity:0,y:10 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }}
        style={{ display:'flex',gap:12,marginBottom:20,flexWrap:'wrap',alignItems:'center' }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search history..." className="input-field" style={{ maxWidth:280 }} />
        <div style={{ display:'flex',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,padding:4 }}>
          {[{k:'all',l:'All'},{k:'favorites',l:'⭐ Favorites'}].map(({k,l}) => (
            <button key={k} onClick={() => setFilter(k)}
              style={{ padding:'7px 16px',borderRadius:7,border:'none',background:filter===k?'var(--teal-muted)':'transparent',color:filter===k?'var(--teal)':'var(--text-muted)',fontFamily:'var(--font-display)',fontWeight:600,fontSize:'0.85rem',cursor:'pointer' }}>
              {l}
            </button>
          ))}
        </div>
        {items.length > 0 && (
          <span style={{ marginLeft:'auto',color:'var(--text-muted)',fontSize:'0.85rem' }}>{filtered.length} results</span>
        )}
      </motion.div>

      {loading ? (
        <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height:80,borderRadius:16 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          style={{ textAlign:'center',padding:'80px 24px',background:'var(--bg-card)',borderRadius:20,border:'2px dashed var(--border)' }}>
          <div style={{ fontSize:48,marginBottom:16 }}>📋</div>
          <h3 style={{ fontFamily:'var(--font-display)',fontWeight:700,marginBottom:8 }}>
            {search || filter==='favorites' ? 'No matching results' : 'No history yet'}
          </h3>
          <p style={{ color:'var(--text-muted)' }}>
            {search ? 'Try a different search term' : 'Generate your first voice in the Studio'}
          </p>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {filtered.map(item => (
              <HistoryItem key={item.id} item={item} onDelete={handleDelete} onFav={handleFav} onPlay={handlePlay} playing={playing} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  )
}
