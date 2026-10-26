import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { installPreloadRecovery } from './lib/preloadRecovery'
import App from './App.tsx'

installPreloadRecovery()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
