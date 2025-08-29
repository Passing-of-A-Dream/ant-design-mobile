export const TILL_NOW = 'TILL_NOW'

export type PickerDate = Date & {
  tillNow?: boolean
}

export const YEAR_COLUMN = 'year' as const

export const MONTH_COLUMN = 'month' as const

export const DAY_COLUMN = 'day' as const

export const HOUR_COLUMN = 'hour' as const

export const MINUTE_COLUMN = 'minute' as const

export const SECOND_COLUMN = 'second' as const

export type DateColumns =
  | typeof YEAR_COLUMN
  | typeof MONTH_COLUMN
  | typeof DAY_COLUMN
  | typeof HOUR_COLUMN
  | typeof MINUTE_COLUMN
  | typeof SECOND_COLUMN

export type DateColumnsOrder = DateColumns[]

export function normalizeDateColumnsOrder(
  columns: DateColumnsOrder | undefined
): DateColumnsOrder {
  const allKeys = [
    YEAR_COLUMN,
    MONTH_COLUMN,
    DAY_COLUMN,
    HOUR_COLUMN,
    MINUTE_COLUMN,
    SECOND_COLUMN,
  ]

  if (!columns?.length) return [...allKeys]

  if (!Array.isArray(columns))
    throw new Error('DateColumnsOrder must be an array')

  const validSet = new Set(allKeys)
  const seen = new Set<DateColumns>()
  const normalized: DateColumns[] = []

  for (const c of columns) {
    if (!validSet.has(c)) {
      console.warn(`DateColumnsOrder contains invalid value: ${String(c)}`)
      continue
    }
    if (!seen.add(c)) {
      console.warn('DateColumnsOrder contains duplicate values')
      continue
    }
    normalized.push(c)
  }

  return [...normalized, ...allKeys.filter(k => !seen.has(k))]
}
