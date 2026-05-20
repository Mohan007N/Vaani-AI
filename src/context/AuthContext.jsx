import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { authAPI } from '../utils/api'

const AuthContext = createContext(null)

// Read localStorage synchronously once at module load — fastest possible
function getStoredUser() {
  try {
    const saved = localStorage.getItem('vaani_user')
    const token = localStorage.getItem('vaani_token')
    if (token && saved) return JSON.parse(saved)
  } catch {}
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser)
  const [loading, setLoading] = useState(false)  // NEVER true at startup
  const refreshing = useRef(false)

  // One-time background refresh — does NOT block UI or set loading=true
  useEffect(() => {
    const token = localStorage.getItem('vaani_token')
    if (!token || refreshing.current) return
    refreshing.current = true

    authAPI.getMe()
      .then(res => {
        setUser(res.data)
        localStorage.setItem('vaani_user', JSON.stringify(res.data))
      })
      .catch(err => {
        // Only force logout on explicit 401 (invalid/expired token)
        // Network errors, timeouts, 5xx — keep the cached user
        if (err?.response?.status === 401) {
          localStorage.removeItem('vaani_token')
          localStorage.removeItem('vaani_user')
          setUser(null)
        }
        // Any other error: silently ignore, user stays logged in
      })
      .finally(() => { refreshing.current = false })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = (token, userData) => {
    localStorage.setItem('vaani_token', token)
    localStorage.setItem('vaani_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('vaani_token')
    localStorage.removeItem('vaani_user')
    setUser(null)
  }

  const updateUser = (data) => {
    const updated = { ...user, ...data }
    setUser(updated)
    localStorage.setItem('vaani_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
