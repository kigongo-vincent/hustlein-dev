import { InputHTMLAttributes, useRef, useState, useEffect, type ChangeEvent } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Text from '../base/Text'
import { baseFontSize } from '../base/Text'
import { Themestore } from '../../data/Themestore'

export type InputMode = 'fill' | 'outline'

export interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  /** fill = solid background from theme; outline = transparent background (default outside auth) */
  mode?: InputMode
  /** Override background for the floating label (e.g. to match a colored modal) */
  labelBackgroundColor?: string
}

const Input = ({
  label,
  error,
  hint,
  mode = 'outline',
  labelBackgroundColor,
  className = '',
  id,
  value,
  defaultValue,
  onFocus,
  onBlur,
  onInput,
  onChange,
  placeholder,
  autoComplete,
  type: typeProp = 'text',
  ...rest
}: Props) => {
  const { current } = Themestore()
  const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`
  const inputRef = useRef<HTMLInputElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [hasValue, setHasValue] = useState(() => {
    if (typeof value === 'string' && value.length > 0) return true
    if (typeof defaultValue === 'string' && defaultValue.length > 0) return true
    return false
  })

  const isControlled = value !== undefined
  const filled = hasValue || (isControlled && typeof value === 'string' && value.length > 0)
  const floated = isFocused || filled
  const isPassword = typeProp === 'password'
  const inputType = isPassword ? (passwordVisible ? 'text' : 'password') : typeProp

  // When the browser autofills, React state might not update via `onChange` in some browsers.
  // We detect autofill start/cancel via CSS animation hooks and, in controlled mode, sync DOM -> React
  // by firing `onChange` with the current input value.
  const latestValueRef = useRef<string | undefined>(typeof value === 'string' ? value : undefined)
  const latestOnChangeRef = useRef<typeof onChange>(onChange)
  latestValueRef.current = typeof value === 'string' ? value : undefined
  latestOnChangeRef.current = onChange

  const syncFilledFromInput = () => {
    const el = inputRef.current
    if (!el) return
    setHasValue(el.value.length > 0)
  }

  useEffect(() => {
    if (isControlled) {
      setHasValue(typeof value === 'string' && value.length > 0)
      return
    }
    syncFilledFromInput()
    const t1 = setTimeout(syncFilledFromInput, 0)
    const t2 = setTimeout(syncFilledFromInput, 100)
    const t3 = setTimeout(syncFilledFromInput, 500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [isControlled, value])

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    const handleAnimation = (e: AnimationEvent) => {
      if (e.animationName === 'onAutoFillStart' || e.animationName === 'onAutoFillCancel') {
        syncFilledFromInput()
        // Controlled inputs: keep parent state in sync with autofilled value.
        const domValue = el.value
        const currentValue = latestValueRef.current
        if (latestOnChangeRef.current && typeof currentValue === 'string' && domValue !== currentValue) {
          const evt = { target: { value: domValue } } as unknown as ChangeEvent<HTMLInputElement>
          latestOnChangeRef.current(evt)
        }
      }
    }
    el.addEventListener('animationstart', handleAnimation)
    return () => el.removeEventListener('animationstart', handleAnimation)
  }, [isControlled])

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    onFocus?.(e)
  }
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    onBlur?.(e)
  }
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) setHasValue(e.target.value.length > 0)
    onChange?.(e)
  }

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
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type={inputType}
          value={value}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          placeholder={floated ? placeholder : undefined}
          aria-label={label}
          aria-invalid={!!error}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onInput={onInput}
          onChange={handleChange}
          className={`input-base input-floating input-mode-${mode} w-full rounded-base pt-3 pb-2 ${isPassword ? 'pr-10' : 'px-3'} pl-3 ${error ? '!border-red-500' : ''} ${className}`}
          style={{
            fontSize: baseFontSize,
            lineHeight: 1.5,
            backgroundColor: mode === 'fill' ? (current?.system?.background ?? undefined) : 'transparent',
            color: current?.system?.dark,
          }}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-base text-black/50 hover:text-black/80 dark:text-white/50 dark:hover:text-white/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-black/20 dark:focus-visible:ring-white/20"
            style={{ color: current?.system?.dark ? `${current.system.dark}99` : undefined }}
            onClick={() => setPasswordVisible((v) => !v)}
          >
            {passwordVisible ? <EyeOff size={18} strokeWidth={1.8} color={current?.system?.dark} /> : <Eye size={18} strokeWidth={1.8} color={current?.system?.dark} />}
          </button>
        )}
        {label && (
          <label
            htmlFor={inputId}
            className={`pointer-events-none absolute left-3 transition-all duration-200 ease-out origin-left ${floated
              ? 'top-0 -translate-y-1/2 text-xs'
              : 'top-1/2 -translate-y-1/2'
              }`}
            style={{
              fontSize: floated ? 11 : baseFontSize,
              lineHeight: 1.5,
              color: floated ? (current?.system?.dark ?? 'inherit') : (current?.system?.dark ? `${current.system.dark}99` : 'inherit'),
              backgroundColor: floated ? (labelBackgroundColor ?? (mode === 'fill' ? (current?.system?.background ?? 'transparent') : (current?.system?.foreground ?? 'transparent'))) : 'transparent',
              paddingLeft: floated ? 2 : 0,
              paddingRight: floated ? 2 : 0,
            }}
          >
            {label}
          </label>
        )}
      </div>
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

export default Input
