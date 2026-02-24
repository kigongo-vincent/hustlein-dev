import { ButtonHTMLAttributes, ReactNode } from 'react'
import View from '../base/View'
import Text from '../base/Text'
import { Themestore } from '../../data/Themestore'

type Variant = 'primary' | 'secondary' | 'secondaryBrand' | 'background' | 'ghost' | 'danger'
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
    size === 'sm' ? 'px-3 py-2' : size === 'lg' ? 'px-6 py-3' : 'px-4 py-2.5'
  const bg =
    variant === 'primary' ? 'p' : variant === 'secondary' ? 'fg' : variant === 'secondaryBrand' ? undefined : variant === 'background' ? 'bg' : undefined
  const isLight = variant === 'primary' || variant === 'danger' || variant === 'secondaryBrand'
  const dangerStyle =
    variant === 'danger'
      ? { backgroundColor: current?.system?.error, color: 'white' }
      : variant === 'secondaryBrand'
        ? { backgroundColor: current?.brand?.secondary, color: 'white' }
        : {}
  const textColor =
    variant === 'danger'
      ? 'white'
      : isLight
        ? 'white'
        : current?.system?.dark
  return (
    <button
      type="button"
      disabled={disabled}
      className={`rounded-base font-normal transition opacity disabled:opacity-50 ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      <View
        bg={bg}
        className={`rounded-base font-normal ${padding} ${fullWidth ? 'w-full block' : 'inline-flex'} flex items-center justify-center gap-2 flex-nowrap whitespace-nowrap`}
        style={{ ...dangerStyle, color: textColor, fontWeight: 400 }}
      >
        {startIcon && (
          <span className={`shrink-0 [&>svg]:size-5 ${isLight ? 'text-white [&>svg]:text-white' : '[&>svg]:text-current'}`}>
            {startIcon}
          </span>
        )}
        <Text
          mode={isLight ? 'light' : 'dark'}
          color={variant === 'ghost' ? current?.system?.dark : textColor}
          className="font-normal"
        >
          {label}
        </Text>
      </View>
    </button>
  )
}

export default Button
