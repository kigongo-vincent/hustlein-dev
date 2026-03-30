import { Fragment, useState, type ReactNode } from 'react'
import Text, { baseFontSize, minFontSize } from '../base/Text'
import type { Company, ProjectPosting, User } from '../../types'
import { htmlToPlainPreview } from '../../utils/richText'
import { postingBudgetLineParts } from '../../utils/marketplaceBudget'
import type { ThemeI } from '../../data/Themestore'

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

function formatPostingDate(dateStr: string) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function domainFromEmail(email?: string) {
  if (!email) return '—'
  const parts = email.split('@')
  if (parts.length < 2) return '—'
  return parts[1]
}

/** Soft spotlight window for open marketplace listings only (browse UI). */
const MARKETPLACE_LISTING_WINDOW_DAYS = 30

function listingSpotlightDaysLeft(createdAt: string): number {
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return MARKETPLACE_LISTING_WINDOW_DAYS
  const elapsedDays = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24))
  return Math.max(0, MARKETPLACE_LISTING_WINDOW_DAYS - elapsedDays)
}

/** Calendar-day difference from local today to due date (ISO date string). */
function calendarDaysFromTodayTo(isoDate: string): number {
  const target = new Date(isoDate)
  if (Number.isNaN(target.getTime())) return 0
  const t0 = new Date()
  t0.setHours(0, 0, 0, 0)
  const t1 = new Date(target)
  t1.setHours(0, 0, 0, 0)
  return Math.round((t1.getTime() - t0.getTime()) / 86400000)
}

export type MarketplaceCardSpotlight =
  /** Default on marketplace browse: synthetic window from listing `createdAt`. */
  | { mode: 'listing_window' }
  /** Project / application deadline from API (`Project.dueDate`). */
  | { mode: 'due_date'; iso: string }
  | { mode: 'hidden' }

/** Resolve relative upload paths (e.g. /uploads/...) when VITE_API_URL is an absolute API base. */
function resolvePublicAssetUrl(url?: string | null): string | undefined {
  const s = url?.trim()
  if (!s) return undefined
  if (/^https?:\/\//i.test(s)) return s
  const base = import.meta.env.VITE_API_URL as string | undefined
  if (s.startsWith('/') && base?.startsWith('http')) {
    const origin = base.replace(/\/api\/?$/i, '')
    return `${origin}${s}`
  }
  return s
}

function budgetLines(p: ProjectPosting): string[] {
  return postingBudgetLineParts(p, formatMoney)
}

export type MarketplaceProjectCardActionTone = 'primary' | 'danger'

export type MarketplaceProjectCardActionOverride = {
  label: string
  onClick: () => void
  icon?: ReactNode
  disabled?: boolean
  tone?: MarketplaceProjectCardActionTone
}

export type MarketplaceProjectCardProps = {
  posting: ProjectPosting
  company: Company | null
  isFreelancer: boolean
  theme: ThemeI
  skillColors: string[]
  variant?: 'featured' | 'default'
  viewerUser: User | null
  viewerIsCompanyAdmin: boolean
  onApply?: () => void
  onManageApplications?: () => void
  actionOverride?: MarketplaceProjectCardActionOverride
  secondaryActionOverride?: MarketplaceProjectCardActionOverride
  onCardClick?: () => void
  /** Card surface: default matches list cards (foreground); use `background` for page-tinted grids (e.g. assigned projects). */
  cardSurface?: 'foreground' | 'background'
  /**
   * Top-right badge: default `listing_window` for job board.
   * Use `due_date` with real `Project.dueDate` on assigned work; `hidden` when no deadline.
   */
  spotlight?: MarketplaceCardSpotlight
  /** When false, hides Apply / Manage / override buttons; opening still uses `onCardClick` if set. */
  showFooterActions?: boolean
}

const MarketplaceProjectCard = ({
  posting: p,
  company,
  isFreelancer,
  theme,
  skillColors,
  variant = 'default',
  viewerUser: _viewerUser,
  viewerIsCompanyAdmin: _viewerIsCompanyAdmin,
  onApply,
  onManageApplications,
  actionOverride,
  secondaryActionOverride,
  onCardClick,
  cardSurface = 'foreground',
  spotlight,
  showFooterActions = true,
}: MarketplaceProjectCardProps) => {
  const [primaryHover, setPrimaryHover] = useState(false)
  const [secondaryHover, setSecondaryHover] = useState(false)

  const borderColor = theme.system.border ?? 'rgba(0,0,0,0.06)'
  const pad = variant === 'featured' ? 'p-7' : 'p-6'
  const displayName = (company?.name ?? p.companyName ?? '').trim() || 'Company'
  const logoSrc = resolvePublicAssetUrl(company?.logoUrl ?? p.companyLogoUrl ?? undefined)
  const accent = theme.brand.secondary ?? '#FF9600'
  const initial = displayName.trim().slice(0, 1).toUpperCase() || 'C'
  const domain = domainFromEmail(company?.email)
  const postedDate = formatPostingDate(p.createdAt)

  const currencyCode = (p.currency || 'UGX').trim().toUpperCase() || 'UGX'

  const defaultActionDisabled = isFreelancer ? p.status !== 'open' : false
  const actionDisabled = actionOverride ? (actionOverride.disabled ?? false) : defaultActionDisabled

  const basePrimary = theme.brand.primary ?? '#682308'
  const errorColor = theme.system.error ?? '#e03131'
  const primary = actionOverride?.tone === 'danger' ? errorColor : basePrimary
  const onPrimary = theme.brand.onPrimary ?? '#ffffff'

  const actionPrimary = primaryHover && !actionDisabled

  const actionLabel = actionOverride
    ? actionOverride.label
    : isFreelancer
      ? 'Apply now'
      : 'Manage applications'

  const actionIcon = actionOverride?.icon

  const actionAriaLabel =
    actionOverride?.label ??
    (isFreelancer ? 'Apply now' : 'Manage applications')

  const actionClick = actionOverride
    ? actionOverride.onClick
    : () => {
      if (isFreelancer) onApply?.()
      else onManageApplications?.()
    }

  const secondaryLabel = secondaryActionOverride?.label ?? ''
  const secondaryIcon = secondaryActionOverride?.icon
  const secondaryDisabled = secondaryActionOverride?.disabled ?? false
  const secondaryTone = secondaryActionOverride?.tone ?? 'primary'
  const secondaryPrimary = secondaryTone === 'danger' ? errorColor : basePrimary
  const secondaryOnPrimary = theme.brand.onPrimary ?? '#ffffff'
  const secondaryBgPrimary = secondaryHover && !secondaryDisabled
  const secondaryClick = secondaryActionOverride?.onClick ?? (() => undefined)

  const logoBoxH = variant === 'featured' ? 56 : 48
  const logoMaxW = variant === 'featured' ? 200 : 168

  const green = theme.accent?.green ?? '#12B886'
  const spotlightMode: MarketplaceCardSpotlight = spotlight ?? { mode: 'listing_window' }

  let badgeLabel: string | null = null
  let badgeTone: 'success' | 'warning' | 'danger' = 'success'

  if (spotlightMode.mode === 'hidden') {
    badgeLabel = null
  } else if (spotlightMode.mode === 'due_date') {
    const d = calendarDaysFromTodayTo(spotlightMode.iso)
    if (d < 0) {
      badgeLabel = `${-d} day${-d === 1 ? '' : 's'} overdue`
      badgeTone = 'danger'
    } else if (d === 0) {
      badgeLabel = 'Due today'
      badgeTone = 'warning'
    } else {
      badgeLabel = `${d} day${d === 1 ? '' : 's'} to deadline`
      badgeTone = d > 7 ? 'success' : 'warning'
    }
  } else {
    const spotlightLeft = listingSpotlightDaysLeft(p.createdAt)
    const remainingDays = spotlightLeft === 0 ? 1 : spotlightLeft
    badgeLabel = `${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining`
    badgeTone = spotlightLeft >= 3 ? 'success' : 'warning'
  }

  const badgeColor =
    badgeTone === 'danger' ? errorColor : badgeTone === 'warning' ? (theme.accent?.yellow ?? '#FAB005') : green
  const badgeBgAlpha = badgeTone === 'success' ? '22' : badgeTone === 'warning' ? '1e' : '18'

  const cardBg = cardSurface === 'background' ? theme.system.background : theme.system.foreground

  return (
    <div
      className={`rounded-base shadow-custom ${pad} ${onCardClick ? 'cursor-pointer' : ''}`}
      style={{ background: cardBg, color: theme.system.dark }}
      onClick={onCardClick}
      role={onCardClick ? 'button' : undefined}
      tabIndex={onCardClick ? 0 : undefined}
      onKeyDown={onCardClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onCardClick()
        }
      } : undefined}
    >
      <div className="flex flex-col gap-4 min-w-0">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex flex-col gap-0">
            <div className="flex justify-start">
              {logoSrc ? (
                <div
                  className="shrink-0 rounded-base overflow-hidden flex items-center justify-center"
                  style={{ background: 'transparent', height: logoBoxH, maxWidth: logoMaxW }}
                >
                  <img
                    src={logoSrc}
                    alt={`${displayName} logo`}
                    className="block object-contain object-center"
                    style={{ maxHeight: logoBoxH, maxWidth: logoMaxW, width: 'auto', height: 'auto' }}
                  />
                </div>
              ) : (
                <div
                  className="w-12 h-12 rounded-base overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: `${accent}18` }}
                >
                  <span
                    className="font-semibold leading-none"
                    style={{ fontSize: baseFontSize * 1.35, color: accent }}
                  >
                    {initial}
                  </span>
                </div>
              )}
            </div>

            <div className="min-w-0 mt-3">
              <div className="font-semibold leading-tight" style={{ fontSize: baseFontSize }}>
                {displayName}
              </div>
              <div
                className="font-normal leading-snug"
                style={{ fontSize: Math.max(11, baseFontSize * 0.78), opacity: 0.5, marginTop: 2 }}
              >
                {domain !== '—' ? `${domain} • ${postedDate}` : postedDate}
              </div>
            </div>
          </div>

          {badgeLabel ? (
            <Text
              variant="sm"
              className="shrink-0 rounded-full font-normal tracking-wide px-6 py-2 ml-auto inline-flex"
              style={{ background: `${badgeColor}${badgeBgAlpha}`, color: badgeColor }}
            >
              {badgeLabel}
            </Text>
          ) : null}
        </div>

        <Text className="font-semibold leading-snug" style={{ fontSize: baseFontSize * 1.15 }}>
          {p.title}
        </Text>

        <Text className="leading-[1.75] whitespace-pre-wrap" style={{ fontSize: baseFontSize, opacity: 0.88 }}>
          {p.description?.trim() ? htmlToPlainPreview(p.description, 320) : '—'}
        </Text>

        <div style={{ height: 1, background: borderColor }} />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0 flex flex-1 flex-wrap items-center gap-x-4 gap-y-2">
            {p.requiredSkills && p.requiredSkills.length > 0 ? (
              <div className="min-w-0 flex flex-wrap gap-2">
                {p.requiredSkills.map((s) => {
                  const idx =
                    Math.abs(s.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % Math.max(1, skillColors.length)
                  const c = skillColors[idx] ?? theme.brand.secondary ?? '#FF9600'
                  return (
                    <span
                      key={s}
                      className="px-3 py-1 rounded-full font-medium"
                      style={{
                        fontSize: Math.max(minFontSize, baseFontSize * 0.8),
                        background: `${c}18`,
                        color: c,
                      }}
                    >
                      {s}
                    </span>
                  )
                })}
              </div>
            ) : null}
            <span
              className="min-w-0 font-medium leading-snug inline-flex flex-wrap items-baseline gap-x-0"
              style={{ color: theme.system.dark, fontSize: baseFontSize }}
            >
              <span style={{ opacity: 0.52 }}>{currencyCode}</span>
              <span style={{ opacity: 0.4 }}>
                {'\u00a0'}·{'\u00a0'}
              </span>
              <span style={{ opacity: 0.52 }}>{p.budgetType}</span>
              <span style={{ opacity: 0.4 }}>
                {'\u00a0'}·{'\u00a0'}
              </span>
              {budgetLines(p).map((line, i) => (
                <Fragment key={i}>
                  {i > 0 ? (
                    <span style={{ opacity: 0.4 }}>
                      {'\u00a0'}·{'\u00a0'}
                    </span>
                  ) : null}
                  <span style={{ opacity: 0.92 }}>{line}</span>
                </Fragment>
              ))}
            </span>
          </div>

          {showFooterActions ? (
            <div className="flex items-center gap-2 shrink-0">
              {secondaryActionOverride ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    secondaryClick()
                  }}
                  disabled={secondaryDisabled}
                  onMouseEnter={() => setSecondaryHover(true)}
                  onMouseLeave={() => setSecondaryHover(false)}
                  className="px-4 py-2 flex items-center rounded-full font-medium border-0 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    fontSize: baseFontSize,
                    backgroundColor: secondaryBgPrimary ? secondaryPrimary : (theme.system.background ?? 'rgba(0,0,0,0.06)'),
                    color: secondaryBgPrimary ? secondaryOnPrimary : theme.system.dark,
                  }}
                  aria-label={secondaryLabel}
                >
                  <span className="inline-flex items-center gap-2 justify-center">
                    {secondaryIcon ? secondaryIcon : null}
                    {secondaryLabel}
                  </span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  actionClick()
                }}
                disabled={actionDisabled}
                onMouseEnter={() => setPrimaryHover(true)}
                onMouseLeave={() => setPrimaryHover(false)}
                className="px-4 py-2 flex items-center rounded-full font-medium border-0 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  fontSize: baseFontSize,
                  backgroundColor: actionPrimary ? primary : (theme.system.background ?? 'rgba(0,0,0,0.06)'),
                  color: actionPrimary ? onPrimary : theme.system.dark,
                }}
                aria-label={actionAriaLabel}
              >
                <span className="inline-flex items-center gap-2 justify-center">
                  {actionIcon ? actionIcon : null}
                  {actionLabel}
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default MarketplaceProjectCard

