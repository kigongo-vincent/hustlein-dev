export const APP_ICON_SIZE = 18

/** Max display size for `Avatar` `size="xl"` — use for exported avatar image dimensions. */
export const AVATAR_XL_PIXEL_SIZE = Math.round(APP_ICON_SIZE * 4)

export type AppThemeMode = 'light' | 'dark'

export const getMutedIconColor = (mode: AppThemeMode): string => {
  return mode === 'dark' ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.70)'
}

