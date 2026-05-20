import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from 'react-hot-toast'
import App from './App'
import './index.css'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id'

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#0d1424', color: '#e2e8f0', border: '1px solid #1a2540', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
          success: { iconTheme: { primary: '#00F5D4', secondary: '#0f1117' } },
          error: { iconTheme: { primary: '#f43f5e', secondary: '#0f1117' } },
        }}
      />
    </BrowserRouter>
  </GoogleOAuthProvider>
)
