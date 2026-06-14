import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listDishes, seedIfEmpty } from '../db/dishes'
import type { Dish } from '../domain/types'

export default function DishListPage() {
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<Dish[]>([])
  const [error, setError] = useState<string | null>(null)

  const headerTitle = useMemo(() => {
    return searchText.trim() ? `検索: ${searchText.trim()}` : '料理'
  }, [searchText])

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        setLoading(true)
        setError(null)
        await seedIfEmpty()
        const next = await listDishes(searchText)
        if (!cancelled) setItems(next)
      } catch (e) {
        if (!cancelled) setError(String(e))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [searchText])

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="title">{headerTitle}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link className="btn" to="/calendar">
              カレンダー
            </Link>
            <Link className="btn" to="/dishes/new">
              追加
            </Link>
            <Link className="btn" to="/settings">
              バックアップ
            </Link>
          </div>
        </div>
        <div className="topbar-inner" style={{ paddingTop: 0 }}>
          <input
            className="input"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="検索"
            inputMode="search"
          />
        </div>
      </header>

      <main className="content">
        {error ? (
          <div className="card stack">
            <div>読み込みに失敗しました</div>
            <div className="muted" style={{ wordBreak: 'break-word' }}>
              {error}
            </div>
          </div>
        ) : loading ? (
          <div className="muted">読み込み中…</div>
        ) : items.length === 0 ? (
          <div className="card stack">
            <div>まだ料理がありません</div>
            <div className="muted">右上の「新規」から追加できます</div>
          </div>
        ) : (
          <div className="list">
            {items.map((d) => (
              <Link key={d.id} to={`/dishes/${d.id}`} className="card list-item">
                <div className="row">
                  <div style={{ fontWeight: 800 }}>{d.name}</div>
                  <span className="chip">更新: {formatYmd(d.updatedAt)}</span>
                </div>
                <div className="muted" style={{ whiteSpace: 'pre-wrap' }}>
                  {previewText(d.ingredients || d.instructions)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

function previewText(text: string): string {
  const t = (text ?? '').trim()
  if (!t) return '—'
  return t.length > 80 ? `${t.slice(0, 80)}…` : t
}

function formatYmd(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

