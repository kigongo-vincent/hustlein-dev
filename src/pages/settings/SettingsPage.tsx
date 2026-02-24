import { useState } from 'react'
import Text from '../../components/base/Text'
import View from '../../components/base/View'
import { Card } from '../../components/ui'
import { AppPageLayout } from '../../components/layout'
import { Themestore } from '../../data/Themestore'
import type { themeMode } from '../../data/Themestore'
import {
  Palette,
  Settings,
  User,
  Bell,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react'

type SettingsSectionId = 'general' | 'appearance' | 'account' | 'notifications'

interface SectionItem {
  id: SettingsSectionId
  label: string
  icon: React.ReactNode
}

const SECTIONS: SectionItem[] = [
  { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
  { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
  { id: 'account', label: 'Account', icon: <User className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
]

const SettingsPage = () => {
  const { current, mode, setTheme } = Themestore()
  const [activeSection, setActiveSection] = useState<SettingsSectionId>('appearance')

  const bg = current?.system?.background ?? '#F4f4f4'
  const dark = current?.system?.dark ?? '#111'
  const primaryColor = current?.brand?.primary ?? '#682308'

  return (
    <AppPageLayout title="Settings" subtitle="Preferences and configuration" fullWidth>
      <div className="w-full flex flex-col lg:flex-row gap-6 lg:gap-8">
        <nav
          className="shrink-0 w-full lg:w-56"
          aria-label="Settings sections"
        >
          <View
            bg="fg"
            className="rounded-base shadow-custom py-1 overflow-hidden"
          >
            <ul className="flex flex-row lg:flex-col overflow-x-auto scroll-slim gap-0.5">
              {SECTIONS.map((section) => {
                const isActive = activeSection === section.id
                return (
                  <li key={section.id}>
                    <button
                      type="button"
                      onClick={() => setActiveSection(section.id)}
                      className={`
                        w-full flex items-center gap-3 py-2.5 pl-3 pr-3 rounded-base text-left
                        transition-colors duration-150 ease-out
                        ${isActive ? 'opacity-100' : 'opacity-80 hover:opacity-100'}
                      `}
                      style={{
                        backgroundColor: isActive ? `${primaryColor}14` : 'transparent',
                        color: isActive ? primaryColor : dark,
                      }}
                      aria-current={isActive ? 'true' : undefined}
                    >
                      <span
                        className="shrink-0 flex items-center justify-center [&>svg]:size-4"
                        style={{ color: isActive ? primaryColor : undefined }}
                        aria-hidden
                      >
                        {section.icon}
                      </span>
                      <Text
                        variant="sm"
                        className="font-medium flex-1"
                        color={isActive ? primaryColor : dark}
                      >
                        {section.label}
                      </Text>
                      <ChevronRight
                        className="w-4 h-4 shrink-0 lg:hidden opacity-60"
                        style={{ color: dark }}
                        aria-hidden
                      />
                    </button>
                  </li>
                )
              })}
            </ul>
          </View>
        </nav>

        <main className="flex-1 min-w-0">
          {activeSection === 'general' && (
            <div className="space-y-6">
              <Card title="Default view" subtitle="Choose what you see when you open the app">
                <Text variant="sm" className="opacity-90" color={dark}>
                  Set your preferred home view and default filters. These apply across devices when you sign in.
                </Text>
              </Card>
              <Card title="Language & region" subtitle="Display language and formats">
                <Text variant="sm" className="opacity-90" color={dark}>
                  Change language, date and number formats. Updates apply immediately across the app.
                </Text>
              </Card>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <Card title="Theme" subtitle="Light or dark interface">
                <div className="space-y-3">
                  <Text variant="sm" className="opacity-90" color={dark}>
                    Choose how the app looks.
                  </Text>
                  <div
                    className="inline-flex rounded-base p-1 gap-0"
                    style={{ backgroundColor: bg }}
                  >
                    {(['light', 'dark'] as themeMode[]).map((m) => {
                      const isSelected = mode === m
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setTheme(m)}
                          className={`
                            flex items-center gap-2 py-2 pl-4 pr-4 rounded-base font-normal capitalize
                            transition-all duration-150 ease-out
                            ${isSelected ? 'opacity-100' : 'opacity-80 hover:opacity-100'}
                          `}
                          style={
                            isSelected
                              ? { backgroundColor: primaryColor, color: '#fff' }
                              : { backgroundColor: 'transparent', color: dark }
                          }
                          aria-pressed={isSelected}
                        >
                          {m === 'light' ? (
                            <Sun className="w-4 h-4 shrink-0" aria-hidden />
                          ) : (
                            <Moon className="w-4 h-4 shrink-0" aria-hidden />
                          )}
                          {m}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="space-y-6">
              <Card title="Profile" subtitle="Name, email and avatar">
                <Text variant="sm" className="opacity-90" color={dark}>
                  Update your display name, email address and profile photo. Changes are visible to your team.
                </Text>
              </Card>
              <Card title="Security" subtitle="Password and sign-in">
                <Text variant="sm" className="opacity-90" color={dark}>
                  Change your password and manage sign-in options. Enable two-factor authentication for extra security.
                </Text>
              </Card>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <Card title="In-app notifications" subtitle="Alerts and activity">
                <Text variant="sm" className="opacity-90" color={dark}>
                  Choose which in-app alerts you receive: mentions, project updates, deadlines and team activity.
                </Text>
              </Card>
              <Card title="Email" subtitle="Digests and reminders">
                <Text variant="sm" className="opacity-90" color={dark}>
                  Configure email frequency for digests and reminders. Turn off emails you don’t need.
                </Text>
              </Card>
            </div>
          )}
        </main>
      </div>
    </AppPageLayout>
  )
}

export default SettingsPage
