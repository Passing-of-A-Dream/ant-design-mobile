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
