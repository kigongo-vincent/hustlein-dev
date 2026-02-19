import { useState } from 'react'
import { Themestore } from '../../data/Themestore'

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase()
  return '?'
}

export interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  /** Use when on a dark background (e.g. primary navbar) for light text/fallback */
  inverted?: boolean
}

const sizeStyles = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-[13px]',
  lg: 'h-14 w-14 text-[18px]',
  xl: 'h-20 w-20 text-[22px]',
} as const

const Avatar = ({ src, name = '', size = 'md', className = '', inverted = false }: AvatarProps) => {
  const sizeClass = sizeStyles[size] ?? sizeStyles.md
  const { current } = Themestore()
  const [errored, setErrored] = useState(false)
  const showFallback = !src || errored
  const initials = getInitials(name || 'Guest')
  const bgColor = inverted
    ? 'rgba(255,255,255,0.25)'
    : current?.brand?.primary
      ? `${current.system.background}`
      : 'rgba(0,0,0,0.08)'
  const textColor = inverted ? '#fff' : current?.brand?.primary || current?.system?.dark || '#333'

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 overflow-hidden ${sizeClass} ${className}`}
      style={{
        backgroundColor: showFallback ? bgColor : undefined,
        color: showFallback ? textColor : undefined,
      }}
      aria-hidden
    >
      {showFallback ? (
        <span className="font-medium uppercase">{initials}</span>
      ) : (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      )}
    </div>
  )
}

export default Avatar
