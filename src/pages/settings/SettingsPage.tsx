import { useState, useEffect } from 'react'
import Text from '../../components/base/Text'
import { Card, Button } from '../../components/ui'
import { AppPageLayout } from '../../components/layout'
import { Themestore } from '../../data/Themestore'
import type { themeMode, ThemeOverrides } from '../../data/Themestore'
import { Palette, RotateCcw } from 'lucide-react'

const SettingsPage = () => {
  const { current, mode, setTheme, setCustomTheme, resetCustomTheme, customOverrides } = Themestore()
  const [primary, setPrimary] = useState(current?.brand?.primary ?? '#682308')
  const [secondary, setSecondary] = useState(current?.brand?.secondary ?? '#FF9600')
  const [background, setBackground] = useState(current?.system?.background ?? '#F4f4f4')
  const [foreground, setForeground] = useState(current?.system?.foreground ?? '#f9f9f9')

  useEffect(() => {
    setPrimary(current?.brand?.primary ?? '#682308')
    setSecondary(current?.brand?.secondary ?? '#FF9600')
    setBackground(current?.system?.background ?? '#F4f4f4')
    setForeground(current?.system?.foreground ?? '#f9f9f9')
  }, [current?.brand?.primary, current?.brand?.secondary, current?.system?.background, current?.system?.foreground])

  const applyOverrides = (overrides: ThemeOverrides) => {
    setCustomTheme({
      ...customOverrides,
      ...overrides,
      brand: { ...customOverrides?.brand, ...overrides.brand },
      system: { ...customOverrides?.system, ...overrides.system },
    })
  }

  const handlePrimaryChange = (value: string) => {
    setPrimary(value)
    applyOverrides({ brand: { primary: value } })
  }
  const handleSecondaryChange = (value: string) => {
    setSecondary(value)
    applyOverrides({ brand: { secondary: value } })
  }
  const handleBackgroundChange = (value: string) => {
    setBackground(value)
    applyOverrides({ system: { background: value } })
  }
  const handleForegroundChange = (value: string) => {
    setForeground(value)
    applyOverrides({ system: { foreground: value } })
  }

  const handleReset = () => {
    resetCustomTheme()
    // useEffect will sync local state from updated current
  }

  return (
    <AppPageLayout title="Settings" subtitle="Preferences and theming">
      <div className="space-y-6 w-full max-w-3xl">
      <Card title="Theming" subtitle="Customize colors and appearance" rightIcon={<Palette className="w-4 h-4" />}>
        <div className="space-y-5">
          <div>
            <Text variant="sm" className="font-medium opacity-90 mb-2 block">Theme mode</Text>
            <div className="flex gap-2">
              {(['light', 'dark'] as themeMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setTheme(m)}
                  className={`px-4 py-2.5 rounded-base font-normal capitalize transition ${mode === m ? 'opacity-100 ring-2 ring-offset-2' : 'opacity-70 hover:opacity-90'}`}
                  style={
                    mode === m
                      ? {
                          backgroundColor: current?.brand?.primary || '#682308',
                          color: 'white',
                          ringColor: current?.brand?.primary || '#682308',
                        }
                      : {}
                  }
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <Text variant="sm" className="font-medium opacity-90">Brand primary</Text>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primary}
                  onChange={(e) => handlePrimaryChange(e.target.value)}
                  className="w-10 h-10 rounded-base border border-black/15 cursor-pointer shrink-0"
                  aria-label="Primary color"
                />
                <input
                  type="text"
                  value={primary}
                  onChange={(e) => handlePrimaryChange(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-base border border-black/15 text-sm font-mono"
                  aria-label="Primary color hex"
                />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <Text variant="sm" className="font-medium opacity-90">Brand secondary</Text>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondary}
                  onChange={(e) => handleSecondaryChange(e.target.value)}
                  className="w-10 h-10 rounded-base border border-black/15 cursor-pointer shrink-0"
                  aria-label="Secondary color"
                />
                <input
                  type="text"
                  value={secondary}
                  onChange={(e) => handleSecondaryChange(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-base border border-black/15 text-sm font-mono"
                  aria-label="Secondary color hex"
                />
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <Text variant="sm" className="font-medium opacity-90">Page background</Text>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={background}
                  onChange={(e) => handleBackgroundChange(e.target.value)}
                  className="w-10 h-10 rounded-base border border-black/15 cursor-pointer shrink-0"
                  aria-label="Background color"
                />
                <input
                  type="text"
                  value={background}
                  onChange={(e) => handleBackgroundChange(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-base border border-black/15 text-sm font-mono"
                  aria-label="Background color hex"
                />
              </div>
            </label>
            <label className="flex flex-col gap-1.5">
              <Text variant="sm" className="font-medium opacity-90">Card / surface</Text>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={foreground}
                  onChange={(e) => handleForegroundChange(e.target.value)}
                  className="w-10 h-10 rounded-base border border-black/15 cursor-pointer shrink-0"
                  aria-label="Foreground color"
                />
                <input
                  type="text"
                  value={foreground}
                  onChange={(e) => handleForegroundChange(e.target.value)}
                  className="flex-1 min-w-0 px-3 py-2 rounded-base border border-black/15 text-sm font-mono"
                  aria-label="Foreground color hex"
                />
              </div>
            </label>
          </div>

          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              label="Reset to defaults"
              startIcon={<RotateCcw className="w-4 h-4" />}
              onClick={handleReset}
            />
          </div>
        </div>
      </Card>
      </div>
    </AppPageLayout>
  )
}

export default SettingsPage
