import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RedirectHandler } from './components/RedirectHandler.tsx'

// Check if current path is a redirect URL
const path = window.location.pathname;
const isRedirect = path.startsWith('/r/');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isRedirect ? <RedirectHandler /> : <App />}
  </StrictMode>,
)
