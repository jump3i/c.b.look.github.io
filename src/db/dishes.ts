import { db } from './db'
import type { Dish, NutritionInfo } from '../domain/types'
import { nowIso, todayYmd } from '../domain/types'

export async function listDishes(searchText: string): Promise<Dish[]> {
  const all = await db.dishes.toArray()
  const q = searchText.trim().toLowerCase()
  const filtered = q
    ? all.filter((d) => {
        const fields = [
          d.name,
          d.ingredients,
          d.instructions,
          String(d.nutrition.calories ?? ''),
          String(d.nutrition.protein ?? ''),
          String(d.nutrition.fat ?? ''),
          String(d.nutrition.carbohydrates ?? ''),
          d.nutrition.notes,
        ]
        return fields.some((f) => f.toLowerCase().includes(q))
      })
    : all

  return filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getDish(id: string): Promise<Dish | undefined> {
  return db.dishes.get(id)
}

export async function createDish(input: {
  name: string
  ingredients: string
  instructions: string
  nutrition: NutritionInfo
  cookedDates: string[]
}): Promise<Dish> {
  const now = nowIso()
  const dish: Dish = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    ingredients: input.ingredients,
    instructions: input.instructions,
    nutrition: input.nutrition,
    cookedDates: uniqueYmdSortedDesc(input.cookedDates),
    createdAt: now,
    updatedAt: now,
  }
  await db.dishes.add(dish)
  return dish
}

export async function updateDish(
  id: string,
  patch: Partial<Omit<Dish, 'id' | 'createdAt'>> & { nutrition?: NutritionInfo }
): Promise<Dish> {
  const existing = await db.dishes.get(id)
  if (!existing) {
    throw new Error('not_found')
  }
  const updated: Dish = {
    ...existing,
    ...patch,
    nutrition: patch.nutrition ?? existing.nutrition,
    cookedDates: patch.cookedDates
      ? uniqueYmdSortedDesc(patch.cookedDates)
      : existing.cookedDates,
    updatedAt: nowIso(),
  }
  await db.dishes.put(updated)
  return updated
}

export async function deleteDish(id: string): Promise<void> {
  await db.dishes.delete(id)
}

export async function addCookedToday(id: string): Promise<Dish> {
  const existing = await db.dishes.get(id)
  if (!existing) throw new Error('not_found')
  const next = uniqueYmdSortedDesc([todayYmd(), ...existing.cookedDates])
  return updateDish(id, { cookedDates: next })
}

export async function seedIfEmpty(): Promise<void> {
  // 鶏むね肉の塩焼きのシードデータは一旦削除
  return
}

function uniqueYmdSortedDesc(dates: string[]): string[] {
  const set = new Set(dates.map((d) => d.trim()).filter(Boolean))
  return Array.from(set).sort((a, b) => b.localeCompare(a))
}
