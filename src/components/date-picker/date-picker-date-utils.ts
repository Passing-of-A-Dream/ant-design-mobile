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
  const dateConfig = {
    year: { min: min.getFullYear(), max: max.getFullYear(), range: [0, 0] },
    month: { min: min.getMonth() + 1, max: max.getMonth() + 1, range: [1, 12] },
    day: { min: min.getDate(), max: max.getDate(), range: [1, 31] },
    hour: { min: min.getHours(), max: max.getHours(), range: [0, 23] },
    minute: { min: min.getMinutes(), max: max.getMinutes(), range: [0, 59] },
    second: { min: min.getSeconds(), max: max.getSeconds(), range: [0, 59] },
  }

  const rank = precisionRankRecord[precision]
  const order = normalizeDateColumnsOrder(columns)
  const presentOrder = order.filter(
    k => precisionRankRecord[k as DatePrecision] <= rank
  )
  const keyToIndexMap = new Map(presentOrder.map((key, i) => [key, i]))

  const getSelectedValue = (key: DateColumns, defaultValue: number): number => {
    const i = keyToIndexMap.get(key)
    if (i === undefined || i < 0) return defaultValue
    const v = selected?.[i]
    if (v === TILL_NOW || !v) return defaultValue
    return parseInt(v)
  }

  const now = new Date()
  const selectedValues = {
    year: getSelectedValue(
      YEAR_COLUMN,
      Math.min(
        Math.max(now.getFullYear(), dateConfig.year.min),
        dateConfig.year.max
      )
    ),
    month: getSelectedValue(MONTH_COLUMN, now.getMonth() + 1),
    day: getSelectedValue(DAY_COLUMN, now.getDate()),
    hour: getSelectedValue(HOUR_COLUMN, 0),
    minute: getSelectedValue(MINUTE_COLUMN, 0),
    second: getSelectedValue(SECOND_COLUMN, 0),
  }

  const isAtBoundary = (
    type: 'min' | 'max',
    ...units: DatePrecision[]
  ): boolean => {
    const config =
      type === 'min'
        ? (unit: DatePrecision) => dateConfig[unit].min
        : (unit: DatePrecision) => dateConfig[unit].max

    return units.every(unit => selectedValues[unit] === config(unit))
  }

  const createColumn = (
    unit: DatePrecision,
    dependencies: DatePrecision[] = []
  ): PickerColumn | undefined => {
    if (rank < precisionRankRecord[unit]) return undefined

    let lower = dateConfig[unit].range[0]
    let upper = dateConfig[unit].range[1]

    // 动态计算边界
    if (dependencies.length > 0) {
      if (isAtBoundary('min', ...dependencies)) {
        lower = dateConfig[unit].min
      }
      if (isAtBoundary('max', ...dependencies)) {
        upper = dateConfig[unit].max
      }
    } else {
      lower = dateConfig[unit].min
      upper = dateConfig[unit].max
    }

    if (unit === 'day' && !isAtBoundary('max', 'year', 'month')) {
      const firstDay = dayjs(
        convertStringArrayToDate([
          selectedValues.year.toString(),
          selectedValues.month.toString(),
          '1',
        ])
      )
      upper = firstDay.daysInMonth()
    }

    let values: number[] = []
    for (let i = lower; i <= upper; i++) {
      values.push(i)
    }

    const currentFilter = filter?.[unit]
    if (currentFilter && typeof currentFilter === 'function') {
      values = values.filter(i => {
        const stringArray = buildStringArrayFor(unit, i, selectedValues)
        return currentFilter(i, {
          get date() {
            return convertStringArrayToDate(stringArray)
          },
        })
      })
    }

    return values.map(v => ({
      label: renderLabel(unit, v, { selected: selectedValues[unit] === v }),
      value: v.toString(),
    }))
  }

  const buildStringArrayFor = (
    unit: DatePrecision,
    value: number,
    selected: typeof selectedValues
  ): string[] => {
    const units: DatePrecision[] = [
      'year',
      'month',
      'day',
      'hour',
      'minute',
      'second',
    ]
    const unitIndex = units.indexOf(unit)
    const result: string[] = []

    for (let i = 0; i <= unitIndex; i++) {
      if (i === unitIndex) {
        result.push(value.toString())
      } else {
        result.push(selected[units[i] as keyof typeof selected].toString())
      }
    }

    return result
  }

  const columnsMap: Partial<Record<DateColumns, PickerColumn>> = {
    [YEAR_COLUMN]: createColumn('year'),
    [MONTH_COLUMN]: createColumn('month', ['year']),
    [DAY_COLUMN]: createColumn('day', ['year', 'month']),
    [HOUR_COLUMN]: createColumn('hour', ['year', 'month', 'day']),
    [MINUTE_COLUMN]: createColumn('minute', ['year', 'month', 'day', 'hour']),
    [SECOND_COLUMN]: createColumn('second', [
      'year',
      'month',
      'day',
      'hour',
      'minute',
    ]),
  }

  const ret: PickerColumn[] = []
  const neededKeysInOrder = columns?.length
    ? order.filter(k => columns.includes(k as DateColumns))
    : order.filter(k => precisionRankRecord[k as DatePrecision] <= rank)

  for (const key of neededKeysInOrder) {
    const col = columnsMap[key]
    if (col) ret.push(col)
  }

  if (tillNow && ret.length > 0) {
    ret[0].push({
      label: renderLabel('now', null as never, {
        selected: selected[0] === TILL_NOW,
      }),
      value: TILL_NOW,
    })

    if (selected?.[0] === TILL_NOW) {
      for (let i = 1; i < ret.length; i++) {
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
