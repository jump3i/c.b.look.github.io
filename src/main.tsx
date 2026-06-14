import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

// この端末のデータ（IndexedDB）が空き容量不足で自動削除されにくいよう、
// ブラウザに永続ストレージの利用を要求する。
async function requestPersistentStorage() {
  try {
    if (navigator.storage?.persist && navigator.storage.persisted) {
      const already = await navigator.storage.persisted()
      if (!already) await navigator.storage.persist()
    }
  } catch {
    // 非対応ブラウザでは無視
  }
}
void requestPersistentStorage()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
