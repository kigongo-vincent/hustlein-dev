import { useState } from 'react'
import { X, Users, Settings, BellOff, LogOut, ChevronLeft } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import Text from '../../components/base/Text'
import { Button, Input } from '../../components/ui'
import Avatar from '../../components/base/Avatar'
import { Themestore } from '../../data/Themestore'

export type ChatParticipant = {
  id: string
  name: string
  avatarUrl?: string
  role?: string
}

export type ProjectChatGroupMenuProps = {
  open: boolean
  onClose: () => void
  /** Participants to show in "Manage participants" (e.g. project lead + comment authors). */
  participants?: ChatParticipant[]
  /** Current group/project name for settings. */
  groupName?: string
  /** Current group/project description for settings. */
  groupDescription?: string
  /** Called when user saves group settings (name, description). */
  onSaveGroupSettings?: (payload: { name: string; description: string }) => void | Promise<void>
  /** Called when user confirms leaving the group. Parent can close chat sidebar. */
  onLeaveGroup?: () => void
}

type View = 'menu' | 'participants' | 'settings'

export default function ProjectChatGroupMenu({
  open,
  onClose,
  participants = [],
  groupName = '',
  groupDescription = '',
  onSaveGroupSettings,
  onLeaveGroup,
}: ProjectChatGroupMenuProps) {
  const { current } = Themestore()
  const dark = current?.system?.dark
  const borderColor = current?.system?.border
  const bg = current?.system?.background

  const [message, setMessage] = useState<string | null>(null)
  const [view, setView] = useState<View>('menu')
  const [settingsName, setSettingsName] = useState(groupName)
  const [settingsDescription, setSettingsDescription] = useState(groupDescription ?? '')
  const [savingSettings, setSavingSettings] = useState(false)

  const handleClose = () => {
    setMessage(null)
    setView('menu')
    setSettingsName(groupName)
    setSettingsDescription(groupDescription ?? '')
    onClose()
  }

  const goBack = () => {
    setMessage(null)
    setView('menu')
  }

  const handleManageParticipants = () => {
    if (participants.length > 0) {
      setView('participants')
    } else {
      setMessage('No participants in this chat yet.')
    }
  }

  const handleGroupSettings = () => {
    setSettingsName(groupName)
    setSettingsDescription(groupDescription ?? '')
    setView('settings')
  }

  const handleSaveSettings = async () => {
    const name = settingsName.trim()
    if (!name) {
      setMessage('Name is required.')
      return
    }
    if (!onSaveGroupSettings) {
      setMessage('Group settings cannot be saved here.')
      return
    }
    setSavingSettings(true)
    setMessage(null)
    try {
      await onSaveGroupSettings({ name, description: settingsDescription.trim() })
      setMessage('Settings saved.')
      setView('menu')
    } catch {
      setMessage('Failed to save settings.')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleLeaveGroup = () => {
    if (!window.confirm('Leave this project chat? You can rejoin later.')) return
    onLeaveGroup?.()
    setMessage('You have left the group.')
    handleClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            role="presentation"
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0,0,0,0.25)' }}
            onClick={handleClose}
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
          <motion.aside
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-[280px] flex flex-col shadow-lg"
            style={{
              backgroundColor: current?.system?.foreground ?? '#fff',
              borderLeft: `1px solid ${borderColor ?? 'rgba(0,0,0,0.1)'}`,
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Group management"
          >
            <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b" style={{ borderColor: borderColor }}>
              {view !== 'menu' ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-2 py-1 pr-2 rounded-base opacity-80 hover:opacity-100"
                  style={{ color: dark }}
                  aria-label="Back"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <Text className="font-medium">
                    {view === 'participants' ? 'Participants' : 'Group settings'}
                  </Text>
                </button>
              ) : (
                <Text className="font-medium">Group options</Text>
              )}
              <button
                type="button"
                onClick={handleClose}
                className="p-3 rounded-base opacity-80 hover:opacity-100 flex items-center justify-center"
                style={{ color: dark }}
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            {message && (
              <div className="mx-2 mt-2 px-3 py-2 rounded-base text-sm" style={{ backgroundColor: bg, color: dark }}>
                {message}
              </div>
            )}
            <div className="p-2 flex-1 overflow-y-auto scroll-slim flex flex-col min-h-0">
              {view === 'menu' && (
                <nav className="flex flex-col gap-0">
                  <button
                    type="button"
                    onClick={handleManageParticipants}
                    className="w-full flex items-center gap-3 py-2.5 px-3 rounded-base text-left hover:opacity-90"
                    style={{ color: dark }}
                  >
                    <Users className="w-5 h-5 shrink-0 opacity-80" />
                    <span>Manage participants</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleGroupSettings}
                    className="w-full flex items-center gap-3 py-2.5 px-3 rounded-base text-left hover:opacity-90"
                    style={{ color: dark }}
                  >
                    <Settings className="w-5 h-5 shrink-0 opacity-80" />
                    <span>Group settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessage('Notifications muted for this group.')}
                    className="w-full flex items-center gap-3 py-2.5 px-3 rounded-base text-left hover:opacity-90"
                    style={{ color: dark }}
                  >
                    <BellOff className="w-5 h-5 shrink-0 opacity-80" />
                    <span>Mute notifications</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleLeaveGroup}
                    className="w-full flex items-center gap-3 py-2.5 px-3 rounded-base text-left hover:opacity-90"
                    style={{ color: current?.system?.error }}
                  >
                    <LogOut className="w-5 h-5 shrink-0 opacity-80" />
                    <span>Leave group</span>
                  </button>
                </nav>
              )}

              {view === 'participants' && (
                <ul className="list-none p-0 m-0 space-y-1">
                  {participants.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-base"
                      style={{ color: dark, backgroundColor: 'transparent' }}
                    >
                      <Avatar src={p.avatarUrl} name={p.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <Text className="font-medium truncate">{p.name}</Text>
                        {p.role && (
                          <Text variant="sm" className="opacity-70 capitalize">{p.role.replace('_', ' ')}</Text>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {view === 'settings' && (
                <div className="flex flex-col gap-4 pt-2">
                  <Input
                    label="Group name"
                    type="text"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    placeholder="Project chat name"
                  />
                  <div>
                    <label className="block text-sm font-medium mb-1 opacity-80" style={{ color: dark }}>
                      Description (optional)
                    </label>
                    <textarea
                      value={settingsDescription}
                      onChange={(e) => setSettingsDescription(e.target.value)}
                      placeholder="Brief description"
                      rows={3}
                      className="w-full px-3 py-2 rounded-base border resize-none focus:outline-none focus:ring-2"
                      style={{
                        color: dark,
                        backgroundColor: bg,
                        borderColor: borderColor ?? 'rgba(0,0,0,0.15)',
                      }}
                    />
                  </div>
                  <Button
                    label={savingSettings ? 'Saving…' : 'Save'}
                    onClick={handleSaveSettings}
                    disabled={savingSettings || !settingsName.trim()}
                  />
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
