import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('vaani_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    // Only redirect if we get a 401 AND we are not already on the auth page
    // Otherwise it intercepts normal "invalid password" loops and forces a page reload
    if (err.response?.status === 401 && !window.location.pathname.startsWith('/auth')) {
      localStorage.removeItem('vaani_token')
      localStorage.removeItem('vaani_user')
      window.location.href = '/auth'
    }
    return Promise.reject(err)
  }
)

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  googleAuth: (token) => api.post('/auth/google', { token }),
  getMe: () => api.get('/auth/me'),
}

export const ttsAPI = {
  generate: (data) => api.post('/tts/generate', data),
  getLanguages: () => api.get('/tts/languages'),
  downloadAudio: (filename) => `${API_BASE}/audio/download/${filename}`,
}

export const translateAPI = {
  translate: (data) => api.post('/translate', data),
}

export const historyAPI = {
  getHistory: (skip = 0, limit = 20) => api.get(`/history?skip=${skip}&limit=${limit}`),
  deleteHistory: (id) => api.delete(`/history/${id}`),
  toggleFavorite: (id) => api.patch(`/history/${id}/favorite`),
}

export const voiceAPI = {
  uploadSample: (name, file) => {
    const form = new FormData(); form.append('name', name); form.append('file', file)
    return api.post('/voice/upload-sample', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  getCustomVoices: () => api.get('/voice/custom-voices'),
  convertSong: (songFile, voiceFile) => {
    const form = new FormData()
    form.append('song_file', songFile)
    form.append('voice_file', voiceFile)
    return api.post('/voice/convert-song', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 })
  }
}

export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.patch('/settings', data),
  getStats: () => api.get('/stats'),
}

export const plansAPI = {
  getPlans: () => api.get('/plans'),
  activatePlan: (data) => api.post('/plans/activate', data),
  getHistory: () => api.get('/plans/history'),
}

export const paymentAPI = {
  createOrder: (plan_id) => api.post('/payment/create-order', { plan_id }),
}

export default api
export { API_BASE }
