import { RenderLabel } from '../date-picker-view/date-picker-view'
import type { DatePrecision } from './date-picker-date-utils'
import * as dateUtils from './date-picker-date-utils'
import type { QuarterPrecision } from './date-picker-quarter-utils'
import * as quarterUtils from './date-picker-quarter-utils'
import type { WeekPrecision } from './date-picker-week-utils'
import * as weekUtils from './date-picker-week-utils'
import type { PickerDate } from './util'
import {
  DateColumns,
  DAY_COLUMN,
  HOUR_COLUMN,
  MINUTE_COLUMN,
  MONTH_COLUMN,
  SECOND_COLUMN,
  TILL_NOW,
  YEAR_COLUMN,
} from './util'

export type Precision = DatePrecision | WeekPrecision | QuarterPrecision

export type DatePickerFilter = Partial<
  Record<
    Precision,
    (
      val: number,
      extend: {
        date: Date
      }
    ) => boolean
  >
>

export type DateColumnsOrder = DateColumns[]

export function normalizeDateColumnsOrder(
  columns: DateColumnsOrder | undefined
): DateColumnsOrder {
  if (!columns || columns.length === 0) {
    return [
      YEAR_COLUMN,
      MONTH_COLUMN,
      DAY_COLUMN,
      HOUR_COLUMN,
      MINUTE_COLUMN,
      SECOND_COLUMN,
    ]
  }
  if (!Array.isArray(columns))
    throw new Error('DateColumnsOrder must be an array')
  const uniqueColumns = new Set(columns)
  if (uniqueColumns.size !== columns.length) {
    throw new Error('DateColumnsOrder contains duplicate values')
  }
  return columns
}

const precisionLengthRecord: Record<DatePrecision, number> = {
  year: 1,
  month: 2,
  day: 3,
  hour: 4,
  minute: 5,
  second: 6,
}

export const convertDateToStringArray = (
  date: Date | undefined | null,
  precision: Precision,
  columns?: DateColumnsOrder
) => {
  if (precision.includes('week')) {
    return weekUtils.convertDateToStringArray(date)
  } else if (precision.includes('quarter')) {
    return quarterUtils.convertDateToStringArray(date)
  } else {
    const datePrecision = precision as DatePrecision
    const base = dateUtils.convertDateToStringArray(date)
    const length = precisionLengthRecord[datePrecision]

    const map: Record<DateColumns, string> = {
      year: base[0],
      month: base[1],
      day: base[2],
      hour: base[3],
      minute: base[4],
      second: base[5],
    }

    const allKeys: DateColumns[] = [
      YEAR_COLUMN,
      MONTH_COLUMN,
      DAY_COLUMN,
      HOUR_COLUMN,
      MINUTE_COLUMN,
      SECOND_COLUMN,
    ]
    const providedOrder = normalizeDateColumnsOrder(columns)
    const limitedOrder = providedOrder.filter(
      k => allKeys.indexOf(k) <= length - 1
    )

    return limitedOrder.map(k => map[k])
  }
}

export const convertStringArrayToDate = <
  T extends string | number | null | undefined,
>(
  value: T[],
  precision: Precision,
  columns?: DateColumnsOrder
) => {
  // Special case for DATE_NOW
  if (value.some(v => v === TILL_NOW)) {
    const now: PickerDate = new Date()
    now.tillNow = true
    return now
  }

  if (precision.includes('week')) {
    return weekUtils.convertStringArrayToDate(value)
  } else if (precision.includes('quarter')) {
    return quarterUtils.convertStringArrayToDate(value)
  } else {
    const datePrecision = precision as DatePrecision
    const length = precisionLengthRecord[datePrecision]

    const providedOrder = normalizeDateColumnsOrder(columns)
    const presentOrder = providedOrder.slice(0, length)

    const keyToIndexMap = new Map(presentOrder.map((key, i) => [key, i]))

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    const currentDay = now.getDate()

    const mapped: (string | number | null | undefined)[] = []
    mapped[0] = keyToIndexMap.has(YEAR_COLUMN)
      ? value[keyToIndexMap.get(YEAR_COLUMN) as number]
      : currentYear
    mapped[1] = keyToIndexMap.has(MONTH_COLUMN)
      ? value[keyToIndexMap.get(MONTH_COLUMN) as number]
      : currentMonth
    mapped[2] = keyToIndexMap.has(DAY_COLUMN)
      ? value[keyToIndexMap.get(DAY_COLUMN) as number]
      : currentDay
    mapped[3] = keyToIndexMap.has(HOUR_COLUMN)
      ? value[keyToIndexMap.get(HOUR_COLUMN) as number]
      : '0'
    mapped[4] = keyToIndexMap.has(MINUTE_COLUMN)
      ? value[keyToIndexMap.get(MINUTE_COLUMN) as number]
      : '0'
    mapped[5] = keyToIndexMap.has(SECOND_COLUMN)
      ? value[keyToIndexMap.get(SECOND_COLUMN) as number]
      : '0'

    return dateUtils.convertStringArrayToDate(mapped as string[])
  }
}

export const generateDatePickerColumns = (
  selected: string[],
  min: Date,
  max: Date,
  precision: Precision,
  renderLabel: RenderLabel,
  filter: DatePickerFilter | undefined,
  tillNow?: boolean,
  columns?: DateColumnsOrder
) => {
  if (precision.startsWith('week')) {
    return weekUtils.generateDatePickerColumns(
      selected,
      min,
      max,
      precision as WeekPrecision,
      renderLabel,
      filter
    )
  } else if (precision.startsWith('quarter')) {
    return quarterUtils.generateDatePickerColumns(
      selected,
      min,
      max,
      precision as QuarterPrecision,
      renderLabel,
      filter
    )
  } else {
    return dateUtils.generateDatePickerColumns(
      selected,
      min,
      max,
      precision as DatePrecision,
      renderLabel,
      filter,
      tillNow,
      columns
    )
  }
}
