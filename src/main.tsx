import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'
import { BrowserRouter } from 'react-router'
import { Themestore, applyThemeToDocument } from './data/Themestore'

/* Scale full app to 80% on Windows so layout fits; Mac stays 100% */
if (typeof navigator !== 'undefined' && /Win/i.test(navigator.userAgent)) {
  document.documentElement.classList.add('platform-windows')
}

{
  const s = Themestore.getState()
  applyThemeToDocument(s.current, s.mode)
}

// Console: "Cross-Origin-Opener-Policy … window.closed" often comes from Google Sign-In popups; unrelated to API/WebSocket.
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
const app = (
  <BrowserRouter>
    <StrictMode>
      <App />
    </StrictMode>
  </BrowserRouter>
)

const rootEl = document.getElementById('root')
if (rootEl) {
  const root = createRoot(rootEl)
  root.render(
    googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>{app}</GoogleOAuthProvider>
    ) : (
      app
    )
  )
}
