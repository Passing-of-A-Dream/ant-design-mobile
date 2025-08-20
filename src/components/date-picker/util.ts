export const TILL_NOW = 'TILL_NOW'

export type PickerDate = Date & {
  tillNow?: boolean
}

export const YEAR_COLUMN = 'year' as const

export const MONTH_COLUMN = 'month' as const

export const DAY_COLUMN = 'day' as const
