import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const bootElement = document.getElementById('app-boot')
const bootTextElement = bootElement?.querySelector('[data-boot-text]') as HTMLElement | null
const bootStartAt = performance.now()
const MIN_BOOT_VISIBLE_MS = 650

const hideBootScreen = () => {
  if (!bootElement) {
    return
  }

  const elapsed = performance.now() - bootStartAt
  const waitForMinDuration = Math.max(0, MIN_BOOT_VISIBLE_MS - elapsed)

  window.setTimeout(() => {
    bootElement.classList.add('boot-hidden')
    window.setTimeout(() => {
      bootElement.remove()
    }, 220)
  }, waitForMinDuration)
}

const slowHintTimer = window.setTimeout(() => {
  if (bootTextElement) {
    bootTextElement.textContent = '网络较慢，继续加载中…'
  }
}, 4000)

window.addEventListener(
  'app-mounted',
  () => {
    window.clearTimeout(slowHintTimer)
    hideBootScreen()
  },
  { once: true },
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
