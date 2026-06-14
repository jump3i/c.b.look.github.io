import { db } from '../db/db'
import type { Dish, NutritionInfo } from '../domain/types'

const FORMAT = 'cook_myself-backup'
const VERSION = 1

type BackupFile = {
  format: string
  version: number
  exportedAt: string
  dishes: Dish[]
}

export type ImportMode = 'merge' | 'replace'

export async function exportToFile(): Promise<number> {
  const dishes = await db.dishes.toArray()
  const payload: BackupFile = {
    format: FORMAT,
    version: VERSION,
    exportedAt: new Date().toISOString(),
    dishes,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cook_myself-backup-${payload.exportedAt.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return dishes.length
}

export async function importFromFile(file: File, mode: ImportMode): Promise<number> {
  let parsed: unknown
  try {
    parsed = JSON.parse(await file.text())
  } catch {
    throw new Error('JSONとして読み込めませんでした')
  }

  const root = asRecord(parsed)
  if (!root || root.format !== FORMAT || !Array.isArray(root.dishes)) {
    throw new Error('このアプリのバックアップファイルではありません')
  }

  const dishes = root.dishes
    .map(normalizeDish)
    .filter((d): d is Dish => d !== null)

  if (dishes.length === 0) {
    throw new Error('復元できる料理データが見つかりませんでした')
  }

  await db.transaction('rw', db.dishes, async () => {
    if (mode === 'replace') {
      await db.dishes.clear()
    }
    await db.dishes.bulkPut(dishes)
  })

  return dishes.length
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null
}

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback
}

function num(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

function normNutrition(v: unknown): NutritionInfo {
  const r = asRecord(v)
  return {
    calories: num(r?.calories),
    protein: num(r?.protein),
    fat: num(r?.fat),
    carbohydrates: num(r?.carbohydrates),
    notes: str(r?.notes),
  }
}

function normalizeDish(v: unknown): Dish | null {
  const r = asRecord(v)
  if (!r || typeof r.id !== 'string' || typeof r.name !== 'string') return null
  const now = new Date().toISOString()
  const cookedDates = Array.isArray(r.cookedDates)
    ? r.cookedDates.filter((x): x is string => typeof x === 'string')
    : []
  return {
    id: r.id,
    name: r.name,
    instructions: str(r.instructions),
    ingredients: str(r.ingredients),
    nutrition: normNutrition(r.nutrition),
    cookedDates,
    createdAt: str(r.createdAt, now),
    updatedAt: str(r.updatedAt, now),
  }
}
