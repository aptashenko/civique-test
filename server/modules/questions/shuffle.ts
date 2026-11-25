import { randomInt } from 'node:crypto'

export function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomInt(index + 1)
    const item = result[index]!
    result[index] = result[target]!
    result[target] = item
  }
  return result
}
