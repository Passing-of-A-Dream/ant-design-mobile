import dayjs from 'dayjs'
import isLeapYear from 'dayjs/plugin/isLeapYear'
import isoWeek from 'dayjs/plugin/isoWeek'
import isoWeeksInYear from 'dayjs/plugin/isoWeeksInYear'
import { RenderLabel } from '../date-picker-view/date-picker-view'
import { PickerColumn } from '../picker'
import { type DatePickerFilter } from './date-picker-utils'
import {
  DateColumnsOrder,
  DAY_COLUMN,
  HOUR_COLUMN,
  MINUTE_COLUMN,
  MONTH_COLUMN,
  normalizeDateColumnsOrder,
  SECOND_COLUMN,
  TILL_NOW,
  YEAR_COLUMN,
  type DateColumns,
} from './util'

dayjs.extend(isoWeek)
dayjs.extend(isoWeeksInYear)
dayjs.extend(isLeapYear)

export type DatePrecision =
  | 'year'
  | 'month'
  | 'day'
  | 'hour'
  | 'minute'
  | 'second'

const precisionRankRecord: Record<DatePrecision, number> = {
  year: 0,
  month: 1,
  day: 2,
  hour: 3,
  minute: 4,
  second: 5,
}

export function generateDatePickerColumns(
  selected: string[],
  min: Date,
  max: Date,
  precision: DatePrecision,
  renderLabel: RenderLabel,
  filter: DatePickerFilter | undefined,
  tillNow?: boolean,
  columns?: DateColumnsOrder
) {
  const ret: PickerColumn[] = []

  const minYear = min.getFullYear()
  const minMonth = min.getMonth() + 1
  const minDay = min.getDate()
  const minHour = min.getHours()
  const minMinute = min.getMinutes()
  const minSecond = min.getSeconds()

  const maxYear = max.getFullYear()
  const maxMonth = max.getMonth() + 1
  const maxDay = max.getDate()
  const maxHour = max.getHours()
  const maxMinute = max.getMinutes()
  const maxSecond = max.getSeconds()

  const rank = precisionRankRecord[precision]

  const order: DateColumnsOrder = normalizeDateColumnsOrder(columns)
  const presentOrder = order.filter(
    k => precisionRankRecord[k as DatePrecision] <= rank
  )
  const keyToIndexMap = new Map(presentOrder.map((key, i) => [key, i]))
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1
  const currentDay = now.getDate()
  const safeGet = (key: DateColumns): string | undefined => {
    const i = keyToIndexMap.get(key)
    if (i === undefined || i < 0) return undefined
    const v = selected?.[i]
    if (v === TILL_NOW || v === undefined || v === null) return undefined
    return v
  }

  const yStr =
    safeGet(YEAR_COLUMN) ??
    Math.min(Math.max(currentYear, minYear), maxYear).toString()
  const mStr = safeGet(MONTH_COLUMN) ?? currentMonth.toString()
  const dStr = safeGet(DAY_COLUMN) ?? currentDay.toString()
  const hourStr = safeGet(HOUR_COLUMN) ?? '0'
  const minuteStr = safeGet(MINUTE_COLUMN) ?? '0'
  const secondStr = safeGet(SECOND_COLUMN) ?? '0'

  const selectedYear = parseInt(yStr)
  const firstDayInSelectedMonth = dayjs(
    convertStringArrayToDate([yStr, mStr, '1'])
  )
  const selectedMonth = parseInt(mStr)
  const selectedDay = parseInt(dStr)

  const selectedHour = parseInt(hourStr)
  const selectedMinute = parseInt(minuteStr)
  const selectedSecond = parseInt(secondStr)

  const isInMinYear = selectedYear === minYear
  const isInMaxYear = selectedYear === maxYear
  const isInMinMonth = isInMinYear && selectedMonth === minMonth
  const isInMaxMonth = isInMaxYear && selectedMonth === maxMonth
  const isInMinDay = isInMinMonth && selectedDay === minDay
  const isInMaxDay = isInMaxMonth && selectedDay === maxDay
  const isInMinHour = isInMinDay && selectedHour === minHour
  const isInMaxHour = isInMaxDay && selectedHour === maxHour
  const isInMinMinute = isInMinHour && selectedMinute === minMinute
  const isInMaxMinute = isInMaxHour && selectedMinute === maxMinute

  const generateColumn = (
    from: number,
    to: number,
    precision: DatePrecision
  ) => {
    let column: number[] = []
    for (let i = from; i <= to; i++) {
      column.push(i)
    }
    const buildStringArrayFor = (p: DatePrecision, val: number): string[] => {
      const v = val.toString()
      switch (p) {
        case 'year':
          return [v]
        case 'month':
          return [yStr, v]
        case 'day':
          return [yStr, mStr, v]
        case 'hour':
          return [yStr, mStr, dStr, v]
        case 'minute':
          return [yStr, mStr, dStr, hourStr, v]
        case 'second':
          return [yStr, mStr, dStr, hourStr, minuteStr, v]
      }
    }
    const currentFilter = filter?.[precision]
    if (currentFilter && typeof currentFilter === 'function') {
      column = column.filter(i =>
        currentFilter(i, {
          get date() {
            const stringArray = buildStringArrayFor(precision, i)
            return convertStringArrayToDate(stringArray)
          },
        })
      )
    }
    return column
  }

  let yearCol: PickerColumn | null = null
  if (rank >= precisionRankRecord.year) {
    const lower = minYear
    const upper = maxYear
    const years = generateColumn(lower, upper, 'year')
    yearCol = years.map(v => ({
      label: renderLabel('year', v, { selected: selectedYear === v }),
      value: v.toString(),
    }))
  }

  let monthCol: PickerColumn | null = null
  if (rank >= precisionRankRecord.month) {
    const lower = isInMinYear ? minMonth : 1
    const upper = isInMaxYear ? maxMonth : 12
    const months = generateColumn(lower, upper, 'month')
    monthCol = months.map(v => ({
      label: renderLabel('month', v, { selected: selectedMonth === v }),
      value: v.toString(),
    }))
  }
  let dayCol: PickerColumn | null = null
  if (rank >= precisionRankRecord.day) {
    const lower = isInMinMonth ? minDay : 1
    const upper = isInMaxMonth ? maxDay : firstDayInSelectedMonth.daysInMonth()
    const days = generateColumn(lower, upper, 'day')
    dayCol = days.map(v => ({
      label: renderLabel('day', v, { selected: selectedDay === v }),
      value: v.toString(),
    }))
  }

  const columnsMap: Partial<Record<DateColumns, PickerColumn>> = {}
  if (yearCol) columnsMap[YEAR_COLUMN] = yearCol
  if (monthCol) columnsMap[MONTH_COLUMN] = monthCol
  if (dayCol) columnsMap[DAY_COLUMN] = dayCol

  if (rank >= precisionRankRecord.hour) {
    const lower = isInMinDay ? minHour : 0
    const upper = isInMaxDay ? maxHour : 23
    const hours = generateColumn(lower, upper, 'hour')
    columnsMap[HOUR_COLUMN] = hours.map(v => ({
      label: renderLabel('hour', v, { selected: selectedHour === v }),
      value: v.toString(),
    }))
  }
  if (rank >= precisionRankRecord.minute) {
    const lower = isInMinHour ? minMinute : 0
    const upper = isInMaxHour ? maxMinute : 59
    const minutes = generateColumn(lower, upper, 'minute')
    columnsMap[MINUTE_COLUMN] = minutes.map(v => ({
      label: renderLabel('minute', v, { selected: selectedMinute === v }),
      value: v.toString(),
    }))
  }
  if (rank >= precisionRankRecord.second) {
    const lower = isInMinMinute ? minSecond : 0
    const upper = isInMaxMinute ? maxSecond : 59
    const seconds = generateColumn(lower, upper, 'second')
    columnsMap[SECOND_COLUMN] = seconds.map(v => ({
      label: renderLabel('second', v, { selected: selectedSecond === v }),
      value: v.toString(),
    }))
  }

  const columnsOrder = normalizeDateColumnsOrder(columns)
  const neededKeysInOrder = columnsOrder.filter(
    k => precisionRankRecord[k as DatePrecision] <= rank
  )

  for (const key of neededKeysInOrder) {
    const col = columnsMap[key]
    if (col) ret.push(col)
  }

  // Till Now
  if (tillNow) {
    ret[0].push({
      label: renderLabel('now', null!, { selected: selected[0] === TILL_NOW }),
      value: TILL_NOW,
    })

    if (TILL_NOW === selected?.[0]) {
      for (let i = 1; i < ret.length; i += 1) {
        ret[i] = []
      }
    }
  }

  return ret
}

export function convertDateToStringArray(
  date: Date | undefined | null
): string[] {
  if (!date) return []
  return [
    date.getFullYear().toString(),
    (date.getMonth() + 1).toString(),
    date.getDate().toString(),
    date.getHours().toString(),
    date.getMinutes().toString(),
    date.getSeconds().toString(),
  ]
}

export function convertStringArrayToDate<
  T extends string | number | null | undefined,
>(value: T[]): Date {
  const yearString = value[0] ?? '1900'
  const monthString = value[1] ?? '1'
  const dateString = value[2] ?? '1'
  const hourString = value[3] ?? '0'
  const minuteString = value[4] ?? '0'
  const secondString = value[5] ?? '0'
  return new Date(
    parseInt(yearString as string),
    parseInt(monthString as string) - 1,
    parseInt(dateString as string),
    parseInt(hourString as string),
    parseInt(minuteString as string),
    parseInt(secondString as string)
  )
}
