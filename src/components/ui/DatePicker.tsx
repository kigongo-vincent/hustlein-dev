import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar } from 'lucide-react'
import Text from '../base/Text'
import { baseFontSize } from '../base/Text'
import { Themestore } from '../../data/Themestore'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Format YYYY-MM-DD to dd/mm/yyyy for display */
function formatDisplay(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return iso
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d)}/${pad(m)}/${y}`
}

export type InputMode = 'fill' | 'outline'

export interface DatePickerProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: string
  mode?: InputMode
}

export default function DatePicker({
  label = 'Date',
  value,
  onChange,
  placeholder = 'dd/mm/yyyy',
  disabled,
  error,
  mode = 'outline',
}: DatePickerProps) {
  const { current } = Themestore()
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number)
      return new Date(y, (m ?? 1) - 1, 1)
    }
    return new Date()
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [dropdownRect, setDropdownRect] = useState<{ top: number; left: number; width: number } | null>(null)

  const displayValue = value ? formatDisplay(value) : ''
  const hasValue = displayValue.length > 0
  const floated = open || hasValue

  useEffect(() => {
    if (value) {
      const [y, m] = value.split('-').map(Number)
      setViewDate(new Date(y, (m ?? 1) - 1, 1))
    }
  }, [value])

  useLayoutEffect(() => {
    const el = triggerRef.current ?? containerRef.current
    if (!open || !el) return
    const rect = el.getBoundingClientRect()
    const gap = 4
    const dropdownHeight = 320
    const spaceBelow = window.innerHeight - rect.bottom
    const openBelow = spaceBelow >= Math.min(dropdownHeight, rect.top)
    const top = openBelow ? rect.bottom + gap : rect.top - dropdownHeight - gap
    setDropdownRect({ top, left: rect.left, width: Math.max(rect.width, 280) })
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current?.contains(target) || dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) days.push(null)
  for (let d = 1; d <= daysInMonth; d++) days.push(d)

  const handleSelect = (day: number) => {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    onChange(`${year}-${m}-${d}`)
    setOpen(false)
  }

  const prevMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const monthName = viewDate.toLocaleString('default', { month: 'long' })
  const dark = current?.system?.dark
  const darkPaled = dark === 'black' ? '#00000014' : dark && /^#[0-9A-Fa-f]{6}$/.test(dark) ? `${dark}14` : undefined

  return (
    <div
      ref={containerRef}
      className="rounded-base"
      style={{
        ['--focus-border' as string]: current?.brand?.secondary,
        ['--input-border' as string]: darkPaled,
      }}
    >
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => !disabled && setOpen((o) => !o)}
          disabled={disabled}
          className={`input-base input-other input-floating input-mode-${mode} w-full rounded-base pt-3 pb-2 pl-3 pr-10 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${open ? 'border-[var(--focus-border)]' : ''} ${error ? '!border-red-500' : ''}`}
          style={{
            fontSize: baseFontSize,
            lineHeight: 1.5,
            backgroundColor: mode === 'fill' ? (current?.system?.background ?? undefined) : 'transparent',
            color: current?.system?.dark,
          }}
        >
          {displayValue || (open ? '' : placeholder)}
        </button>
        <span
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center p-1.5 rounded-base pointer-events-none"
          style={{ color: current?.system?.dark ? `${current.system.dark}99` : undefined }}
        >
          <Calendar size={18} strokeWidth={1.8} />
        </span>
        {label && (
          <label
            className={`pointer-events-none absolute left-3 transition-all duration-200 ease-out origin-left ${floated ? 'top-0 -translate-y-1/2 text-xs' : 'top-1/2 -translate-y-1/2'}`}
            style={{
              fontSize: floated ? 11 : baseFontSize,
              lineHeight: 1.5,
              color: floated ? (current?.system?.dark ?? 'inherit') : (current?.system?.dark ? `${current.system.dark}99` : 'inherit'),
              backgroundColor: floated ? (mode === 'fill' ? (current?.system?.background ?? 'transparent') : (current?.system?.foreground ?? 'transparent')) : 'transparent',
              paddingLeft: floated ? 2 : 0,
              paddingRight: floated ? 2 : 0,
            }}
          >
            {label}
          </label>
        )}
      </div>

      {open &&
        dropdownRect &&
        createPortal(
          <div
            ref={dropdownRef}
            className="rounded-base shadow-lg border overflow-hidden"
            style={{
              position: 'fixed',
              top: dropdownRect.top,
              left: dropdownRect.left,
              width: dropdownRect.width,
              zIndex: 99999,
              backgroundColor: current?.system?.foreground ?? '#fff',
              borderColor: current?.system?.border ?? 'rgba(0,0,0,0.1)',
            }}
          >
            <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: current?.system?.border }}>
              <button
                type="button"
                onClick={prevMonth}
                className="p-1.5 rounded-base hover:opacity-80"
                style={{ color: current?.system?.dark }}
                aria-label="Previous month"
              >
                ‹
              </button>
              <Text className="font-medium" style={{ fontSize: baseFontSize * 1.1 }}>
                {monthName} {year}
              </Text>
              <button
                type="button"
                onClick={nextMonth}
                className="p-1.5 rounded-base hover:opacity-80"
                style={{ color: current?.system?.dark }}
                aria-label="Next month"
              >
                ›
              </button>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-7 gap-0.5 mb-1">
                {DAYS.map((d) => (
                  <div
                    key={d}
                    className="text-center py-1 text-[11px] opacity-70"
                    style={{ color: current?.system?.dark }}
                  >
                    {d.slice(0, 2)}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {days.map((day, i) => {
                  if (day === null) {
                    return <div key={`empty-${i}`} />;
                  }
                  const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isSelected = value === iso;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleSelect(day)}
                      className="rounded-base py-1.5 text-[13px] hover:opacity-90"
                      style={{
                        color: isSelected ? '#fff' : current?.system?.dark,
                        backgroundColor: isSelected ? (current?.brand?.primary ?? '#682308') : 'transparent',
                      }}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}

      {error && (
        <Text variant="sm" className="mt-1" color={current?.system?.error}>
          {error}
        </Text>
      )}
    </div>
  )
}
