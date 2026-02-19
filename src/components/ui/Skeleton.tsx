import { HTMLAttributes } from 'react'

export interface Props extends HTMLAttributes<HTMLDivElement> {
  /** Optional fixed width (e.g. 'w-24') */
  width?: string
  /** Optional fixed height (e.g. 'h-4') */
  height?: string
  /** Use rounded-full for circles/pills */
  rounded?: 'base' | 'full'
}

const Skeleton = ({
  width,
  height = 'h-4',
  rounded = 'base',
  className = '',
  ...rest
}: Props) => {
  const roundedClass = rounded === 'full' ? 'rounded-full' : 'rounded-base'
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`animate-pulse bg-black/10 dark:bg-white/10 ${roundedClass} ${height} ${width || ''} ${className}`}
      {...rest}
    />
  )
}

export default Skeleton
