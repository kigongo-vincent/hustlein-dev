import { ButtonHTMLAttributes, ReactNode } from 'react'
import View from '../base/View'
import Text from '../base/Text'
import Spinner from './Spinner'
import { Themestore } from '../../data/Themestore'

type Variant = 'primary' | 'outlinePrimary' | 'outlineSecondary' | 'secondary' | 'secondaryBrand' | 'background' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  label: string
  fullWidth?: boolean
  startIcon?: ReactNode
  /** When true, shows spinner and disables the button */
  loading?: boolean
}

const Button = ({
  variant = 'primary',
  size = 'md',
  label,
  fullWidth,
  startIcon,
  loading = false,
  className = '',
  disabled,
  ...rest
}: Props) => {
  const { current, mode } = Themestore()
  const isDisabled = disabled || loading
  const padding =
    size === 'sm' ? 'px-3 py-2' : size === 'lg' ? 'px-6 py-3' : 'px-4 py-2.5'
  const bg =
    variant === 'primary'
      ? 'p'
      : variant === 'outlinePrimary'
        ? 'bg'
        : variant === 'outlineSecondary'
          ? 'bg'
          : variant === 'secondary'
            ? mode === 'dark'
              ? 'bg'
              : 'fg'
            : variant === 'secondaryBrand'
              ? undefined
              : variant === 'background'
                ? 'bg'
                : undefined
  const isLight = variant === 'primary' || variant === 'danger' || variant === 'secondaryBrand'
  const dangerStyle =
    variant === 'danger'
      ? { backgroundColor: current?.system?.error, color: 'white' }
      : variant === 'secondaryBrand'
        ? { backgroundColor: current?.brand?.secondary, color: 'white' }
        : variant === 'outlinePrimary'
          ? { backgroundColor: 'transparent', color: current?.brand?.primary ?? '#682308', border: `2px solid ${current?.brand?.primary ?? '#682308'}` }
          : variant === 'outlineSecondary'
            ? { backgroundColor: 'transparent', color: current?.brand?.secondary ?? '#FF9600', border: `1px solid ${current?.brand?.secondary ?? '#FF9600'}` }
            : {}
  const primaryTextColor = current?.brand?.onPrimary ?? 'white'
  const textColor =
    variant === 'danger'
      ? 'white'
      : variant === 'primary'
        ? primaryTextColor
        : variant === 'outlinePrimary'
          ? (current?.brand?.primary ?? '#682308')
          : variant === 'outlineSecondary'
            ? (current?.brand?.secondary ?? '#FF9600')
            : isLight
              ? 'white'
              : current?.system?.dark
  const primaryIconColor = variant === 'primary' ? primaryTextColor : variant === 'outlinePrimary' ? (current?.brand?.primary ?? '#682308') : variant === 'outlineSecondary' ? (current?.brand?.secondary ?? '#FF9600') : undefined
  return (
    <button
      type="button"
      disabled={isDisabled}
      className={`rounded-base font-normal transition opacity disabled:opacity-50 ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      <View
        bg={bg}
        className={`rounded-base font-normal ${padding} ${fullWidth ? 'w-full block' : 'inline-flex'} flex items-center justify-center gap-2 flex-nowrap whitespace-nowrap`}
        style={{ ...dangerStyle, color: textColor, fontWeight: 400 }}
      >
        {loading ? (
          <Spinner size={size === 'lg' ? 'md' : 'sm'} />
        ) : (
          <>
            {startIcon && (
              <span
                className={`shrink-0 [&>svg]:size-5 ${isLight && !primaryIconColor ? 'text-white [&>svg]:text-white' : '[&>svg]:text-current'}`}
                style={primaryIconColor ? { color: primaryIconColor } : undefined}
              >
                {startIcon}
              </span>
            )}
            <Text
              mode={isLight && !current?.brand?.onPrimary && (variant as string) !== 'outlinePrimary' && (variant as string) !== 'outlineSecondary' ? 'light' : 'dark'}
              color={variant === 'ghost' ? current?.system?.dark : textColor}
              className="font-normal"
            >
              {label}
            </Text>
          </>
        )}
      </View>
    </button>
  )
}

export default Button
