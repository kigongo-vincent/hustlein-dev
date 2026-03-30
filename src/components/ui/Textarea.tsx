import { TextareaHTMLAttributes } from 'react'
import Text from '../base/Text'
import { baseFontSize } from '../base/Text'
import { Themestore } from '../../data/Themestore'

export type TextareaMode = 'fill' | 'outline'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  mode?: TextareaMode
}

const Textarea = ({
  label,
  error,
  hint,
  mode = 'outline',
  className = '',
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  autoComplete = 'off',
  ...rest
}: TextareaProps) => {
  const { current } = Themestore()
  const inputId = id ?? `textarea-${Math.random().toString(36).slice(2)}`
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
        <label
          htmlFor={inputId}
          className="block mb-1.5"
          style={{
            fontSize: baseFontSize,
            lineHeight: 1.5,
            color: dark ? `${dark}99` : 'inherit',
          }}
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        aria-label={label}
        aria-invalid={!!error}
        className={`input-base w-full rounded-base px-3 py-2 resize-y min-h-[80px] ${error ? '!border-red-500' : ''} ${className}`}
        style={{
          fontSize: baseFontSize,
          lineHeight: 1.5,
          backgroundColor: mode === 'fill' ? (current?.system?.background ?? undefined) : 'transparent',
          color: current?.system?.dark,
        }}
        {...rest}
        autoComplete={autoComplete}
      />
      {error && (
        <Text variant="sm" className="mt-1" color={current?.system?.error}>
          {error}
        </Text>
      )}
      {hint && !error && (
        <Text variant="sm" className="mt-1 opacity-70">
          {hint}
        </Text>
      )}
    </div>
  )
}

export default Textarea
