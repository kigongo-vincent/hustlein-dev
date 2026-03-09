import { useEffect } from 'react'
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import Text, { baseFontSize } from '../base/Text'
import { Themestore } from '../../data/Themestore'
import { NotificationStore } from '../../data/NotificationStore'

function iconFor(variant: 'success' | 'error' | 'info') {
  if (variant === 'success') return CheckCircle2
  if (variant === 'error') return AlertTriangle
  return Info
}

export default function Toasts() {
  const { current } = Themestore()
  const notifications = NotificationStore((s) => s.notifications)
  const remove = NotificationStore((s) => s.remove)

  useEffect(() => {
    const timers = notifications
      .filter((n) => (n.ttlMs ?? 0) > 0)
      .map((n) => window.setTimeout(() => remove(n.id), n.ttlMs))
    return () => {
      timers.forEach((t) => window.clearTimeout(t))
    }
  }, [notifications, remove])

  const fg = current?.system?.foreground ?? '#fff'
  const border = current?.system?.border ?? 'rgba(0,0,0,0.12)'
  const dark = current?.system?.dark ?? '#111'
  const success = current?.system?.success ?? '#16a34a'
  const error = current?.system?.error ?? '#b91c1c'
  const info = current?.brand?.secondary ?? '#FF9600'

  if (!notifications.length) return null

  return (
    <div className="fixed right-4 top-4 z-[9999] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)]">
      {notifications.map((n) => {
        const Icon = iconFor(n.variant)
        const accent = n.variant === 'success' ? success : n.variant === 'error' ? error : info
        return (
          <div
            key={n.id}
            className="rounded-base shadow-lg border p-3 flex gap-3 items-start"
            style={{
              backgroundColor: fg,
              borderColor: border,
              borderLeftWidth: 4,
              borderLeftColor: accent,
            }}
            role="status"
            aria-live="polite"
          >
            <div
              className="shrink-0 w-9 h-9 rounded-base flex items-center justify-center"
              style={{ backgroundColor: `${accent}18`, color: accent }}
              aria-hidden
            >
              <Icon className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <Text className="font-medium" style={{ color: dark, fontSize: baseFontSize }}>
                {n.title}
              </Text>
              {n.message && (
                <Text variant="sm" className="opacity-80 mt-0.5" style={{ color: dark }}>
                  {n.message}
                </Text>
              )}
            </div>
            <button
              type="button"
              className="shrink-0 p-1 rounded-base opacity-70 hover:opacity-100"
              onClick={() => remove(n.id)}
              aria-label="Dismiss"
              style={{ color: dark }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

