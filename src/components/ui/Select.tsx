import { SelectHTMLAttributes } from 'react'
import Text from '../base/Text'
import { baseFontSize } from '../base/Text'
import { Themestore } from '../../data/Themestore'

export interface Option {
  value: string
  label: string
}

export type InputMode = 'fill' | 'outline'

export interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: Option[]
  error?: string
  mode?: InputMode
}

const Select = ({
  label,
  options,
  error,
  mode = 'outline',
  className = '',
  id,
  ...rest
}: Props) => {
  const { current } = Themestore()
  const selectId = id ?? `select-${Math.random().toString(36).slice(2)}`
  const dark = current?.system?.dark
  const darkPaled = dark === 'black' ? '#00000014' : dark && /^#[0-9A-Fa-f]{6}$/.test(dark) ? `${dark}14` : undefined
  return (
    <div
      className="rounded-base"
      style={{
        ['--focus-border' as string]: current?.brand?.secondary,
        ['--input-border' as string]: darkPaled,
      }}
    >
      {label && (
        <label htmlFor={selectId} className="block mb-1">
          <Text variant="sm">{label}</Text>
        </label>
      )}
      <select
        id={selectId}
        className={`input-base input-mode-${mode} w-full rounded-base px-3 py-2 ${error ? '!border-red-500' : ''} ${className}`}
        style={{
          fontSize: baseFontSize,
          lineHeight: 1.5,
          backgroundColor: mode === 'fill' ? (current?.system?.background ?? undefined) : 'transparent',
          color: current?.system?.dark,
        }}
        {...rest}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <Text variant="sm" className="mt-1" color={current?.system?.error}>
          {error}
        </Text>
      )}
    </div>
  )
}

export default Select
