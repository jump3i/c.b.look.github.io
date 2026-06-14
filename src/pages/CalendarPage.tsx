import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addCookedDate, listDishes, removeCookedDate } from '../db/dishes'
import type { Dish } from '../domain/types'
import { todayYmd } from '../domain/types'

const DOW = ['日', '月', '火', '水', '木', '金', '土']

function ymdOf(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

function buildCells(y: number, m: number): (string | null)[] {
  const startDow = new Date(y, m, 1).getDay()
  const daysInMonth = new Date(y, m + 1, 0).getDate()
  const cells: (string | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(ymdOf(y, m, d))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function CalendarPage() {
  const today = todayYmd()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const [dishes, setDishes] = useState<Dish[]>([])
  const [selected, setSelected] = useState<string>(today)
  const [pick, setPick] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function reload() {
    try {
      setError(null)
      setDishes(await listDishes(''))
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  const byDate = useMemo(() => {
    const map = new Map<string, Dish[]>()
    for (const d of dishes) {
      for (const date of d.cookedDates) {
        const arr = map.get(date) ?? []
        arr.push(d)
        map.set(date, arr)
      }
    }
    return map
  }, [dishes])

  const cells = useMemo(() => buildCells(cursor.y, cursor.m), [cursor])
  const selectedDishes = byDate.get(selected) ?? []

  function prevMonth() {
    setCursor((c) => (c.m === 0 ? { y: c.y - 1, m: 11 } : { y: c.y, m: c.m - 1 }))
  }
  function nextMonth() {
    setCursor((c) => (c.m === 11 ? { y: c.y + 1, m: 0 } : { y: c.y, m: c.m + 1 }))
  }
  function goToday() {
    const d = new Date()
    setCursor({ y: d.getFullYear(), m: d.getMonth() })
    setSelected(today)
  }

  async function onRegister() {
    if (!pick) return
    await addCookedDate(pick, selected)
    setPick('')
    await reload()
  }

  async function onRemove(id: string) {
    await removeCookedDate(id, selected)
    await reload()
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="btn" to="/">
            一覧
          </Link>
          <div className="title">カレンダー</div>
          <button className="btn btn-sm" type="button" onClick={goToday}>
            今日
          </button>
        </div>
      </header>

      <main className="content stack">
        {error ? (
          <div className="card stack">
            <div>読み込みに失敗しました</div>
            <div className="muted" style={{ wordBreak: 'break-word' }}>
              {error}
            </div>
          </div>
        ) : loading ? (
          <div className="muted">読み込み中…</div>
        ) : (
          <>
            <div className="card stack">
              <div className="row">
                <button className="btn btn-sm" type="button" onClick={prevMonth}>
                  ‹
                </button>
                <div style={{ fontWeight: 800 }}>
                  {cursor.y}年 {cursor.m + 1}月
                </div>
                <button className="btn btn-sm" type="button" onClick={nextMonth}>
                  ›
                </button>
              </div>

              <div className="cal-grid">
                {DOW.map((w) => (
                  <div className="cal-dow" key={w}>
                    {w}
                  </div>
                ))}
                {cells.map((cell, i) => {
                  if (!cell) return <div className="cal-cell empty" key={`e${i}`} />
                  const day = Number(cell.slice(8))
                  const cooked = byDate.get(cell) ?? []
                  const cls = ['cal-cell']
                  if (cell === today) cls.push('today')
                  if (cell === selected) cls.push('selected')
                  if (cooked.length) cls.push('has-cooked')
                  return (
                    <button
                      className={cls.join(' ')}
                      key={cell}
                      type="button"
                      onClick={() => setSelected(cell)}
                    >
                      <span className="cal-daynum">{day}</span>
                      {cooked.length ? <span className="cal-count">{cooked.length}</span> : null}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="card stack">
              <div style={{ fontWeight: 800 }}>{selected} の記録</div>

              {selectedDishes.length === 0 ? (
                <div className="muted">この日の記録はありません</div>
              ) : (
                <div>
                  {selectedDishes.map((d) => (
                    <div className="dateRow" key={d.id}>
                      <Link to={`/dishes/${d.id}`} style={{ fontWeight: 600 }}>
                        {d.name}
                      </Link>
                      <button
                        className="btn btn-sm"
                        type="button"
                        onClick={() => onRemove(d.id)}
                      >
                        削除
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="field">
                <div className="label">この日に料理を登録</div>
                {dishes.length === 0 ? (
                  <div className="muted">先に料理を登録してください</div>
                ) : (
                  <div className="unitRow">
                    <select
                      className="input"
                      value={pick}
                      onChange={(e) => setPick(e.target.value)}
                    >
                      <option value="">料理を選択…</option>
                      {dishes.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    <button
                      className="btn btn-primary"
                      type="button"
                      onClick={onRegister}
                      disabled={!pick}
                    >
                      登録
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
