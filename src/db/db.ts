import Dexie, { type Table } from 'dexie'
import type { Dish } from '../domain/types'

class CookMyselfDB extends Dexie {
  dishes!: Table<Dish, string>

  constructor() {
    super('cook_myself')
    this.version(1).stores({
      dishes: 'id, updatedAt, name',
    })
  }
}

export const db = new CookMyselfDB()
