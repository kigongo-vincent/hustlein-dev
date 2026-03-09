import { useEffect, useMemo, useState } from 'react'
import Input from './Input'

export interface CurrencyInputProps {
  label: string
  value: string
  onChange: (rawNumeric: string) => void
  currency?: string
  placeholder?: string
  disabled?: boolean
  /** When true, uses Intl currency formatting (default true) */
  showCurrencySymbol?: boolean
  /** Maximum fraction digits (default 0) */
  maximumFractionDigits?: number
  ariaLabel?: string
}

function toRawNumeric(input: string): string {
  const cleaned = input.replace(/[^\d.]/g, '')
  // keep only first dot
  const firstDot = cleaned.indexOf('.')
  if (firstDot === -1) return cleaned
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, '')
}

function formatValue(raw: string, currency?: string, showCurrencySymbol = true, maximumFractionDigits = 0): string {
  const n = Number(raw)
  if (!raw || Number.isNaN(n)) return ''
  try {
    if (currency && showCurrencySymbol) {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency,
        maximumFractionDigits,
        minimumFractionDigits: 0,
      }).format(n)
    }
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits,
      minimumFractionDigits: 0,
    }).format(n)
  } catch {
    return raw
  }
}

export default function CurrencyInput({
  label,
  value,
  onChange,
  currency,
  placeholder,
  disabled,
  showCurrencySymbol = true,
  maximumFractionDigits = 0,
  ariaLabel,
}: CurrencyInputProps) {
  const formatted = useMemo(
    () => formatValue(value, currency, showCurrencySymbol, maximumFractionDigits),
    [value, currency, showCurrencySymbol, maximumFractionDigits]
  )
  const [display, setDisplay] = useState(formatted)
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (focused) return
    setDisplay(formatted)
  }, [formatted, focused])

  return (
    <Input
      label={label}
      value={focused ? display : formatted}
      onChange={(e) => {
        const raw = toRawNumeric(e.target.value)
        setDisplay(raw)
        onChange(raw)
      }}
      onFocus={() => {
        setFocused(true)
        setDisplay(value ?? '')
      }}
      onBlur={() => {
        setFocused(false)
        setDisplay(formatted)
      }}
      placeholder={placeholder}
      disabled={disabled}
      inputMode="decimal"
      aria-label={ariaLabel}
    />
  )
}

