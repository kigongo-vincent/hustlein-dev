import type { ThemeI, themeMode } from '../../data/Themestore'

/** Links on dark auth cards (forgot password, footer): readable on `foreground` surfaces. */
export function authCardMutedLinkColor(mode: themeMode): string {
  return mode === 'dark' ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.55)'
}

/** Inline links that should pop (get started, sign in) — accent on dark, brand secondary on light. */
export function authCardAccentLinkColor(current: ThemeI | undefined, mode: themeMode): string {
  if (mode === 'dark') {
    return current?.accent?.yellow ?? '#FFD43B'
  }
  return current?.brand?.secondary ?? '#FF9600'
}

/** Helper / caption text on auth card */
export function authCardCaptionColor(mode: themeMode): string {
  return mode === 'dark' ? 'rgba(255,255,255,0.68)' : 'rgba(0,0,0,0.55)'
}
