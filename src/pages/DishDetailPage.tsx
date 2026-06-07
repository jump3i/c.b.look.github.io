import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { addCookedToday, deleteDish, getDish } from '../db/dishes'
import type { Dish } from '../domain/types'

export default function DishDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dish, setDish] = useState<Dish | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const nutritionLines = useMemo(() => {
    if (!dish) return []
    const n = dish.nutrition
    const lines: string[] = []
    if (n.calories != null) lines.push(`カロリー: ${fmt(n.calories)} kcal`)
    if (n.protein != null) lines.push(`たんぱく質: ${fmt(n.protein)} g`)
    if (n.fat != null) lines.push(`脂質: ${fmt(n.fat)} g`)
    if (n.carbohydrates != null) lines.push(`炭水化物: ${fmt(n.carbohydrates)} g`)
    if (n.notes.trim()) lines.push(n.notes.trim())
    return lines
  }, [dish])

  useEffect(() => {
    let cancelled = false
    async function run() {
      try {
        if (!id) throw new Error('missing_id')
        setLoading(true)
        setError(null)
        const d = await getDish(id)
        if (!d) throw new Error('not_found')
        if (!cancelled) setDish(d)
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
  }, [id])

  async function onAddCookedToday() {
    if (!id) return
    const next = await addCookedToday(id)
    setDish(next)
  }

  async function onDelete() {
    if (!id) return
    const ok = confirm('この料理を削除しますか？')
    if (!ok) return
    await deleteDish(id)
    navigate('/')
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="btn" to="/">
            一覧
          </Link>
          <div className="title">{dish?.name ?? '詳細'}</div>
          {id ? (
            <Link className="btn" to={`/dishes/${id}/edit`}>
              編集
            </Link>
          ) : (
            <span />
          )}
        </div>
      </header>

      <main className="content stack">
        {error ? (
          <div className="card stack">
            <div>表示できませんでした</div>
            <div className="muted" style={{ wordBreak: 'break-word' }}>
              {error}
            </div>
          </div>
        ) : loading || !dish ? (
          <div className="muted">読み込み中…</div>
        ) : (
          <>
            <div className="card stack">
              <div className="row">
                <div style={{ fontWeight: 800 }}>作った日</div>
                <button className="btn btn-primary" type="button" onClick={onAddCookedToday}>
                  今日作った
                </button>
              </div>
              {dish.cookedDates.length === 0 ? (
                <div className="muted">まだ記録がありません</div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>{dish.cookedDates.join('\n')}</div>
              )}
            </div>

            <div className="card stack">
              <div style={{ fontWeight: 800 }}>材料</div>
              <div className={dish.ingredients.trim() ? '' : 'muted'} style={{ whiteSpace: 'pre-wrap' }}>
                {dish.ingredients.trim() ? dish.ingredients : '材料が登録されていません'}
              </div>
            </div>

            <div className="card stack">
              <div style={{ fontWeight: 800 }}>作り方</div>
              <div
                className={dish.instructions.trim() ? '' : 'muted'}
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {dish.instructions.trim() ? dish.instructions : '作り方が登録されていません'}
              </div>
            </div>

            <div className="card stack">
              <div style={{ fontWeight: 800 }}>栄養</div>
              {nutritionLines.length === 0 ? (
                <div className="muted">栄養情報が登録されていません</div>
              ) : (
                <div style={{ whiteSpace: 'pre-wrap' }}>{nutritionLines.join('\n')}</div>
              )}
            </div>

            <div className="card stack">
              <div className="row">
                <div className="muted">登録: {formatIso(dish.createdAt)}</div>
                <div className="muted">更新: {formatIso(dish.updatedAt)}</div>
              </div>
              <button className="btn btn-danger" type="button" onClick={onDelete}>
                削除
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function formatIso(iso: string): string {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${hh}:${mm}`
}

