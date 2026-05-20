import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const NAV = [
  { path: '/app', label: 'Dashboard', icon: '⬡', exact: true },
  { path: '/app/studio', label: 'Studio', icon: '🎙' },
  { path: '/app/history', label: 'History', icon: '📋' },
  { path: '/app/voice-clone', label: 'Voice Clone', icon: '🧬' },
  { path: '/app/pricing', label: 'Pricing', icon: '💎' },
  { path: '/app/settings', label: 'Settings', icon: '⚙️' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    toast.success('Signed out')
    navigate('/')
  }

  const credits = user?.voice_credits || 0
  const isFree = user?.plan === 'free'
  // For free plan: bar shows credits out of 1000 weekly allowance
  // For paid plans: no percentage bar — just show raw credits remaining
  const creditPct = isFree ? Math.min((credits / 1000) * 100, 100) : 100
  const lowCredits = isFree ? credits < 200 : credits < 10000

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-void)' }}>
      {/* Sidebar */}
      <motion.aside animate={{ width: collapsed ? 72 : 260 }} transition={{ duration: 0.25, ease: 'easeInOut' }}
        style={{ background: 'var(--bg-deep)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', zIndex: 50 }}>

        {/* Logo */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <AnimatePresence>
            {!collapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,var(--teal),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🎙</div>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem' }}>
                  <span className="gradient-text">Vaani</span><span style={{ color: 'var(--text-muted)', fontWeight: 400 }}> AI</span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          {collapsed && <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,var(--teal),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>🎙</div>}
          {!collapsed && (
            <button onClick={() => setCollapsed(true)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4, fontSize: 16 }}>‹</button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflow: 'hidden' }}>
          {collapsed && (
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <button onClick={() => setCollapsed(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16 }}>›</button>
            </div>
          )}
          {NAV.map(item => (
            <NavLink key={item.path} to={item.path} end={item.exact}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                borderRadius: 10, marginBottom: 4, textDecoration: 'none', transition: 'all 0.15s',
                background: isActive ? 'var(--teal-muted)' : 'transparent',
                color: isActive ? 'var(--teal)' : 'var(--text-secondary)',
                border: isActive ? '1px solid rgba(0,245,212,0.15)' : '1px solid transparent',
                fontFamily: 'var(--font-display)', fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem', overflow: 'hidden', whiteSpace: 'nowrap', justifyContent: collapsed ? 'center' : 'flex-start'
              })}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              <AnimatePresence>
                {!collapsed && <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>{item.label}</motion.span>}
              </AnimatePresence>
              {/* Badge for pricing */}
              {item.path === '/app/pricing' && !collapsed && lowCredits && (
                <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                  style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: 'var(--rose)', flexShrink: 0 }} />
              )}
            </NavLink>
          ))}
        </nav>

        {/* Credits + User */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={() => navigate('/app/pricing')}
              style={{ background: lowCredits ? 'rgba(244,63,94,0.06)' : 'var(--bg-card)', borderRadius: 12, padding: '14px', marginBottom: 10, border: `1px solid ${lowCredits ? 'rgba(244,63,94,0.2)' : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: 1 }}>VOICE CREDITS</span>
                <span style={{ color: lowCredits ? 'var(--rose)' : 'var(--teal)', fontSize: '0.82rem', fontWeight: 700 }}>
                  {credits.toLocaleString()}
                  {isFree && <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>/1K</span>}
                </span>
              </div>
              {/* Progress bar only meaningful for free plan */}
              {isFree && (
                <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden', marginBottom: 6 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${creditPct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                    style={{ height: '100%', background: lowCredits ? 'linear-gradient(90deg,var(--rose),var(--amber))' : 'linear-gradient(90deg,var(--teal),var(--blue))', borderRadius: 2 }} />
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: isFree ? 0 : 4 }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  {user?.plan?.toUpperCase()} plan
                  {isFree && <span style={{ marginLeft: 4, opacity: 0.65 }}>· resets weekly</span>}
                </span>
                {isFree ? (
                  lowCredits ? (
                    <span style={{ color: 'var(--rose)', fontSize: '0.7rem', fontWeight: 600 }}>Upgrade →</span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{creditPct.toFixed(0)}%</span>
                  )
                ) : (
                  <span style={{ color: 'var(--teal)', fontSize: '0.7rem', fontWeight: 600 }}>Paid ✓</span>
                )}
              </div>
            </motion.div>
          )}

          <button onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.15s', justifyContent: collapsed ? 'center' : 'flex-start', fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '0.88rem' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--rose)'; e.currentTarget.style.color = 'var(--rose)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)' }}>
            <span>🚪</span>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <main style={{ flex: 1, overflow: 'auto', minHeight: '100vh' }}>
        {/* Top bar */}
        <div style={{ padding: '16px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(7,11,20,0.8)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 40 }}>
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Credits chip in topbar */}
            <motion.div whileHover={{ scale: 1.03 }} onClick={() => navigate('/app/pricing')}
              style={{ cursor: 'pointer', padding: '6px 14px', borderRadius: 20, background: lowCredits ? 'rgba(244,63,94,0.08)' : 'rgba(0,245,212,0.06)', border: `1px solid ${lowCredits ? 'rgba(244,63,94,0.2)' : 'rgba(0,245,212,0.15)'}`, display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: lowCredits ? 'var(--rose)' : 'var(--teal)' }}>
              {lowCredits ? '⚠️' : '✨'}{' '}
              {credits >= 1000000
                ? `${(credits / 1000000).toFixed(1)}M`
                : credits >= 1000
                ? `${(credits / 1000).toFixed(0)}K`
                : credits.toLocaleString()}{' '}
              credits{isFree && <span style={{ color: 'rgba(0,245,212,0.5)', fontWeight: 400 }}>/1K</span>}
            </motion.div>
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.9rem' }}>{user?.full_name || user?.username}</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{user?.email}</span>
            </div>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,var(--teal),var(--blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--bg-void)' }}>
              {user?.avatar_url ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} /> : (user?.full_name || user?.username || '?')[0].toUpperCase()}
            </div>
          </div>
        </div>

        <div style={{ padding: '32px', minHeight: 'calc(100vh - 70px)' }} className="page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
