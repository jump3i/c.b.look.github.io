import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createDish, getDish, updateDish } from '../db/dishes'
import type { NutritionInfo } from '../domain/types'
import { emptyNutrition, todayYmd } from '../domain/types'

type Props = {
  mode: 'create' | 'edit'
}

export default function DishEditPage({ mode }: Props) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(mode === 'edit')
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [instructions, setInstructions] = useState('')
  const [nutrition, setNutrition] = useState<NutritionInfo>(emptyNutrition())
  const [cookedToday, setCookedToday] = useState(false)

  const title = useMemo(() => (mode === 'create' ? '新規' : '編集'), [mode])

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (mode !== 'edit') return
      try {
        if (!id) throw new Error('missing_id')
        setLoading(true)
        setError(null)
        const d = await getDish(id)
        if (!d) throw new Error('not_found')
        if (cancelled) return
        setName(d.name)
        setIngredients(d.ingredients)
        setInstructions(d.instructions)
        setNutrition(d.nutrition)
        setCookedToday(d.cookedDates.includes(todayYmd()))
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
  }, [mode, id])

  async function onSave() {
    const trimmed = name.trim()
    if (!trimmed) {
      alert('料理名を入力してください')
      return
    }
    try {
      setError(null)
      if (mode === 'create') {
        const d = await createDish({
          name: trimmed,
          ingredients,
          instructions,
          nutrition: normalizeNutrition(nutrition),
          cookedDates: cookedToday ? [todayYmd()] : [],
        })
        navigate(`/dishes/${d.id}`)
        return
      }

      if (!id) throw new Error('missing_id')
      await updateDish(id, {
        name: trimmed,
        ingredients,
        instructions,
        nutrition: normalizeNutrition(nutrition),
        cookedDates: cookedToday ? [todayYmd()] : [],
      })
      navigate(`/dishes/${id}`)
    } catch (e) {
      setError(String(e))
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="btn" to={mode === 'create' ? '/' : `/dishes/${id ?? ''}`}>
            戻る
          </Link>
          <div className="title">{title}</div>
          <button className="btn btn-primary" type="button" onClick={onSave}>
            保存
          </button>
        </div>
      </header>

      <main className="content stack">
        {error ? (
          <div className="card stack">
            <div>エラー</div>
            <div className="muted" style={{ wordBreak: 'break-word' }}>
              {error}
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="muted">読み込み中…</div>
        ) : (
          <>
            <div className="card stack">
              <div className="field">
                <div className="label">料理名</div>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <label className="row" style={{ justifyContent: 'flex-start' }}>
                <input
                  type="checkbox"
                  checked={cookedToday}
                  onChange={(e) => setCookedToday(e.target.checked)}
                />
                <span style={{ fontWeight: 700 }}>今日作った</span>
                <span className="muted"></span>
              </label>
            </div>

            <div className="card stack">
              <div className="field">
                <div className="label">材料</div>
                <textarea
                  className="textarea"
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                />
              </div>
              <div className="field">
                <div className="label">作り方</div>
                <textarea
                  className="textarea"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
              </div>
            </div>

            <div className="card stack">
              <div style={{ fontWeight: 800 }}>栄養</div>
              <div className="grid2">
                <NumberWithUnit
                  label="カロリー"
                  unit="kcal"
                  value={nutrition.calories}
                  onChange={(v) => setNutrition((n) => ({ ...n, calories: v }))}
                />
                <NumberWithUnit
                  label="たんぱく質"
                  unit="g"
                  value={nutrition.protein}
                  onChange={(v) => setNutrition((n) => ({ ...n, protein: v }))}
                />
                <NumberWithUnit
                  label="脂質"
                  unit="g"
                  value={nutrition.fat}
                  onChange={(v) => setNutrition((n) => ({ ...n, fat: v }))}
                />
                <NumberWithUnit
                  label="炭水化物"
                  unit="g"
                  value={nutrition.carbohydrates}
                  onChange={(v) => setNutrition((n) => ({ ...n, carbohydrates: v }))}
                />
              </div>
              <div className="field">
                <div className="label">メモ・その他</div>
                <input
                  className="input"
                  value={nutrition.notes}
                  onChange={(e) => setNutrition((n) => ({ ...n, notes: e.target.value }))}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}

function NumberWithUnit(props: {
  label: string
  unit: string
  value?: number
  onChange: (v: number | undefined) => void
}) {
  const text = props.value == null ? '' : Number.isInteger(props.value) ? String(props.value) : props.value.toFixed(1)
  return (
    <div className="field">
      <div className="label">{props.label}</div>
      <div className="unitRow">
        <input
          className="input"
          value={text}
          onChange={(e) => props.onChange(parseNum(e.target.value))}
          inputMode="decimal"
        />
        <div className="unit">{props.unit}</div>
      </div>
    </div>
  )
}

function parseNum(text: string): number | undefined {
  const t = text.trim()
  if (!t) return undefined
  const normalized = t.replaceAll(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : undefined
}

function normalizeNutrition(n: NutritionInfo): NutritionInfo {
  // keep notes; undefined for invalid/empty numbers
  return {
    calories: n.calories,
    protein: n.protein,
    fat: n.fat,
    carbohydrates: n.carbohydrates,
    notes: n.notes ?? '',
  }
}

