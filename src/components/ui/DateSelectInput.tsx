import { useMemo, useEffect, useState } from 'react'
import Text from '../base/Text'
import CustomSelect from './CustomSelect'
import { Themestore } from '../../data/Themestore'

const MONTHS: { value: string; label: string }[] = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function parseValue(value: string): { day: number; month: number; year: number } {
  if (!value || !value.match(/^\d{4}-\d{2}-\d{2}$/)) {
    return { day: 1, month: 1, year: new Date().getFullYear() }
  }
  const [y, m, d] = value.split('-').map(Number)
  const maxDay = daysInMonth(y, m)
  return {
    day: Math.min(Math.max(1, d), maxDay),
    month: m,
    year: y,
  }
}

function toValue(day: number, month: number, year: number): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${year}-${pad(month)}-${pad(day)}`
}

export type InputMode = 'fill' | 'outline'

export interface DateSelectInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  /** Start year for year dropdown (default: current year - 100) */
  yearMin?: number
  /** End year for year dropdown (default: current year) */
  yearMax?: number
  /** Order of selects: 'dmy' | 'mdy' | 'ymd' */
  order?: 'dmy' | 'mdy' | 'ymd'
  disabled?: boolean
  error?: string
  mode?: InputMode
}

export default function DateSelectInput({
  label = 'Date',
  value,
  onChange,
  yearMin = new Date().getFullYear() - 100,
  yearMax = new Date().getFullYear(),
  order = 'dmy',
  disabled,
  error,
  mode = 'outline',
}: DateSelectInputProps) {
  const { current } = Themestore()
  const parsed = useMemo(() => parseValue(value), [value])
  const [day, setDay] = useState(parsed.day)
  const [month, setMonth] = useState(parsed.month)
  const [year, setYear] = useState(parsed.year)

  useEffect(() => {
    const p = parseValue(value)
    setDay(p.day)
    setMonth(p.month)
    setYear(p.year)
  }, [value])

  const maxDay = useMemo(() => daysInMonth(year, month), [year, month])
  const dayOptions = useMemo(() => {
    return Array.from({ length: maxDay }, (_, i) => {
      const d = i + 1
      return { value: String(d), label: String(d) }
    })
  }, [maxDay])

  const yearOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = []
    for (let y = yearMax; y >= yearMin; y--) {
      opts.push({ value: String(y), label: String(y) })
    }
    return opts
  }, [yearMin, yearMax])

  const handleDay = (v: string) => {
    const d = parseInt(v, 10)
    setDay(d)
    onChange(toValue(d, month, year))
  }

  const handleMonth = (v: string) => {
    const m = parseInt(v, 10)
    const maxD = daysInMonth(year, m)
    const newDay = Math.min(day, maxD)
    setMonth(m)
    setDay(newDay)
    onChange(toValue(newDay, m, year))
  }

  const handleYear = (v: string) => {
    const y = parseInt(v, 10)
    const maxD = daysInMonth(y, month)
    const newDay = Math.min(day, maxD)
    setYear(y)
    setDay(newDay)
    onChange(toValue(newDay, month, y))
  }

  const daySelect = (
    <CustomSelect
      options={dayOptions}
      value={String(day)}
      onChange={handleDay}
      disabled={disabled}
      mode={mode}
      className="min-w-0"
      aria-label="Day"
    />
  )

  const monthSelect = (
    <CustomSelect
      options={MONTHS}
      value={String(month)}
      onChange={handleMonth}
      disabled={disabled}
      mode={mode}
      className="min-w-0"
      aria-label="Month"
    />
  )

  const yearSelect = (
    <CustomSelect
      options={yearOptions}
      value={String(year)}
      onChange={handleYear}
      disabled={disabled}
      mode={mode}
      className="min-w-0"
      aria-label="Year"
    />
  )

  const selectsByOrder =
    order === 'mdy'
      ? [monthSelect, daySelect, yearSelect]
      : order === 'ymd'
        ? [yearSelect, monthSelect, daySelect]
        : [daySelect, monthSelect, yearSelect]

  return (
    <div className="rounded-base">
      {label && (
        <label className="block mb-1">
          <Text variant="sm" style={{ color: current?.system?.dark }}>
            {label}
          </Text>
        </label>
      )}
      <div className="grid grid-cols-3 gap-2">
        {selectsByOrder.map((sel, i) => (
          <div key={i} className="min-w-0">
            {sel}
          </div>
        ))}
      </div>
      {error && (
        <Text variant="sm" className="mt-1" color={current?.system?.error}>
          {error}
        </Text>
      )}
    </div>
  )
}
