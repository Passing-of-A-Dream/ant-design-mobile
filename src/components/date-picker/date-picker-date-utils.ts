import dayjs from 'dayjs'
import isLeapYear from 'dayjs/plugin/isLeapYear'
import isoWeek from 'dayjs/plugin/isoWeek'
import isoWeeksInYear from 'dayjs/plugin/isoWeeksInYear'
import { RenderLabel } from '../date-picker-view/date-picker-view'
import { PickerColumn } from '../picker'
import type { DateFieldsOrder, DatePickerFilter } from './date-picker-utils'
import { TILL_NOW } from './util'

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

const parseFieldsOrder = (
  fields?: Array<'year' | 'month' | 'day'> | string
): ('year' | 'month' | 'day')[] => {
  const DEFAULT_ORDER: ('year' | 'month' | 'day')[] = ['year', 'month', 'day']

  if (!fields) return DEFAULT_ORDER
  if (Array.isArray(fields)) return fields

  const STRING_FORMAT_MAP: Record<string, ('year' | 'month' | 'day')[]> = {
    'MDY': ['month', 'day', 'year'],
    'DMY': ['day', 'month', 'year'],
    'YMD': ['year', 'month', 'day'],
  }

  return STRING_FORMAT_MAP[fields] || DEFAULT_ORDER
}

export function generateDatePickerColumns(
  selected: string[],
  min: Date,
  max: Date,
  precision: DatePrecision,
  renderLabel: RenderLabel,
  filter: DatePickerFilter | undefined,
  tillNow?: boolean,
  fields?: DateFieldsOrder
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

  const order: ('year' | 'month' | 'day')[] = parseFieldsOrder(fields)
  const idx = {
    year: order.indexOf('year'),
    month: order.indexOf('month'),
    day: order.indexOf('day'),
  }
  const yStr =
    (idx.year > -1 ? selected[idx.year] : undefined) ??
    min.getFullYear().toString()
  const mStr = (idx.month > -1 ? selected[idx.month] : undefined) ?? '1'
  const dStr = (idx.day > -1 ? selected[idx.day] : undefined) ?? '1'

  const selectedYear = parseInt(yStr)
  const firstDayInSelectedMonth = dayjs(
    convertStringArrayToDate([yStr, mStr, '1'])
  )
  const selectedMonth = parseInt(mStr)
  const selectedDay = parseInt(dStr)
  const selectedHour = parseInt(selected[3])
  const selectedMinute = parseInt(selected[4])
  const selectedSecond = parseInt(selected[5])

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
          return [yStr, mStr, dStr, selected[3] ?? '0', v]
        case 'second':
          return [yStr, mStr, dStr, selected[3] ?? '0', selected[4] ?? '0', v]
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

  const fieldsOrder: ('year' | 'month' | 'day')[] = parseFieldsOrder(fields)
  const available: Array<{
    key: 'year' | 'month' | 'day'
    col: PickerColumn | null
  }> = [
    { key: 'year', col: yearCol },
    { key: 'month', col: monthCol },
    { key: 'day', col: dayCol },
  ]
  for (const key of fieldsOrder) {
    const found = available.find(a => a.key === key)
    if (found?.col) ret.push(found.col)
  }
  if (rank >= precisionRankRecord.hour) {
    const lower = isInMinDay ? minHour : 0
    const upper = isInMaxDay ? maxHour : 23
    const hours = generateColumn(lower, upper, 'hour')
    ret.push(
      hours.map(v => ({
        label: renderLabel('hour', v, { selected: selectedHour === v }),
        value: v.toString(),
      }))
    )
  }
  if (rank >= precisionRankRecord.minute) {
    const lower = isInMinHour ? minMinute : 0
    const upper = isInMaxHour ? maxMinute : 59
    const minutes = generateColumn(lower, upper, 'minute')
    ret.push(
      minutes.map(v => ({
        label: renderLabel('minute', v, { selected: selectedMinute === v }),
        value: v.toString(),
      }))
    )
  }
  if (rank >= precisionRankRecord.second) {
    const lower = isInMinMinute ? minSecond : 0
    const upper = isInMaxMinute ? maxSecond : 59
    const seconds = generateColumn(lower, upper, 'second')
    ret.push(
      seconds.map(v => ({
        label: renderLabel('second', v, { selected: selectedSecond === v }),
        value: v.toString(),
      }))
    )
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
