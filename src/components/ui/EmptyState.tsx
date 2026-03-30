import type { ReactNode } from 'react'
import Text, { baseFontSize } from '../base/Text'
import { Themestore, type ThemeI, type themeMode } from '../../data/Themestore'

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '')
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const num = parseInt(n, 16)
  if (Number.isNaN(num)) return { r: 0, g: 0, b: 0 }
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function mixHex(a: string, hexB: string, t: number): string {
  const A = hexToRgb(a)
  const B = hexToRgb(hexB)
  const r = Math.round(A.r + (B.r - A.r) * t)
  const g = Math.round(A.g + (B.g - A.g) * t)
  const bl = Math.round(A.b + (B.b - A.b) * t)
  return `#${[r, g, bl].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

function rgbaFromHex(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r},${g},${b},${alpha})`
}

type IllustrationPalette = {
  sky: string
  ground: string
  star: string
  starOpacity: number
  plant: string
  plantDark: string
  folderMain: string
  folderShade: string
  skin: string
  skinShadow: string
  hair: string
  shirt: string
  shirtShade: string
  paper: string
  paperFold: string
  glassRim: string
  glassHandle: string
  lensMid: string
  lensInner: string
  mark: string
  mutedInk: string
}

function getIllustrationPalette(current: ThemeI, mode: themeMode): IllustrationPalette {
  const accent = current.accent ?? {
    blue: '#228BE6',
    green: '#12B886',
    yellow: '#FAB005',
    teal: '#0CA678',
  }
  const bg = current.system.background
  const fg = current.system.foreground
  const primary = current.brand.primary
  const mutedInk = current.system.dark

  if (mode === 'dark') {
    // Match card/surface — avoid mixing heavy accent blue into bg (reads as a “light mode” panel).
    const sky = mixHex(fg, bg, 0.18)
    const ground = mixHex(mixHex(fg, bg, 0.45), bg, 0.55)
    const star = mixHex(mutedInk, fg, 0.35)
    // Muted foliage so mint/teal doesn’t pop against charcoal
    const plant = mixHex(accent.teal, mixHex(fg, accent.green, 0.5), 0.55)
    const plantDark = mixHex(plant, bg, 0.45)
    const folderMain = mixHex(accent.yellow, primary, 0.18)
    const folderShade = mixHex(folderMain, bg, 0.5)
    const skin = mixHex('#E8A88C', fg, 0.2)
    const skinShadow = mixHex(skin, bg, 0.4)
    const hair = mixHex('#1a1a1a', fg, 0.15)
    const shirt = mixHex(fg, mutedInk, 0.08)
    const shirtShade = mixHex(fg, bg, 0.35)
    const paper = mixHex(fg, mutedInk, 0.12)
    const paperFold = mixHex(fg, bg, 0.4)
    const glassRim = mixHex(mutedInk, fg, 0.25)
    const glassHandle = mixHex(mutedInk, bg, 0.4)
    const lensMid = mixHex(fg, mutedInk, 0.18)
    const lensInner = mixHex(fg, mutedInk, 0.1)

    return {
      sky,
      ground,
      star,
      starOpacity: 0.35,
      plant,
      plantDark,
      folderMain,
      folderShade,
      skin,
      skinShadow,
      hair,
      shirt,
      shirtShade,
      paper,
      paperFold,
      glassRim,
      glassHandle,
      lensMid,
      lensInner,
      mark: primary,
      mutedInk,
    }
  }

  const sky = mixHex(fg, accent.blue, 0.14)
  const ground = mixHex(sky, accent.blue, 0.32)
  const star = '#ffffff'
  const plant = mixHex(accent.green, accent.teal, 0.35)
  const plantDark = mixHex(plant, '#2d4a3e', 0.25)
  const folderMain = mixHex(accent.yellow, primary, 0.08)
  const folderShade = mixHex(folderMain, '#8b6914', 0.22)
  const skin = '#EEB89A'
  const skinShadow = '#D9A080'
  const hair = mixHex('#2C2C2C', mutedInk, 0.15)
  const shirt = mixHex('#ffffff', fg, 0.06)
  const shirtShade = mixHex('#E8E8E8', fg, 0.12)
  const paper = '#ffffff'
  const paperFold = shirtShade
  const glassRim = mixHex('#4A4A4A', mutedInk, 0.2)
  const glassHandle = mixHex('#3D3D3D', mutedInk, 0.25)
  const lensMid = mixHex('#E8E8E8', fg, 0.2)
  const lensInner = mixHex('#F5F5F5', fg, 0.12)

  return {
    sky,
    ground,
    star,
    starOpacity: 1,
    plant,
    plantDark,
    folderMain,
    folderShade,
    skin,
    skinShadow,
    hair,
    shirt,
    shirtShade,
    paper,
    paperFold,
    glassRim,
    glassHandle,
    lensMid,
    lensInner,
    mark: primary,
    mutedInk,
  }
}

export type EmptyStateVariant =
  | 'folder'
  | 'search'
  | 'inbox'
  | 'invoice'
  | 'chart'
  | 'users'
  | 'calendar'
  | 'task'
  | 'note'
  | 'file'
  | 'assignment'
  | 'columns'
  | 'generic'

/**
 * Flat fill-only “no results” scene: soft blue ground, plants, figure, folder,
 * magnifying glass with mark, floating documents — colors follow theme (light/dark).
 */
function Illustration({ palette, compact, variant: _variant }: { palette: IllustrationPalette; compact: boolean; variant: EmptyStateVariant }) {
  const s = compact ? 56 : 112
  const common = { width: s, height: s, className: 'shrink-0', 'aria-hidden': true as const }
  const p = palette

  return (
    <svg {...common} viewBox="0 0 240 180" fill="none">
      <rect width="240" height="180" fill={p.sky} />

      {/* Ground */}
      <ellipse cx="120" cy="168" rx="108" ry="14" fill={p.ground} opacity={0.85} />

      {/* Decorative stars & swirl dots (filled circles) */}
      <circle cx="38" cy="42" r="3" fill={p.star} opacity={0.85 * p.starOpacity} />
      <circle cx="200" cy="36" r="2.5" fill={p.star} opacity={0.8 * p.starOpacity} />
      <circle cx="214" cy="58" r="2" fill={p.star} opacity={0.7 * p.starOpacity} />
      <circle cx="28" cy="78" r="2" fill={p.star} opacity={0.65 * p.starOpacity} />
      <circle cx="52" cy="28" r="2" fill={p.star} opacity={0.55 * p.starOpacity} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <circle
          key={i}
          cx={165 + Math.cos((i / 6) * Math.PI) * 22}
          cy={38 + Math.sin((i / 6) * Math.PI) * 10}
          r={1.4}
          fill={p.star}
          opacity={(0.5 - i * 0.05) * p.starOpacity}
        />
      ))}

      {/* Plants (back) */}
      <ellipse cx="72" cy="152" rx="28" ry="18" fill={p.plantDark} opacity={0.9} />
      <ellipse cx="48" cy="148" rx="18" ry="22" fill={p.plant} />
      <ellipse cx="168" cy="154" rx="26" ry="16" fill={p.plantDark} opacity={0.85} />
      <ellipse cx="192" cy="150" rx="16" ry="20" fill={p.plant} />

      {/* Floating documents */}
      <path d="M22 88 L22 118 L48 118 L54 112 L54 82 L28 82 Z" fill={p.paper} opacity={0.95} />
      <path d="M28 82 L54 82 L48 76 L22 76 Z" fill={p.paperFold} opacity={0.5} />
      <text x="34" y="102" fill={p.mutedInk} opacity={0.5} fontSize="14" fontFamily="system-ui, sans-serif" fontWeight="600">
        ?
      </text>

      <path d="M186 64 L186 94 L208 94 L214 88 L214 60 L192 60 Z" fill={p.paper} opacity={0.92} />
      <path d="M192 60 L214 60 L208 54 L186 54 Z" fill={p.paperFold} opacity={0.45} />
      <g transform="translate(200 78)">
        <rect x="-2" y="-7" width="4" height="14" rx="1.5" fill={p.mark} transform="rotate(45)" />
        <rect x="-2" y="-7" width="4" height="14" rx="1.5" fill={p.mark} transform="rotate(-45)" />
      </g>

      <path d="M158 24 L158 48 L176 48 L180 44 L180 22 L164 22 Z" fill={p.paper} opacity={0.9} />
      <path d="M164 22 L180 22 L176 18 L158 18 Z" fill={p.paperFold} opacity={0.4} />
      <text x="164" y="40" fill={p.mutedInk} opacity={0.48} fontSize="12" fontFamily="system-ui, sans-serif" fontWeight="600">
        ?
      </text>

      {/* Figure (behind folder) */}
      <ellipse cx="118" cy="58" rx="20" ry="22" fill={p.hair} />
      <ellipse cx="118" cy="62" rx="17" ry="19" fill={p.skin} />
      <path d="M108 52 Q118 48 128 52 Q126 58 118 60 Q110 58 108 52" fill={p.hair} />
      <ellipse cx="110" cy="58" rx="5" ry="2.2" fill={p.hair} transform="rotate(-12 110 58)" />
      <ellipse cx="126" cy="58" rx="5" ry="2.2" fill={p.hair} transform="rotate(12 126 58)" />
      <path d="M114 68 Q118 72 122 68" fill={p.skinShadow} opacity={0.6} />
      <rect x="98" y="78" width="40" height="38" rx="8" fill={p.shirt} />
      <path d="M98 88 L98 108 Q98 116 104 116 L132 116 Q138 116 138 108 L138 88" fill={p.shirtShade} opacity={0.35} />
      <ellipse cx="104" cy="118" rx="8" ry="6" fill={p.shirt} />
      <ellipse cx="132" cy="118" rx="8" ry="6" fill={p.shirt} />
      {/* Hand to forehead */}
      <ellipse cx="108" cy="54" rx="8" ry="10" fill={p.skin} transform="rotate(-25 108 54)" />
      <ellipse cx="106" cy="48" rx="5" ry="6" fill={p.skinShadow} opacity={0.45} transform="rotate(-25 106 48)" />

      {/* Folder */}
      <path d="M52 72 L118 72 L128 62 L188 62 L188 142 L52 142 Z" fill={p.folderMain} />
      <path d="M52 72 L118 72 L128 62 L188 62 L188 78 L52 78 Z" fill={p.folderShade} />
      <path d="M52 78 L188 78 L188 142 L52 142 Z" fill={p.folderMain} />
      <rect x="52" y="132" width="136" height="10" fill={p.folderShade} opacity={0.35} />

      {/* Magnifying glass (fill-only: handle behind lens, X from filled bars) */}
      <path
        d="M132 118 L152 138 Q156 142 152 146 L148 150 Q144 154 140 150 L120 128 Z"
        fill={p.glassHandle}
      />
      <circle cx="120" cy="104" r="22" fill={p.glassRim} opacity={0.2} />
      <circle cx="120" cy="104" r="18" fill={p.lensMid} opacity={0.95} />
      <circle cx="120" cy="104" r="14" fill={p.lensInner} />
      <g transform="translate(120 104)">
        <rect x="-2.5" y="-10" width="5" height="20" rx="2" fill={p.mark} transform="rotate(45)" />
        <rect x="-2.5" y="-10" width="5" height="20" rx="2" fill={p.mark} transform="rotate(-45)" />
      </g>
    </svg>
  )
}

export type EmptyStateProps = {
  variant: EmptyStateVariant
  /** Shown below the illustration; omit in compact chart slots if you only want a caption */
  title?: string
  description?: string
  /** Tighter layout and smaller artwork (chart cards, side panels) */
  compact?: boolean
  className?: string
  children?: ReactNode
}

/**
 * Consistent empty-data UI with themed SVG illustrations.
 */
export default function EmptyState({
  variant,
  title,
  description,
  compact = false,
  className = '',
  children,
}: EmptyStateProps) {
  const { current, mode } = Themestore()
  const primary = current.brand.primary
  const dark = current.system.dark
  const illustrationPalette = getIllustrationPalette(current, mode)

  const frameBg =
    mode === 'dark'
      ? rgbaFromHex(dark, 0.06)
      : rgbaFromHex(primary, 0.06)

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? 'py-6 px-4 gap-3' : 'py-10 px-6 gap-4'} ${className}`}
      role="status"
    >
      <div
        className={`flex items-center justify-center ${compact ? 'rounded-2xl p-3' : 'rounded-[1.25rem] p-5'}`}
        style={{ backgroundColor: frameBg }}
      >
        <Illustration variant={variant} palette={illustrationPalette} compact={compact} />
      </div>
      {(title || description) && (
        <div className={`space-y-1.5 max-w-md ${compact ? '' : 'mx-auto'}`}>
          {title && (
            <Text className="font-semibold" style={{ fontSize: compact ? baseFontSize : baseFontSize * 1.08, color: dark }}>
              {title}
            </Text>
          )}
          {description && (
            <Text variant="sm" className="leading-relaxed opacity-75" style={{ color: dark }}>
              {description}
            </Text>
          )}
        </div>
      )}
      {children ? <div className="flex flex-wrap items-center justify-center gap-2 mt-1">{children}</div> : null}
    </div>
  )
}
