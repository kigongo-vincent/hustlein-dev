import { useEffect, useMemo, useState } from 'react'
import Text from '../../components/base/Text'
import View from '../../components/base/View'
import { Card, Button } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import { marketplaceService } from '../../services'
import type { ProjectApplication, ProjectPosting } from '../../types'
import { Sparkles, Trash2 } from 'lucide-react'

function formatDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const MyApplicationsPage = () => {
  const { current } = Themestore()
  const dark = current?.system?.dark

  const [loading, setLoading] = useState(true)
  const [apps, setApps] = useState<ProjectApplication[]>([])
  const [postingsById, setPostingsById] = useState<Record<string, ProjectPosting>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const list = await marketplaceService.listMyApplications()
        if (cancelled) return
        setApps(list)

        const uniquePostingIds = [...new Set(list.map((a) => a.postingId))]
        const results = await Promise.all(uniquePostingIds.map((id) => marketplaceService.getPosting(id)))
        const map: Record<string, ProjectPosting> = {}
        results.forEach((p) => {
          if (p) map[p.id] = p
        })
        if (!cancelled) setPostingsById(map)
      } catch {
        if (!cancelled) {
          setApps([])
          setPostingsById({})
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const withdraw = async (a: ProjectApplication) => {
    setSaving(true)
    try {
      const updated = await marketplaceService.updateApplicationStatus(a.id, 'withdrawn')
      setApps((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
    } finally {
      setSaving(false)
    }
  }

  const stats = useMemo(() => {
    const total = apps.length
    const shortlisted = apps.filter((a) => a.status === 'shortlisted').length
    const hired = apps.filter((a) => a.status === 'hired').length
    return { total, shortlisted, hired }
  }, [apps])

  return (
    <div className="w-full mx-auto space-y-4">
      <View bg="bg" className="p-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span
                className="w-9 h-9 rounded-base flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${current?.accent?.pink ?? current?.brand?.secondary ?? '#FF9600'} 0%, ${current?.accent?.purple ?? current?.brand?.primary ?? '#682308'} 100%)`,
                  boxShadow: '0 8px 22px rgba(0,0,0,0.12)',
                }}
              >
                <Sparkles className="w-5 h-5" style={{ color: current?.brand?.onPrimary ?? '#fff' }} />
              </span>
              <Text className="font-medium">My applications</Text>
            </div>
            <Text variant="sm" className="opacity-80">
              Track your applications and withdraw if needed.
            </Text>
          </div>
          <div className="flex items-center gap-2 text-sm opacity-90" style={{ color: dark }}>
            <span>Total: {stats.total}</span>
            <span>Shortlisted: {stats.shortlisted}</span>
            <span>Hired: {stats.hired}</span>
          </div>
        </div>
      </View>

      <Card title="Applications" subtitle="Most recent first" className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6">
            <Text variant="sm" className="opacity-70">
              Loading…
            </Text>
          </div>
        ) : apps.length === 0 ? (
          <div className="p-8 text-center">
            <Text variant="sm" className="opacity-80">
              You haven’t applied to anything yet.
            </Text>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: current?.system?.border }}>
            {apps.map((a) => {
              const posting = postingsById[a.postingId]
              const canWithdraw = a.status === 'applied' || a.status === 'shortlisted'
              return (
                <div key={a.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <Text className="font-medium">
                      {posting?.title ?? `Posting ${a.postingId.slice(0, 8)}…`}
                    </Text>
                    <Text variant="sm" className="opacity-70 mt-0.5">
                      Applied {formatDate(a.createdAt)} • Status: <span className="font-medium">{a.status}</span>
                    </Text>
                    <Text variant="sm" className="opacity-80 mt-2 line-clamp-2">
                      {a.coverLetter || '—'}
                    </Text>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="secondary"
                      label="Withdraw"
                      startIcon={<Trash2 className="w-4 h-4 shrink-0" />}
                      onClick={() => withdraw(a)}
                      disabled={saving || !canWithdraw}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

export default MyApplicationsPage

