import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const bootElement = document.getElementById('app-boot')
const hideBootScreen = () => {
  if (!bootElement) {
    return
  }

  bootElement.classList.add('boot-hidden')
  window.setTimeout(() => {
    bootElement.remove()
  }, 220)
}

window.addEventListener('app-mounted', hideBootScreen, { once: true })
window.setTimeout(hideBootScreen, 3500)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
