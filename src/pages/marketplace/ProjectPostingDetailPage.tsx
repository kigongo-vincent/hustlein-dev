import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import Text, { baseFontSize } from '../../components/base/Text'
import View from '../../components/base/View'
import { Card, Button, Spinner } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import { marketplaceService } from '../../services/marketplaceService'
import type { ProjectPosting } from '../../types'
import { ArrowLeft, BriefcaseBusiness, Send } from 'lucide-react'

type LocationState = {
  posting?: ProjectPosting
}

const ProjectPostingDetailPage = () => {
  const { current } = Themestore()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as LocationState | null

  const [posting, setPosting] = useState<ProjectPosting | null>(state?.posting ?? null)
  const [loading, setLoading] = useState(!state?.posting)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (state?.posting || !id) return
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const p = await marketplaceService.getPosting(id)
        if (!cancelled) setPosting(p)
      } catch {
        if (!cancelled) {
          setError('Unable to load this posting right now.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [id, state?.posting])

  const created = posting?.createdAt ? new Date(posting.createdAt) : null

  return (
    <div className="w-full mx-auto space-y-4">
      <View bg="fg" className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-transparent hover:border-[var(--border-subtle)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span
                  className="w-9 h-9 rounded-base flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${current?.accent?.purple ?? current?.brand?.secondary ?? '#FF9600'} 0%, ${current?.accent?.blue ?? current?.brand?.primary ?? '#682308'} 100%)`,
                    boxShadow: '0 8px 22px rgba(0,0,0,0.12)',
                  }}
                >
                  <BriefcaseBusiness className="w-5 h-5" style={{ color: current?.brand?.onPrimary ?? '#fff' }} />
                </span>
                <div>
                  <Text className="font-medium">Project details</Text>
                  <Text variant="sm" className="opacity-80">
                    A closer look at this role, budget, and expectations.
                  </Text>
                </div>
              </div>
            </div>
          </div>
          {posting && (
            <Button
              size="sm"
              variant="background"
              label="Apply"
              startIcon={<Send className="w-4 h-4 shrink-0" />}
              onClick={() => navigate('/app/marketplace', { state: { applyToId: posting.id } })}
              disabled={posting.status !== 'open'}
            />
          )}
        </div>
      </View>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)] gap-4">
        <Card className="p-5 space-y-4">
          {loading && (
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              <Text variant="sm" className="opacity-70">
                Loading project…
              </Text>
            </div>
          )}
          {error && !loading && (
            <Text variant="sm" className="opacity-80">
              {error}
            </Text>
          )}
          {posting && !loading && (
            <>
              <div className="space-y-1">
                <Text className="font-semibold" style={{ fontSize: baseFontSize * 1.15 }}>
                  {posting.title}
                </Text>
                {created && (
                  <Text variant="xs" className="opacity-70">
                    Posted{' '}
                    {created.toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                )}
              </div>

              <div className="space-y-1">
                <Text variant="sm" className="font-medium">
                  Project overview
                </Text>
                <Text variant="sm" className="opacity-80 whitespace-pre-line">
                  {posting.description || 'No description provided.'}
                </Text>
              </div>

              {posting.requiredSkills && posting.requiredSkills.length > 0 && (
                <div className="space-y-1">
                  <Text variant="sm" className="font-medium">
                    Skills and experience
                  </Text>
                  <div className="flex flex-wrap gap-1.5">
                    {posting.requiredSkills.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-1 rounded-full text-[11px]"
                        style={{
                          background: `${current?.accent?.blue ?? current?.brand?.secondary ?? '#228BE6'}18`,
                          color: current?.system?.dark,
                          border: `1px solid ${(current?.accent?.blue ?? current?.brand?.secondary ?? '#228BE6')}33`,
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5 space-y-3">
            <Text variant="sm" className="font-medium">
              Budget & engagement model
            </Text>
            {posting ? (
              <div className="space-y-1">
                <Text variant="xs" className="uppercase tracking-wide opacity-70">
                  {posting.budgetType}
                </Text>
                <Text variant="sm" className="font-medium">
                  {posting.currency || 'UGX'}
                </Text>
                <Text variant="sm" className="opacity-80">
                  {/* simple label; card list already shows full breakdown */}
                  This project uses a {posting.budgetType} budget model.
                </Text>
              </div>
            ) : (
              <Text variant="sm" className="opacity-70">
                Budget details will appear here.
              </Text>
            )}
          </Card>

          <Card className="p-5 space-y-3">
            <Text variant="sm" className="font-medium">
              About the client
            </Text>
            <Text variant="sm" className="opacity-80">
              In the full version this section will show client history, spending, and hire rate across Hustle-in projects,
              similar to Upwork and LinkedIn company profiles.
            </Text>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ProjectPostingDetailPage

