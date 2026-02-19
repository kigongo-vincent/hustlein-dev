import { useRef, useState, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import Text from '../base/Text'
import { baseFontSize } from '../base/Text'
import { Themestore } from '../../data/Themestore'

export interface CustomSelectOption {
  value: string
  label: string
}

export type InputMode = 'fill' | 'outline'

export interface CustomSelectProps {
  label?: string
  options: CustomSelectOption[]
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  error?: string
  placeholder?: string
  className?: string
  'aria-label'?: string
  mode?: InputMode
}

export default function CustomSelect({
  label,
  options,
  value,
  onChange,
  disabled,
  error,
  placeholder = 'Select…',
  className = '',
  'aria-label': ariaLabel,
  mode = 'outline',
}: CustomSelectProps) {
  const { current } = Themestore()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)
  const display = selected?.label ?? placeholder

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const dark = current?.system?.dark
  const darkPaled = dark === 'black' ? '#00000014' : dark && /^#[0-9A-Fa-f]{6}$/.test(dark) ? `${dark}14` : undefined
  return (
    <div
      ref={containerRef}
      className={`relative rounded-base ${className}`}
      style={{
        ['--focus-border' as string]: current?.brand?.secondary,
        ['--input-border' as string]: darkPaled,
      }}
    >
      {label && (
        <label className="block mb-1">
          <Text variant="sm" style={{ color: current?.system?.dark }}>
            {label}
          </Text>
        </label>
      )}
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={ariaLabel ?? label}
        className={`input-base input-other input-mode-${mode} w-full rounded-base px-3 py-2 flex items-center justify-between gap-2 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${open ? 'border-[var(--focus-border)]' : ''} ${error ? 'ring-1 ring-red-500' : ''}`}
        style={{
          fontSize: baseFontSize,
          lineHeight: 1.5,
          backgroundColor: mode === 'fill' ? (current?.system?.background ?? undefined) : 'transparent',
          color: selected ? (current?.system?.dark ?? undefined) : (current?.system?.dark ? `${current.system.dark}99` : undefined),
        }}
      >
        <span className="truncate">{display}</span>
        <ChevronDown
          size={18}
          strokeWidth={2}
          className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          style={{ color: current?.system?.dark ? `${current.system.dark}99` : undefined }}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 bottom-full mb-1 rounded-base border shadow-lg overflow-hidden max-h-[220px] overflow-y-auto"
          style={{
            zIndex: 9999,
            backgroundColor: current?.system?.foreground ?? '#fff',
            borderColor: current?.system?.border ?? 'rgba(0,0,0,0.1)',
          }}
        >
          {options.map((opt) => {
            const isSelected = value === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value)
                  setOpen(false)
                }}
                className="w-full text-left px-3 py-3 transition-colors hover:opacity-90"
                style={{
                  fontSize: baseFontSize,
                  backgroundColor: isSelected ? (current?.system?.background ?? undefined) : undefined,
                  color: current?.system?.dark,
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )}

      {error && (
        <Text variant="sm" className="mt-1" color={current?.system?.error}>
          {error}
        </Text>
      )}
    </div>
  )
}
