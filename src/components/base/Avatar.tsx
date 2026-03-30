import { useState } from 'react'
import { Themestore } from '../../data/Themestore'
import { APP_ICON_SIZE, AVATAR_XL_PIXEL_SIZE } from './iconTokens'

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

const Avatar = ({ src, name = '', size = 'md', className = '', inverted = false }: AvatarProps) => {
  // Tie avatar size to the same icon scale used across the app.
  // "sm" is intentionally a bit larger to better match header/sidebar visuals.
  const sizePx =
    size === 'sm'
      ? Math.round(APP_ICON_SIZE * 2.0)
      : size === 'md'
        ? Math.round(APP_ICON_SIZE * 2.2)
        : size === 'lg'
          ? Math.round(APP_ICON_SIZE * 2.8)
          : AVATAR_XL_PIXEL_SIZE // xl

  const initialsFontPx =
    size === 'sm' || size === 'md'
      ? Math.round(APP_ICON_SIZE * 0.75)
      : size === 'lg'
        ? 18
        : 22

  const { current, mode } = Themestore()
  const [errored, setErrored] = useState(false)
  const showFallback = !src || errored
  const initials = getInitials(name || 'Guest')
  const primary = current?.brand?.primary || '#682308'
  const isDark = mode === 'dark'

  let fallbackBg: string | undefined
  let fallbackText: string | undefined
  if (showFallback) {
    if (inverted) {
      fallbackBg = 'rgba(255,255,255,0.25)'
      fallbackText = '#fff'
    } else {
      fallbackBg = `color-mix(in srgb, ${primary} 10%, transparent)`
      fallbackText = isDark ? (current?.system?.dark ?? '#e0e0e0') : primary
    }
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{
        width: sizePx,
        height: sizePx,
        backgroundColor: fallbackBg,
        color: fallbackText,
      }}
      aria-hidden
    >
      {showFallback ? (
        <span className="font-medium uppercase" style={{ fontSize: initialsFontPx, lineHeight: 1 }}>
          {initials}
        </span>
      ) : (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          style={{ opacity: 1 }}
          onError={() => setErrored(true)}
        />
      )}
    </div>
  )
}

export default Avatar
