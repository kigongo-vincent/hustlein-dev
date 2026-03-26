import { useEffect, useMemo, useRef, useState } from 'react'
import Text from '../../components/base/Text'
import View from '../../components/base/View'
import { Button, Card, Input, Modal, RichTextEditor } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import { marketplaceService } from '../../services'
import type { ApplicationStatus, ProjectApplication, ProjectPosting } from '../../types'
import { Trash2, FileText, Eye, RefreshCw, XCircle } from 'lucide-react'
import MarketplaceProjectCard from '../../components/marketplace/MarketplaceProjectCard'
import { notifyError, notifySuccess } from '../../data/NotificationStore'

function htmlToPlainText(html?: string): string {
  if (!html) return ''
  if (typeof DOMParser === 'undefined') return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const text = doc.body?.textContent ?? ''
    return text.replace(/\s+/g, ' ').trim()
  } catch {
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  }
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/** Map non-ISO codes stored in DB to ISO 4217 for Intl (e.g. KSH → KES). */
function normalizeCurrencyForIntl(code: string): string {
  const u = (code || 'UGX').trim().toUpperCase() || 'UGX'
  const aliases: Record<string, string> = { KSH: 'KES', SH: 'KES' }
  return aliases[u] ?? u
}

function formatMoney(value?: number, currency = 'UGX') {
  if (value == null || Number.isNaN(value)) return '—'
  const iso = normalizeCurrencyForIntl(currency || 'UGX')
  const displayCode = (currency || 'UGX').trim().toUpperCase() || 'UGX'
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: iso,
      currencyDisplay: 'code',
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${displayCode} ${Math.round(Number(value)).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
  }
}

const MyApplicationsPage = () => {
  const { current } = Themestore()
  const dark = current?.system?.dark

  const [loading, setLoading] = useState(true)
  const [apps, setApps] = useState<ProjectApplication[]>([])
  const [postingsById, setPostingsById] = useState<Record<string, ProjectPosting>>({})
  const [saving, setSaving] = useState(false)

  const refreshApps = async (shouldIgnore: () => boolean = () => false) => {
    setLoading(true)
    try {
      const list = await marketplaceService.listMyApplications()
      if (shouldIgnore()) return
      setApps(list)

      const uniquePostingIds = [...new Set(list.map((a) => a.postingId))]
      const results = await Promise.all(uniquePostingIds.map((id) => marketplaceService.getPosting(id)))
      const map: Record<string, ProjectPosting> = {}
      results.forEach((p) => {
        if (p) map[p.id] = p
      })
      if (!shouldIgnore()) setPostingsById(map)
    } catch {
      if (!shouldIgnore()) {
        setApps([])
        setPostingsById({})
      }
    } finally {
      if (!shouldIgnore()) setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    refreshApps(() => cancelled)
    return () => {
      cancelled = true
    }
  }, [])

  const skillColors = useMemo(() => {
    const a = current?.accent
    return [a?.blue, a?.purple, a?.pink, a?.green, a?.yellow, a?.teal].filter(Boolean) as string[]
  }, [current?.accent])

  const withdraw = async (a: ProjectApplication) => {
    setSaving(true)
    try {
      const updated = await marketplaceService.updateApplicationStatus(a.id, 'withdrawn')
      setApps((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
    } finally {
      setSaving(false)
    }
  }

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsApp, setDetailsApp] = useState<ProjectApplication | null>(null)

  const openDetails = (a: ProjectApplication) => {
    setDetailsApp(a)
    setDetailsOpen(true)
  }

  const [reapplyOpen, setReapplyOpen] = useState(false)
  const [reapplyPostingId, setReapplyPostingId] = useState<string | null>(null)
  const [applyCoverLetter, setApplyCoverLetter] = useState('')
  const [applyProposedHourly, setApplyProposedHourly] = useState('')
  const [applyProposedFixed, setApplyProposedFixed] = useState('')
  const [applyAttachments, setApplyAttachments] = useState<File[]>([])
  const applyAttachmentInputRef = useRef<HTMLInputElement>(null)

  const openReapply = (a: ProjectApplication) => {
    setReapplyPostingId(a.postingId)
    setApplyCoverLetter(a.coverLetter ?? '')
    setApplyProposedHourly(a.proposedHourlyRate != null ? String(a.proposedHourlyRate) : '')
    setApplyProposedFixed(a.proposedFixed != null ? String(a.proposedFixed) : '')
    setApplyAttachments([])
    setReapplyOpen(true)
  }

  const submitReapply = async () => {
    if (!reapplyPostingId) return
    setSaving(true)
    try {
      const created = await marketplaceService.apply(reapplyPostingId, {
        coverLetter: applyCoverLetter,
        proposedHourlyRate: applyProposedHourly ? Number(applyProposedHourly) : undefined,
        proposedFixed: applyProposedFixed ? Number(applyProposedFixed) : undefined,
      })

      if (applyAttachments.length > 0) {
        const uploadResults = await Promise.allSettled(
          applyAttachments.map((file) => marketplaceService.uploadApplicationFile(created.id, file)),
        )
        const failedUploads = uploadResults.filter((r) => r.status === 'rejected').length
        if (failedUploads > 0) {
          notifyError(
            failedUploads === 1
              ? 'Application submitted, but 1 file failed to upload.'
              : `Application submitted, but ${failedUploads} files failed to upload.`,
          )
        } else {
          notifySuccess('Re-application submitted.')
        }
      } else {
        notifySuccess('Re-application submitted.')
      }

      setReapplyOpen(false)
      setApplyAttachments([])
      setReapplyPostingId(null)
      setApplyCoverLetter('')
      setApplyProposedHourly('')
      setApplyProposedFixed('')
      await refreshApps()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to re-apply.'
      if (msg.toLowerCase().includes('already applied')) {
        notifyError('You already have an active application for this posting.')
        await refreshApps()
      } else {
        notifyError(msg)
      }
    } finally {
      setSaving(false)
    }
  }

  const closeDetails = () => {
    setDetailsOpen(false)
    setDetailsApp(null)
  }

  const closeReapply = () => {
    setReapplyOpen(false)
    setReapplyPostingId(null)
    setApplyCoverLetter('')
    setApplyProposedHourly('')
    setApplyProposedFixed('')
    setApplyAttachments([])
  }

  const [activeTab, setActiveTab] = useState<'all' | ApplicationStatus>('all')

  const appCounts = useMemo(() => {
    return {
      all: apps.length,
      applied: apps.filter((a) => a.status === 'applied').length,
      shortlisted: apps.filter((a) => a.status === 'shortlisted').length,
      rejected: apps.filter((a) => a.status === 'rejected').length,
      withdrawn: apps.filter((a) => a.status === 'withdrawn').length,
      hired: apps.filter((a) => a.status === 'hired').length,
    }
  }, [apps])

  const tabs = useMemo(() => {
    return [
      { id: 'all' as const, label: 'All' },
      { id: 'applied' as const, label: 'Applied' },
      { id: 'shortlisted' as const, label: 'Shortlisted' },
      { id: 'hired' as const, label: 'Hired' },
      { id: 'rejected' as const, label: 'Rejected' },
      { id: 'withdrawn' as const, label: 'Withdrawn' },
    ]
  }, [])

  const appsSorted = useMemo(() => {
    return [...apps].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [apps])

  const filteredApps = useMemo(() => {
    if (activeTab === 'all') return appsSorted
    return appsSorted.filter((a) => a.status === activeTab)
  }, [activeTab, appsSorted])

  const statusEmptyText = useMemo(() => {
    if (activeTab === 'all') return 'You haven’t applied to anything yet.'
    const tab = tabs.find((t) => t.id === activeTab)
    return `No ${tab?.label.toLowerCase() ?? 'applications'} found.`
  }, [activeTab, tabs])

  const detailsPosting = detailsApp ? postingsById[detailsApp.postingId] ?? null : null
  const reapplyPosting = reapplyPostingId ? postingsById[reapplyPostingId] ?? null : null

  return (
    <div className="w-full mx-auto space-y-4">
      <View bg="bg" className="p-3">
        <div className="space-y-3">
          <div className="space-y-0.5">
            <Text className="font-semibold" style={{ fontSize: 18 }}>
              My applications
            </Text>
            <Text variant="sm" className="opacity-80">
              Track your applications and withdraw if needed.
            </Text>
          </div>

          <div
            role="tablist"
            aria-label="Application status"
            className="flex flex-wrap gap-2 pb-2 border-b"
            style={{ borderColor: current?.system?.border ?? 'rgba(0,0,0,0.06)' }}
          >
            {tabs.map((t) => {
              const count =
                t.id === 'all'
                  ? appCounts.all
                  : t.id === 'applied'
                    ? appCounts.applied
                    : t.id === 'shortlisted'
                      ? appCounts.shortlisted
                      : t.id === 'hired'
                        ? appCounts.hired
                        : t.id === 'rejected'
                          ? appCounts.rejected
                          : appCounts.withdrawn
              const active = activeTab === t.id
              const primary = current?.brand?.primary ?? '#682308'
              const bg = active ? `${primary}14` : 'transparent'
              const color = active ? primary : (current?.system?.dark ?? dark)

              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(t.id)}
                  className="px-3 py-2 rounded-md text-[13px] font-medium transition-opacity whitespace-nowrap"
                  style={{
                    backgroundColor: bg,
                    color,
                    opacity: active ? 1 : 0.7,
                  }}
                  aria-label={`Show ${t.label} applications`}
                >
                  {t.label}
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                    style={{
                      marginLeft: 8,
                      backgroundColor: active ? `${primary}22` : (current?.system?.background ?? 'rgba(0,0,0,0.04)'),
                      opacity: active ? 1 : 0.75,
                      color: active ? primary : color,
                    }}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </View>

      <Card title="" subtitle="" className="p-0 overflow-hidden" noShadow>
        {loading ? (
          <div className="p-6">
            <Text variant="sm" className="opacity-70">
              Loading…
            </Text>
          </div>
        ) : apps.length === 0 ? (
          <div className="p-8 text-center">
            <Text variant="sm" className="opacity-80">
              {statusEmptyText}
            </Text>
          </div>
        ) : (
          <div className="p-3">
            {filteredApps.length === 0 ? (
              <div className="p-8 text-center">
                <Text variant="sm" className="opacity-80">
                  {statusEmptyText}
                </Text>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredApps.map((a) => {
                  const posting = postingsById[a.postingId]
                  const canWithdraw = a.status === 'applied' || a.status === 'shortlisted'
                  const canReapply = a.status === 'withdrawn' && posting?.status === 'open'
                  if (!posting) return null

                  return (
                    <div key={a.id} className="space-y-3">
                      <MarketplaceProjectCard
                        posting={posting}
                        company={null}
                        isFreelancer
                        theme={current}
                        skillColors={skillColors}
                        variant="default"
                        viewerUser={null}
                        viewerIsCompanyAdmin={false}
                        secondaryActionOverride={{
                          label: 'View details',
                          tone: 'primary',
                          icon: <Eye className="w-4 h-4 shrink-0" />,
                          onClick: () => openDetails(a),
                          disabled: saving,
                        }}
                        actionOverride={{
                          label: a.status === 'withdrawn' ? 'Reapply' : 'Withdraw',
                          tone: a.status === 'withdrawn' ? 'primary' : 'danger',
                          icon: a.status === 'withdrawn'
                            ? <RefreshCw className="w-4 h-4 shrink-0" />
                            : <Trash2 className="w-4 h-4 shrink-0" />,
                          onClick: () => {
                            if (a.status === 'withdrawn') openReapply(a)
                            else withdraw(a)
                          },
                          disabled:
                            saving ||
                            (a.status === 'withdrawn'
                              ? !canReapply
                              : a.status === 'applied' || a.status === 'shortlisted'
                                ? !canWithdraw
                                : true),
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal
        open={detailsOpen}
        onClose={closeDetails}
        variant="wide"
      >
        {detailsApp ? (
          <div className="p-7 space-y-5">
            <div>
              <Text className="font-semibold" style={{ fontSize: 18 }}>
                Application details
              </Text>
              {detailsPosting && (
                <Text variant="sm" className="mt-1" style={{ opacity: 0.45 }}>
                  {detailsPosting.title}
                </Text>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 justify-between">
              <Text variant="sm" style={{ opacity: 0.7 }}>
                Applied {formatDate(detailsApp.createdAt)}
              </Text>

              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{
                  background:
                    detailsApp.status === 'shortlisted'
                      ? `${current?.accent?.green ?? '#12B886'}18`
                      : detailsApp.status === 'rejected'
                        ? `${current?.system?.error ?? '#e03131'}14`
                        : detailsApp.status === 'hired'
                          ? `${current?.accent?.blue ?? '#228BE6'}18`
                          : detailsApp.status === 'withdrawn'
                            ? `${current?.system?.border ?? 'rgba(0,0,0,0.06)'}22`
                            : `${current?.brand?.primary ?? '#682308'}12`,
                  color:
                    detailsApp.status === 'shortlisted'
                      ? current?.accent?.green ?? '#12B886'
                      : detailsApp.status === 'rejected'
                        ? current?.system?.error ?? '#e03131'
                        : detailsApp.status === 'hired'
                          ? current?.accent?.blue ?? '#228BE6'
                          : detailsApp.status === 'withdrawn'
                            ? current?.system?.dark ?? '#000'
                            : current?.brand?.primary ?? '#682308',
                }}
              >
                {detailsApp.status.charAt(0).toUpperCase() + detailsApp.status.slice(1)}
              </span>
            </div>

            <div
              className="rounded-base p-4"
              style={{ background: current?.system?.background ?? 'rgba(0,0,0,0.04)' }}
            >
              <Text
                variant="sm"
                className="opacity-80 whitespace-pre-wrap"
                style={{ lineHeight: 1.7 }}
              >
                {htmlToPlainText(detailsApp.coverLetter) || '—'}
              </Text>
            </div>

            {(detailsApp.proposedHourlyRate != null || detailsApp.proposedFixed != null) && (
              <div className="flex flex-wrap items-center gap-3">
                {detailsApp.proposedHourlyRate != null && (
                  <Text variant="sm" className="opacity-75">
                    Proposed: {formatMoney(detailsApp.proposedHourlyRate, detailsApp.currency)} / hr
                  </Text>
                )}
                {detailsApp.proposedFixed != null && (
                  <Text variant="sm" className="opacity-75">
                    Proposed: {formatMoney(detailsApp.proposedFixed, detailsApp.currency)}
                  </Text>
                )}
              </div>
            )}

            {detailsApp.attachments && detailsApp.attachments.length > 0 ? (
              <div className="space-y-2">
                <Text variant="sm" className="opacity-60">
                  Attachments
                </Text>
                <div className="flex flex-wrap gap-2">
                  {detailsApp.attachments.map((att) => (
                    <a
                      key={att.id}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-medium transition-opacity hover:opacity-90"
                      style={{
                        background: current?.system?.background ?? 'rgba(0,0,0,0.04)',
                        color: current?.system?.dark,
                      }}
                    >
                      <FileText className="w-4 h-4 shrink-0" style={{ opacity: 0.7 }} />
                      <span className="truncate max-w-[180px]">{att.name}</span>
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <Text variant="sm" className="opacity-55">
                No attachments.
              </Text>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button label="Close" variant="background" onClick={closeDetails} disabled={saving} />
            </div>
          </div>
        ) : (
          <div className="p-7">
            <Text variant="sm" className="opacity-70">
              Loading…
            </Text>
          </div>
        )}
      </Modal>

      <Modal
        open={reapplyOpen}
        onClose={closeReapply}
        variant="wide"
      >
        <div className="p-7 space-y-5">
          <div>
            <Text className="font-semibold" style={{ fontSize: 18 }}>
              Re-apply to project
            </Text>
            {reapplyPosting && (
              <Text variant="sm" className="mt-1" style={{ opacity: 0.45 }}>
                {reapplyPosting.title}
              </Text>
            )}
          </div>

          <RichTextEditor
            label="Cover letter"
            placeholder="Tell them why you're a great fit… Add links (GitHub, LinkedIn, portfolio) if helpful."
            value={applyCoverLetter}
            onChange={(html) => setApplyCoverLetter(html)}
            minHeight="220px"
            toolbarPreset="full"
            mode="fill"
            borderless
            enableMentions
          />

          <div className="space-y-2">
            <Text variant="sm" style={{ opacity: 0.55 }}>
              Attach documents (CV / Resume)
            </Text>
            <input
              ref={applyAttachmentInputRef}
              type="file"
              className="hidden"
              multiple
              accept="application/pdf,.pdf,application/msword,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,text/plain,.txt"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? [])
                setApplyAttachments(files)
                e.target.value = ''
              }}
              aria-hidden
            />
            <div className="flex items-center gap-3 flex-wrap">
              <Button
                label={applyAttachments.length ? 'Replace files' : 'Add files'}
                size="sm"
                variant="background"
                startIcon={<FileText className="w-4 h-4 shrink-0" />}
                onClick={() => applyAttachmentInputRef.current?.click()}
                disabled={saving}
              />
              {applyAttachments.length > 0 && (
                <Text variant="sm" style={{ opacity: 0.45 }}>
                  {applyAttachments.length} selected
                </Text>
              )}
            </div>

            {applyAttachments.length > 0 && (
              <div className="space-y-2">
                {applyAttachments.map((f, i) => (
                  <div
                    key={`${f.name}_${f.size}_${i}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-base"
                    style={{ background: current?.system?.background ?? 'rgba(0,0,0,0.04)' }}
                  >
                    <FileText className="w-4 h-4 shrink-0" style={{ color: current?.system?.dark ?? undefined, opacity: 0.7 }} />
                    <Text variant="sm" className="truncate flex-1" style={{ opacity: 0.75 }}>
                      {f.name}
                    </Text>
                    <button
                      type="button"
                      onClick={() => setApplyAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      className="shrink-0 p-1 rounded-base opacity-70 hover:opacity-100 transition-opacity"
                      style={{ color: current?.system?.dark ?? undefined }}
                      aria-label="Remove attachment"
                      disabled={saving}
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Proposed hourly rate"
              value={applyProposedHourly}
              onChange={(e) => setApplyProposedHourly(e.target.value)}
            />
            <Input
              label="Proposed fixed budget"
              value={applyProposedFixed}
              onChange={(e) => setApplyProposedFixed(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              label="Cancel"
              variant="background"
              onClick={closeReapply}
              disabled={saving}
            />
            <Button
              label="Re-apply"
              startIcon={<RefreshCw className="w-4 h-4 shrink-0" />}
              onClick={submitReapply}
              disabled={saving || !reapplyPostingId}
            />
          </div>
        </div>
      </Modal>

    </div>
  )
}

export default MyApplicationsPage

