export const APP_ICON_SIZE = 18

export type AppThemeMode = 'light' | 'dark'

export const getMutedIconColor = (mode: AppThemeMode): string => {
  return mode === 'dark' ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.70)'
}

