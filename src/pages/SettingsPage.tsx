import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { exportToFile, importFromFile, type ImportMode } from '../lib/backup'

export default function SettingsPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<ImportMode>('merge')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function onExport() {
    setMessage(null)
    setError(null)
    try {
      setBusy(true)
      const n = await exportToFile()
      setMessage(`${n}件のデータを書き出しました`)
    } catch (e) {
      setError(String(e))
    } finally {
      setBusy(false)
    }
  }

  async function onPickFile(file: File | null) {
    if (!file) return
    setMessage(null)
    setError(null)
    if (mode === 'replace') {
      const ok = confirm('現在の端末のデータをすべて消して、ファイルの内容で置き換えます。よろしいですか？')
      if (!ok) return
    }
    try {
      setBusy(true)
      const n = await importFromFile(file, mode)
      setMessage(`${n}件のデータを${mode === 'replace' ? '置き換え' : '追加'}で復元しました`)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="btn" to="/">
            一覧
          </Link>
          <div className="title">設定・バックアップ</div>
          <span />
        </div>
      </header>

      <main className="content stack">
        {message ? <div className="card" style={{ color: 'var(--primary)' }}>{message}</div> : null}
        {error ? (
          <div className="card stack">
            <div>エラー</div>
            <div className="muted" style={{ wordBreak: 'break-word' }}>
              {error}
            </div>
          </div>
        ) : null}

        <div className="card stack">
          <div style={{ fontWeight: 800 }}>バックアップを書き出す</div>
          <div className="muted">
            すべての料理データをJSONファイルとして保存します。サイトデータの削除や機種変更に備えて、ときどき書き出しておくと安心です。
          </div>
          <button className="btn btn-primary" type="button" onClick={onExport} disabled={busy}>
            バックアップを書き出す
          </button>
        </div>

        <div className="card stack">
          <div style={{ fontWeight: 800 }}>バックアップから復元する</div>
          <div className="muted">書き出したJSONファイルを読み込んでデータを復元します。</div>

          <div className="field">
            <div className="label">復元方法</div>
            <label className="row" style={{ justifyContent: 'flex-start', gap: 8 }}>
              <input
                type="radio"
                name="mode"
                checked={mode === 'merge'}
                onChange={() => setMode('merge')}
              />
              <span>追加（今のデータに足す。同じ料理は上書き）</span>
            </label>
            <label className="row" style={{ justifyContent: 'flex-start', gap: 8 }}>
              <input
                type="radio"
                name="mode"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
              />
              <span>置き換え（今のデータを全部消してから復元）</span>
            </label>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            style={{ display: 'none' }}
            onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
          />
          <button
            className="btn"
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
          >
            ファイルを選んで復元
          </button>
        </div>
      </main>
    </div>
  )
}
