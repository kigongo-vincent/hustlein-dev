import { ButtonHTMLAttributes, ReactNode } from 'react'
import View from '../base/View'
import Text from '../base/Text'
import { Themestore } from '../../data/Themestore'

type Variant = 'primary' | 'secondary' | 'background' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  label: string
  fullWidth?: boolean
  startIcon?: ReactNode
}

const Button = ({
  variant = 'primary',
  size = 'md',
  label,
  fullWidth,
  startIcon,
  className = '',
  disabled,
  ...rest
}: Props) => {
  const { current } = Themestore()
  const padding =
    size === 'sm' ? 'px-3 py-2.5' : size === 'lg' ? 'px-6 py-4' : 'px-4 py-3'
  const bg =
    variant === 'primary' ? 'p' : variant === 'secondary' ? 'fg' : variant === 'background' ? 'bg' : undefined
  const isLight = variant === 'primary' || variant === 'danger'
  const dangerStyle =
    variant === 'danger'
      ? { backgroundColor: current?.system?.error, color: 'white' }
      : {}
  return (
    <button
      type="button"
      disabled={disabled}
      className={`rounded-base font-normal transition opacity disabled:opacity-50 ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      <View
        bg={bg}
        className={`rounded-base ${padding} ${fullWidth ? 'w-full block' : 'inline-block'} flex items-center justify-center gap-2`}
        style={dangerStyle}
      >
        {startIcon && <span className="shrink-0 [&>svg]:size-5">{startIcon}</span>}
        <Text
          mode={isLight ? 'light' : 'dark'}
          color={variant === 'ghost' ? current?.system?.dark : undefined}
        >
          {label}
        </Text>
      </View>
    </button>
  )
}

export default Button
