import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { plansAPI } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'

/* ── helpers ── */
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard!'))
}

function UPIQRCode({ amount, upiId, referenceId }) {
  // Generate a UPI deep link (standard format)
  const upiLink = `upi://pay?pa=${upiId}&pn=Vaani+AI&am=${amount}&cu=INR&tn=${referenceId}`
  // QR via Google Charts API (reliable, no auth needed)
  const qrSrc = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(upiLink)}&choe=UTF-8`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      <div style={{ padding: 12, background: '#fff', borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
        <img src={qrSrc} alt="UPI QR Code" width={180} height={180} style={{ display: 'block', borderRadius: 8 }}
          onError={e => { e.target.style.display = 'none' }} />
      </div>
      <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '0.78rem', textAlign: 'center', maxWidth: 200 }}>
        Scan with any UPI app (GPay, PhonePe, Paytm, BHIM)
      </p>
    </div>
  )
}

export default function Pricing() {
  const { user, updateUser } = useAuth()
  const [plans, setPlans] = useState([])
  const [history, setHistory] = useState([])
  const [upiInfo, setUpiInfo] = useState({ upi_id: '', merchant_name: 'Vaani AI' })
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(null)
  const [showPaymentModal, setShowPaymentModal] = useState(null)
  const [paymentIdInput, setPaymentIdInput] = useState('')
  const [paymentStep, setPaymentStep] = useState(1) // 1=pay, 2=verify
  const [orderInfo, setOrderInfo] = useState(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [pRes, hRes] = await Promise.all([plansAPI.getPlans(), plansAPI.getHistory()])
      setPlans(pRes.data.plans || [])
      setUpiInfo({ upi_id: pRes.data.upi_id || '', merchant_name: pRes.data.merchant_name || 'Vaani AI' })
      setHistory(hRes.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleUpgrade = async (plan) => {
    setPaymentStep(1)
    setPaymentIdInput('')
    setOrderInfo(null)
    setShowPaymentModal(plan)
    // Create order info
    try {
      const res = await api.post('/payment/create-order', { plan_id: plan.id })
      setOrderInfo(res.data)
    } catch (e) {
      // Fallback order info
      setOrderInfo({
        reference_id: `VAANI_${Date.now()}`,
        upi_id: upiInfo.upi_id || 'mohanakrishnann@razorpay',
        merchant_name: 'Vaani AI',
        amount: plan.price,
        description: plan.name
      })
    }
  }

  const confirmPayment = async () => {
    if (!paymentIdInput || paymentIdInput.trim().length < 3) {
      return toast.error('Please enter your UPI Transaction ID or UTR number')
    }
    setActivating(showPaymentModal.id)
    try {
      const res = await plansAPI.activatePlan({ plan_id: showPaymentModal.id, payment_id: paymentIdInput.trim() })
      updateUser({ plan: showPaymentModal.id, voice_credits: res.data.total_credits })
      toast.success(`🎉 Upgraded to ${showPaymentModal.name}! ${res.data.credits_added.toLocaleString()} credits added!`)
      setShowPaymentModal(null)
      loadData()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Activation failed. Contact support.')
    } finally { setActivating(null) }
  }

  const iconMap = { daily: '⚡', monthly: '🚀', yearly: '💎' }
  const colorMap = { daily: '#3b82f6', monthly: '#00F5D4', yearly: '#a855f7' }

  /* ── Next weekly reset countdown ── */
  const nextReset = user?.next_reset_at ? new Date(user.next_reset_at) : null
  const msLeft = nextReset ? Math.max(0, nextReset - Date.now()) : 0
  const daysLeft = Math.floor(msLeft / 86400000)
  const hoursLeft = Math.floor((msLeft % 86400000) / 3600000)

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2.8rem', letterSpacing: '-0.02em' }}>
          Upgrade Your <span className="gradient-text">Voice Power</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 10, fontSize: '1.05rem', maxWidth: 500, margin: '10px auto 0' }}>
          Unlock unlimited voice generation with our affordable Indian pricing
        </p>
        {user?.plan !== 'free' && (
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} style={{ marginTop: 16 }}>
            <span className="badge badge-teal" style={{ fontSize: '0.85rem', padding: '8px 18px' }}>
              ✨ Current Plan: {user.plan.toUpperCase()}
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Weekly credits banner */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        style={{ background: 'linear-gradient(135deg, rgba(0,245,212,0.07), rgba(59,130,246,0.05))', border: '1px solid rgba(0,245,212,0.2)', borderRadius: 20, padding: '20px 28px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ fontSize: 32 }}>🎁</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--teal)', fontSize: '1rem' }}>
              Free Weekly Credits — 1,000 / week
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: 3 }}>
              Your free credits auto-refresh every 7 days. No action needed!
              {nextReset && daysLeft >= 0 && (
                <span style={{ marginLeft: 8, color: 'var(--text-muted)' }}>
                  Next reset in: <strong style={{ color: 'var(--teal)' }}>{daysLeft}d {hoursLeft}h</strong>
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', color: 'var(--teal)' }}>
            {(user?.voice_credits || 0).toLocaleString()}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>credits remaining</div>
        </div>
      </motion.div>

      {/* Low credits warning */}
      <AnimatePresence>
        {user?.voice_credits <= 150 && user?.plan === 'free' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.08), rgba(244,63,94,0.04))', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 16, padding: '20px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontSize: 32 }}>⚠️</div>
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--rose)', fontSize: '1rem' }}>Low Credits Warning</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 4 }}>
                Only <strong style={{ color: 'var(--rose)' }}>{(user?.voice_credits || 0).toLocaleString()}</strong> credits left.
                Upgrade for instant top-up or wait for weekly refresh.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Plans grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 60 }}>
        {plans.map((plan, i) => {
          const accentColor = colorMap[plan.id] || '#00F5D4'
          return (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, boxShadow: `0 24px 70px ${accentColor}18` }}
              style={{ background: 'var(--bg-card)', border: plan.popular ? `2px solid ${accentColor}60` : '1px solid var(--border)', borderRadius: 26, padding: '36px 28px', position: 'relative', overflow: 'hidden', transition: 'all 0.3s', boxShadow: plan.popular ? `0 8px 40px ${accentColor}10` : 'none' }}>
              {plan.popular && (
                <div style={{ position: 'absolute', top: 18, right: -28, background: accentColor, color: '#020409', padding: '4px 44px', fontSize: '0.7rem', fontWeight: 800, transform: 'rotate(45deg)', fontFamily: 'var(--font-display)', letterSpacing: 1, boxShadow: `0 0 24px ${accentColor}60` }}>
                  POPULAR
                </div>
              )}
              {/* Glow orb */}
              <div style={{ position: 'absolute', top: -60, left: -60, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${accentColor}14, transparent 70%)`, pointerEvents: 'none' }} />
              {/* Bottom accent line */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`, opacity: 0.5 }} />

              <div style={{ fontSize: 44, marginBottom: 18 }}>{iconMap[plan.id] || '📦'}</div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', marginBottom: 4 }}>{plan.name}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24 }}>{plan.duration}</p>

              <div style={{ marginBottom: 28 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '3.2rem', color: accentColor, letterSpacing: '-0.05em' }}>₹{plan.price}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginLeft: 4 }}>/{plan.duration}</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                {plan.features.map((f, fi) => (
                  <div key={fi} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem' }}>
                    <span style={{ color: accentColor, fontSize: 15, flexShrink: 0 }}>✓</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{f}</span>
                  </div>
                ))}
              </div>

              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                onClick={() => handleUpgrade(plan)}
                disabled={activating === plan.id || user?.plan === plan.id}
                style={{ width: '100%', padding: '16px', borderRadius: 14, border: 'none', fontSize: '1rem', fontFamily: 'var(--font-display)', fontWeight: 800, cursor: user?.plan === plan.id ? 'default' : 'pointer', background: plan.popular ? accentColor : 'rgba(255,255,255,0.06)', color: plan.popular ? '#020409' : 'var(--text-primary)', opacity: user?.plan === plan.id ? 0.5 : 1, boxShadow: plan.popular ? `0 10px 32px ${accentColor}35` : 'none', transition: 'all 0.2s' }}>
                {user?.plan === plan.id ? '✓ Current Plan' : activating === plan.id ? 'Activating...' : `Get ${plan.name}`}
              </motion.button>
            </motion.div>
          )
        })}
      </div>

      {/* Payment History */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: '36px', overflow: 'hidden' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem', marginBottom: 24 }}>💳 Payment History</h2>
        {history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--bg-deep)', borderRadius: 16, border: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.5 }}>🧾</div>
            <h3 style={{ color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 8 }}>No payments yet</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Your billing history will appear here after your first upgrade.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'left' }}>
                  {['Date', 'Plan', 'Amount', 'Transaction ID', 'Status'].map(h => (
                    <th key={h} style={{ padding: '16px 12px', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map(row => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px 12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {new Date(row.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td style={{ padding: '16px 12px', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{row.plan_name}</td>
                    <td style={{ padding: '16px 12px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>₹{row.amount}</td>
                    <td style={{ padding: '16px 12px', fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{row.payment_id}</td>
                    <td style={{ padding: '16px 12px' }}><span className="badge badge-teal" style={{ fontSize: '0.75rem' }}>✓ {row.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* ── PAYMENT MODAL ── */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}
            onClick={() => setShowPaymentModal(null)}>
            <motion.div initial={{ scale: 0.93, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 30 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', border: '1px solid rgba(0,245,212,0.25)', borderRadius: 32, padding: '0', maxWidth: 500, width: '100%', overflow: 'hidden', boxShadow: '0 30px 100px rgba(0,0,0,0.7)' }}>

              {/* Modal header */}
              <div style={{ padding: '32px 36px 24px', background: 'linear-gradient(135deg, rgba(0,245,212,0.07), rgba(59,130,246,0.05))', borderBottom: '1px solid rgba(255,255,255,0.07)', textAlign: 'center' }}>
                <div style={{ fontSize: 52, marginBottom: 10 }}>{iconMap[showPaymentModal.id]}</div>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', marginBottom: 6 }}>
                  Upgrade to {showPaymentModal.name}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Pay <strong style={{ color: 'var(--teal)' }}>₹{showPaymentModal.price}</strong> via UPI — instant credit activation
                </p>

                {/* Step indicators */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
                  {[{ n: 1, label: 'Pay' }, { n: 2, label: 'Verify' }].map(s => (
                    <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: paymentStep >= s.n ? '#00F5D4' : 'rgba(255,255,255,0.08)', color: paymentStep >= s.n ? '#020409' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.85rem', transition: 'all 0.3s' }}>
                        {paymentStep > s.n ? '✓' : s.n}
                      </div>
                      <span style={{ color: paymentStep >= s.n ? 'var(--teal)' : 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600 }}>{s.label}</span>
                      {s.n < 2 && <div style={{ width: 24, height: 1, background: paymentStep > s.n ? '#00F5D4' : 'rgba(255,255,255,0.1)' }} />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal body */}
              <div style={{ padding: '28px 36px 32px' }}>
                {paymentStep === 1 ? (
                  <>
                    {/* UPI Payment Step */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start', marginBottom: 24 }}>
                      {/* QR Code */}
                      {orderInfo && (
                        <UPIQRCode
                          amount={showPaymentModal.price}
                          upiId={orderInfo.upi_id}
                          referenceId={orderInfo.reference_id}
                        />
                      )}

                      {/* UPI Details */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>UPI ID</div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--bg-deep)', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)' }}>
                            <span style={{ fontFamily: 'monospace', color: 'var(--teal)', fontSize: '0.85rem', flex: 1, wordBreak: 'break-all' }}>{orderInfo?.upi_id || 'mohanakrishnann@razorpay'}</span>
                            <button onClick={() => copyToClipboard(orderInfo?.upi_id || 'mohanakrishnann@razorpay')}
                              style={{ background: 'rgba(0,245,212,0.1)', border: '1px solid rgba(0,245,212,0.2)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer', color: 'var(--teal)', fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                              Copy
                            </button>
                          </div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Amount</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.6rem', color: 'var(--teal)' }}>₹{showPaymentModal.price}</div>
                        </div>
                        <div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Reference ID</div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{orderInfo?.reference_id?.slice(0, 18)}...</span>
                            <button onClick={() => copyToClipboard(orderInfo?.reference_id || '')}
                              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 5, padding: '3px 7px', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.68rem' }}>
                              Copy
                            </button>
                          </div>
                        </div>
                        <p style={{ color: 'rgba(245,158,11,0.8)', fontSize: '0.78rem', lineHeight: 1.5, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, padding: '8px 10px' }}>
                          ⚠️ Add Reference ID in payment note
                        </p>
                      </div>
                    </div>

                    {/* UPI apps */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
                      {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                        <div key={app} style={{ padding: '5px 12px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600 }}>
                          {app}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => setShowPaymentModal(null)} className="btn-secondary" style={{ flex: 1, padding: '14px', borderRadius: 12 }}>Cancel</button>
                      <motion.button whileTap={{ scale: 0.98 }} onClick={() => setPaymentStep(2)} className="btn-primary" style={{ flex: 2, padding: '14px', fontSize: '1rem', borderRadius: 12 }}>
                        I've Paid — Enter ID →
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Verify Step */}
                    <div style={{ marginBottom: 24 }}>
                      <div style={{ background: 'rgba(0,245,212,0.05)', border: '1px solid rgba(0,245,212,0.15)', borderRadius: 14, padding: '16px 18px', marginBottom: 20 }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                          ✅ After paying, enter the <strong style={{ color: 'var(--teal)' }}>UPI Transaction ID / UTR</strong> from your payment app to instantly activate your plan.
                        </p>
                      </div>
                      <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, marginBottom: 8 }}>
                        UPI Transaction ID / UTR Number *
                      </label>
                      <input
                        value={paymentIdInput}
                        onChange={e => setPaymentIdInput(e.target.value)}
                        placeholder="e.g. 423612345678 or T2504171234ABC"
                        className="input-field"
                        style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
                        onKeyDown={e => e.key === 'Enter' && confirmPayment()}
                        autoFocus
                      />
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 8 }}>
                        Find this in your payment app under transaction details.
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => setPaymentStep(1)} className="btn-secondary" style={{ flex: 1, padding: '14px', borderRadius: 12 }}>← Back</button>
                      <motion.button whileTap={{ scale: 0.98 }}
                        onClick={confirmPayment}
                        disabled={activating === showPaymentModal.id}
                        className="btn-primary" style={{ flex: 2, padding: '14px', fontSize: '1rem', borderRadius: 12 }}>
                        {activating === showPaymentModal.id ? 'Verifying...' : 'Verify & Activate 🚀'}
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
