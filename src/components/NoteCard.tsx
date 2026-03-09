import { useState } from 'react'
import Text, { baseFontSize } from './base/Text'
import { Themestore } from '../data/Themestore'
import { NOTE_COLORS } from '../types'
import { Check, Palette } from 'lucide-react'

/** Dark-mode variants for note card/editor backgrounds (muted, tinted). Export for note form modal. */
export const NOTE_COLORS_DARK: Record<string, string> = {
  '#fef3c7': '#3d3520',
  '#d1fae5': '#1a2e26',
  '#dbeafe': '#1a2435',
  '#fce7f3': '#352530',
  '#e9d5ff': '#2a2435',
  '#fed7aa': '#3d3020',
  '#e5e7eb': '#2a2a2a',
  '#fff': '#252525',
  '#ffffff': '#252525',
}
export function darkenNoteBg(hex: string, fallbackDarkBg: string): string {
  const h = hex?.trim().toLowerCase()
  if (!h || !h.startsWith('#')) return fallbackDarkBg
  return NOTE_COLORS_DARK[h] ?? fallbackDarkBg
}

export interface NoteCardProps {
  title: string
  content: string
  color: string
  onColorChange?: (color: string) => void
  /** Compact for table/cell; full for standalone card */
  variant?: 'compact' | 'full'
  /** Show color picker inline (instant select) */
  showColorPicker?: boolean
  onClick?: () => void
  className?: string
}

export default function NoteCard({
  title,
  content,
  color,
  onColorChange,
  variant = 'full',
  showColorPicker = true,
  onClick,
  className = '',
}: NoteCardProps) {
  const { current, mode } = Themestore()
  const textOnDark = current?.system?.dark
  const [pickerOpen, setPickerOpen] = useState(false)

  const isDarkMode = mode === 'dark'
  const rawBg = color || '#fef3c7'
  const bg = isDarkMode ? darkenNoteBg(rawBg, current?.system?.foreground ?? '#141414') : rawBg
  const isLightBg = !isDarkMode && (rawBg === '#fff' || rawBg === '#ffffff' || (rawBg.startsWith('#') && parseInt(rawBg.slice(1), 16) > 0xeeeeee))
  const textColor = isDarkMode ? (textOnDark ?? '#e0e0e0') : (isLightBg ? '#1f2937' : '#1f2937')

  const contentPreview = content?.replace(/\n/g, ' ').slice(0, variant === 'compact' ? 40 : 120) + (content?.length > (variant === 'compact' ? 40 : 120) ? '…' : '')

  return (
    <div
      role={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-base shadow-custom overflow-hidden ${onClick ? 'cursor-pointer hover:opacity-95' : ''} ${className}`}
      style={{
        backgroundColor: bg,
        color: textColor,
        minHeight: variant === 'compact' ? 72 : 140,
      }}
    >
      <div className={`p-3 ${variant === 'compact' ? 'py-2' : 'p-3'}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <Text className="font-medium truncate block" style={{ fontSize: baseFontSize * (variant === 'compact' ? 0.95 : 1), color: textColor }}>
              {title || 'Untitled note'}
            </Text>
            {contentPreview && (
              <Text variant="sm" className="mt-0.5 line-clamp-2 opacity-90" style={{ color: textColor }}>
                {contentPreview}
              </Text>
            )}
          </div>
          {showColorPicker && onColorChange && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setPickerOpen((o) => !o)
                }}
                className="p-1.5 rounded-base opacity-80 hover:opacity-100"
                style={{ color: textColor }}
                aria-label="Change note color"
              >
                <Palette size={16} />
              </button>
              {pickerOpen && (
                <>
                  <div className="fixed inset-0 z-[9998]" aria-hidden onClick={() => setPickerOpen(false)} />
                  <div
                    className="absolute right-0 top-full mt-1 z-[9999] p-2 rounded-base border shadow-lg flex flex-wrap gap-1.5"
                    style={{
                      backgroundColor: current?.system?.foreground ?? '#fff',
                      borderColor: current?.system?.border ?? 'rgba(0,0,0,0.1)',
                    }}
                  >
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onColorChange(c)
                          setPickerOpen(false)
                        }}
                        className="w-7 h-7 rounded-base border-2 shrink-0 flex items-center justify-center"
                        style={{
                          backgroundColor: c,
                          borderColor: color === c ? (current?.brand?.primary ?? '#682308') : 'transparent',
                        }}
                        aria-label={`Color ${c}`}
                      >
                        {color === c && <Check size={14} style={{ color: '#1f2937' }} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
