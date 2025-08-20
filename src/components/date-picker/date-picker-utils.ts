import { RenderLabel } from '../date-picker-view/date-picker-view'
import type { DatePrecision } from './date-picker-date-utils'
import * as dateUtils from './date-picker-date-utils'
import type { QuarterPrecision } from './date-picker-quarter-utils'
import * as quarterUtils from './date-picker-quarter-utils'
import type { WeekPrecision } from './date-picker-week-utils'
import * as weekUtils from './date-picker-week-utils'
import type { PickerDate } from './util'
import { DAY_COLUMN, MONTH_COLUMN, TILL_NOW, YEAR_COLUMN } from './util'

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

export type DateColumnsOrder = ('year' | 'month' | 'day')[]

export function normalizeDateColumnsOrder(
  columns: DateColumnsOrder | undefined
): DateColumnsOrder {
  if (!columns || columns.length === 0) {
    return [YEAR_COLUMN, MONTH_COLUMN, DAY_COLUMN]
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

    const year = base[0]
    const month = base[1]
    const day = base[2]
    const order = normalizeDateColumnsOrder(columns)
    const map: Record<'year' | 'month' | 'day', string> = {
      year,
      month,
      day,
    }
    const ymdReordered = order.map(k => map[k])

    if (length <= 3) {
      return ymdReordered.slice(0, length)
    } else {
      const rest = base.slice(3, length)
      return [...ymdReordered, ...rest]
    }
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
  if (value?.[0] === TILL_NOW) {
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
    const includedCount = Math.min(precisionLengthRecord[datePrecision], 3)
    const includedSet = (
      ['year', 'month', 'day'] as Array<'year' | 'month' | 'day'>
    ).slice(0, includedCount)
    const presentOrder = normalizeDateColumnsOrder(columns).filter(k =>
      includedSet.includes(k)
    )
    const mapped: (string | number | null | undefined)[] = []
    const keyToIndexMap = new Map(presentOrder.map((key, i) => [key, i]))

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1 // getMonth() 返回 0-11
    const currentDay = now.getDate()

    const yIdx = keyToIndexMap.get('year') ?? -1
    const mIdx = keyToIndexMap.get('month') ?? -1
    const dIdx = keyToIndexMap.get('day') ?? -1

    mapped[0] = yIdx !== -1 ? value[yIdx] : currentYear
    mapped[1] = mIdx !== -1 ? value[mIdx] : currentMonth
    mapped[2] = dIdx !== -1 ? value[dIdx] : currentDay
    for (let i = presentOrder.length; i < value.length; i += 1) {
      mapped[3 + (i - presentOrder.length)] = value[i]
    }
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
