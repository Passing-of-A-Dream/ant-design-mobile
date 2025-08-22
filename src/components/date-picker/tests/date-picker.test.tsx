import dayjs from 'dayjs'
import * as React from 'react'
import {
  act,
  fireEvent,
  render,
  screen,
  sleep,
  testA11y,
  waitFor,
  waitForElementToBeRemoved,
} from 'testing'
import DatePicker from '../'
import Button from '../../button'
import { convertStringArrayToDate } from '../date-picker-week-utils'

const classPrefix = `adm-picker`

const now = new Date()
const {
  YEAR_COLUMN,
  MONTH_COLUMN,
  DAY_COLUMN,
  HOUR_COLUMN,
  MINUTE_COLUMN,
  SECOND_COLUMN,
} = DatePicker

describe('DatePicker', () => {
  test('passes a11y test', async () => {
    await waitFor(() => testA11y(<DatePicker />))
  })

  test('renders basic', async () => {
    const fn = jest.fn()
    const { getByText } = render(
      <DatePicker
        visible
        defaultValue={new Date(1603248738000)}
        onConfirm={val => {
          fn(val.toDateString())
        }}
      />
    )
    await waitFor(() => {
      fireEvent.click(getByText('确定'))
    })
    expect(fn).toBeCalled()
    expect(fn.mock.calls[0][0]).toContain('Wed Oct 21 2020')
  })

  test('defaultValue out of bound', async () => {
    const tomorrow = dayjs(now).add(1, 'day').toDate()
    const fn = jest.fn()

    const { getByText } = render(
      <DatePicker
        visible
        defaultValue={now}
        min={tomorrow}
        onConfirm={val => {
          fn(val.toDateString())
        }}
      />
    )

    await waitFor(() => {
      fireEvent.click(getByText('确定'))
    })

    expect(fn.mock.calls[0][0]).toBe(tomorrow.toDateString())
  })

  test('should pick today without defaultValue', async () => {
    const fn = jest.fn()

    const { getByText } = render(
      <DatePicker
        visible
        onConfirm={val => {
          fn(val.toDateString())
        }}
      />
    )

    await waitFor(() => {
      fireEvent.click(getByText('确定'))
    })

    expect(fn.mock.calls[0][0]).toBe(now.toDateString())
  })

  test('precision minute', async () => {
    const fn = jest.fn()
    const { getByText } = render(
      <DatePicker
        visible
        precision='minute'
        value={now}
        onConfirm={val => {
          fn(val)
        }}
      />
    )

    expect(
      document.body.querySelectorAll(`.${classPrefix}-view-column`).length
    ).toBe(5)

    await waitFor(() => {
      fireEvent.click(getByText('确定'))
    })

    const confirmedDay = dayjs(fn.mock.calls[0][0])
    const formatTemplate = 'YYYY-MM-DD HH:mm'
    expect(confirmedDay.format(formatTemplate)).toBe(
      dayjs(now).format(formatTemplate)
    )
  })

  test('precision week', async () => {
    const today = new Date()
    const fn = jest.fn()
    const { getByText } = render(
      <DatePicker
        visible
        precision='week-day'
        value={now}
        onConfirm={val => {
          fn(val.toDateString())
        }}
      />
    )

    expect(
      document.body.querySelectorAll(`.${classPrefix}-view-column`).length
    ).toBe(3)
    await waitFor(() => {
      fireEvent.click(getByText('确定'))
    })
    expect(fn.mock.calls[0][0]).toEqual(today.toDateString())
  })

  test('precision quarter', async () => {
    const today = new Date()
    const fn = jest.fn()
    const { getByText } = render(
      <DatePicker
        visible
        precision='quarter'
        value={now}
        onConfirm={val => {
          fn(val.toDateString())
        }}
      />
    )

    expect(
      document.body.querySelectorAll(`.${classPrefix}-view-column`).length
    ).toBe(2)
    await waitFor(() => {
      fireEvent.click(getByText('确定'))
    })
    expect(fn.mock.calls[0][0]).toEqual(today.toDateString())
  })

  test('test imperative call', async () => {
    const today = new Date()
    const fn = jest.fn()
    const onConfirm = jest.fn()
    const onClick = async () => {
      const value = await DatePicker.prompt({
        defaultValue: now,
        onConfirm,
      })
      fn(value ? value.toDateString() : null)
    }

    render(<Button onClick={onClick}>DatePicker</Button>)
    const button = screen.getByText('DatePicker')
    fireEvent.click(button)
    const cancel = await screen.findByText('取消')
    const popup = document.querySelectorAll('.adm-popup')[0]
    await act(() => sleep(0))
    fireEvent.click(cancel)
    await waitForElementToBeRemoved(popup)
    expect(fn.mock.calls[0][0]).toBeNull()

    fireEvent.click(button)
    const confirm = await screen.findByText('确定')
    const popup2 = document.querySelectorAll('.adm-popup')[0]
    await act(() => sleep(0))
    fireEvent.click(confirm)
    await waitForElementToBeRemoved(popup2)
    expect(fn.mock.calls[1][0]).toEqual(today.toDateString())
    expect(onConfirm).toBeCalled()
  })

  test('till now should be work', async () => {
    const fn = jest.fn()
    render(<DatePicker visible tillNow onConfirm={fn} />)

    const nowEl = await screen.findByText('至今')
    fireEvent.click(nowEl)
    await act(async () => {
      await Promise.resolve()
    })
    await act(async () => {
      await Promise.resolve()
    })

    fireEvent.click(screen.getByText('确定'))
    const res = fn.mock.calls[0][0]
    expect(res.toDateString()).toEqual(now.toDateString())
    expect(res.tillNow).toBeTruthy()
  })

  describe('convertStringArrayToDate of week should correct', () => {
    it('2024-1-1 -> 2024-01-01', () => {
      // jest mock today is `2024-12-30`
      jest.useFakeTimers({
        now: new Date('2024-12-30'),
      })

      const date = convertStringArrayToDate(['2024', '1', '1'])
      expect(date.getFullYear()).toBe(2024)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(1)
    })

    it('2023-1-1 -> 2023-01-02', () => {
      const date = convertStringArrayToDate(['2023', '1', '1'])
      expect(date.getFullYear()).toBe(2023)
      expect(date.getMonth()).toBe(0)
      expect(date.getDate()).toBe(2)
    })

    it('2020-1-1 -> 2019-12-30', () => {
      const date = convertStringArrayToDate(['2020', '1', '1'])
      expect(date.getFullYear()).toBe(2019)
      expect(date.getMonth()).toBe(11)
      expect(date.getDate()).toBe(30)
    })

    it('2023-27-1 -> 2023-07-03', () => {
      const date = convertStringArrayToDate(['2023', '27', '1'])
      expect(date.getFullYear()).toBe(2023)
      expect(date.getMonth()).toBe(6)
      expect(date.getDate()).toBe(3)
    })
  })

  test('renderLabel should be work', async () => {
    const labelRenderer = (
      type: string,
      data: number,
      info: { selected: boolean }
    ) => {
      if (info.selected) {
        return `${type}-selected`
      }
      return data.toString()
    }

    render(<DatePicker visible renderLabel={labelRenderer} />)

    const yearEl = await screen.findByText('year-selected')
    expect(yearEl).toBeInTheDocument()
    const monthEl = await screen.findByText('month-selected')
    expect(monthEl).toBeInTheDocument()
    const dayEl = await screen.findByText('day-selected')
    expect(dayEl).toBeInTheDocument()
  })

  describe('DatePicker fields prop', () => {
    const getColumnValues = (
      baseElement: HTMLElement,
      columnIndex: number
    ): (string | null)[] => {
      const columns = baseElement.querySelectorAll<HTMLElement>(
        '.adm-picker-view-column'
      )
      return Array.from(
        columns[columnIndex].querySelectorAll<HTMLElement>(
          '.adm-picker-view-column-item'
        )
      ).map(el => el.textContent)
    }

    it('should render fields in correct order when using array format', async () => {
      const defaultDate = new Date('2025-8-20')
      const onConfirm = jest.fn()
      const { baseElement } = render(
        <DatePicker
          visible={true}
          value={defaultDate}
          columns={['month', 'day', 'year']}
          onConfirm={onConfirm}
        />
      )

      await waitFor(() => {
        expect(getColumnValues(baseElement, 0)).toContain('8')
        expect(getColumnValues(baseElement, 1)).toContain('20')
        expect(
          getColumnValues(baseElement, 2).some(v => v?.includes('2025'))
        ).toBeTruthy()
      })

      fireEvent.click(screen.getByText('确定'))

      await waitFor(() => {
        expect(onConfirm.mock.calls[0][0].toDateString()).toEqual(
          defaultDate.toDateString()
        )
      })
    })

    it('should display columns in completely reversed order with precision="second"', async () => {
      const defaultDate = new Date('2024-03-15 14:30:45')
      const { baseElement } = render(
        <DatePicker
          visible={true}
          value={defaultDate}
          precision='second'
          columns={[
            SECOND_COLUMN,
            MINUTE_COLUMN,
            HOUR_COLUMN,
            DAY_COLUMN,
            MONTH_COLUMN,
            YEAR_COLUMN,
          ]}
        />
      )

      await waitFor(() => {
        expect(getColumnValues(baseElement, 0)).toContain('45')
        expect(getColumnValues(baseElement, 1)).toContain('30')
        expect(getColumnValues(baseElement, 2)).toContain('14')
        expect(getColumnValues(baseElement, 3)).toContain('15')
        expect(getColumnValues(baseElement, 4)).toContain('3')
        expect(
          getColumnValues(baseElement, 5).some(v => v?.includes('2024'))
        ).toBeTruthy()
      })
    })

    it('should display columns in reversed order with precision="day"', async () => {
      const defaultDate = new Date('2024-03-15 14:30:45')
      const { baseElement } = render(
        <DatePicker
          visible={true}
          value={defaultDate}
          precision='day'
          columns={[DAY_COLUMN, MONTH_COLUMN, YEAR_COLUMN]}
        />
      )

      await waitFor(() => {
        expect(getColumnValues(baseElement, 0)).toContain('15')
        expect(getColumnValues(baseElement, 1)).toContain('3')
        expect(
          getColumnValues(baseElement, 2).some(v => v?.includes('2024'))
        ).toBeTruthy()
      })
    })
  })
})
