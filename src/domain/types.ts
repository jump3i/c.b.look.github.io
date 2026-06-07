export type NutritionInfo = {
  calories?: number
  protein?: number
  fat?: number
  carbohydrates?: number
  notes: string
}

export type Dish = {
  id: string
  name: string
  instructions: string
  ingredients: string
  nutrition: NutritionInfo
  cookedDates: string[] // yyyy-mm-dd
  createdAt: string // ISO
  updatedAt: string // ISO
}

export function emptyNutrition(): NutritionInfo {
  return { notes: '' }
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function todayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
