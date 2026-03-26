import { useState, type ReactNode } from 'react'
import Text, { baseFontSize } from '../base/Text'
import Avatar from '../base/Avatar'
import type { Company, ProjectPosting, User, UserRole } from '../../types'
import type { ThemeI } from '../../data/Themestore'
import { Wallet } from 'lucide-react'

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

/** Soft spotlight window for “days left” on open listings (UI-only; not enforced by API). */
const MARKETPLACE_LISTING_WINDOW_DAYS = 30

function listingSpotlightDaysLeft(createdAt: string): number {
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return MARKETPLACE_LISTING_WINDOW_DAYS
  const elapsedDays = Math.floor((Date.now() - created) / (1000 * 60 * 60 * 24))
  return Math.max(0, MARKETPLACE_LISTING_WINDOW_DAYS - elapsedDays)
}

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
  const cur = p.currency || 'UGX'
  if (p.budgetType === 'hourly') return [`${formatMoney(p.hourlyMin, cur)} – ${formatMoney(p.hourlyMax, cur)} / hr`]
  if (p.budgetType === 'fixed') return [`${formatMoney(p.fixedMin, cur)} – ${formatMoney(p.fixedMax, cur)}`]
  return [
    `${formatMoney(p.hourlyMin, cur)} – ${formatMoney(p.hourlyMax, cur)} / hr`,
    `${formatMoney(p.fixedMin, cur)} – ${formatMoney(p.fixedMax, cur)} fixed`,
  ]
}

function formatMarketplaceRole(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    super_admin: 'Super admin',
    company_admin: 'Company admin',
    project_lead: 'Project lead',
    consultant: 'Consultant',
    freelancer: 'Freelancer',
  }
  return labels[role] ?? role
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
}

const MarketplaceProjectCard = ({
  posting: p,
  company,
  isFreelancer,
  theme,
  skillColors,
  variant = 'default',
  viewerUser,
  viewerIsCompanyAdmin,
  onApply,
  onManageApplications,
  actionOverride,
  secondaryActionOverride,
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
  const spotlightLeft = listingSpotlightDaysLeft(p.createdAt)
  const remainingDays = spotlightLeft === 0 ? 1 : spotlightLeft
  const badgeLabel = `${remainingDays} day${remainingDays === 1 ? '' : 's'} remaining`
  const badgeSuccess = spotlightLeft >= 3

  const created = p.createdAt ? new Date(p.createdAt) : null
  const updated = p.updatedAt ? new Date(p.updatedAt) : null

  return (
    <div className={`rounded-base shadow-custom ${pad}`} style={{ background: theme.system.foreground, color: theme.system.dark }}>
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
                  <span className="text-[17px] font-semibold leading-none" style={{ color: accent }}>
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

          {viewerIsCompanyAdmin && viewerUser ? (
            <div className="flex items-center gap-3 shrink-0">
              <Avatar size="md" name={viewerUser.name} src={resolvePublicAssetUrl(viewerUser.avatarUrl ?? undefined)} />
              <div className="min-w-0">
                <Text className="font-semibold leading-tight" style={{ color: theme.system.dark, opacity: 0.95, fontSize: baseFontSize * 1.2 }}>
                  {viewerUser.name}
                </Text>
                <Text variant="sm" className="leading-tight" style={{ color: theme.system.dark, opacity: 0.55 }}>
                  {viewerUser.role === 'company_admin' ? 'CEO' : formatMarketplaceRole(viewerUser.role)}
                </Text>
              </div>
            </div>
          ) : (
            <Text
              variant="sm"
              className="shrink-0 rounded-full font-normal tracking-wide px-6 py-2 ml-auto inline-flex"
              style={{ background: badgeSuccess ? `${green}22` : `${green}14`, color: green }}
            >
              {badgeLabel}
            </Text>
          )}
        </div>

        <span className="text-[11px] font-medium" style={{ opacity: 0.4 }}>
          Posted {postedDate}
          {updated && created && updated.getTime() !== created.getTime() ? ` · Updated ${formatPostingDate(p.updatedAt)}` : ''}
        </span>

        <Text className="font-semibold leading-snug" style={{ fontSize: baseFontSize * 1.15 }}>
          {p.title}
        </Text>

        <Text className="leading-[1.75] whitespace-pre-wrap" style={{ fontSize: baseFontSize, opacity: 0.88 }}>
          {p.description?.trim() || '—'}
        </Text>

        <div>
          <div className="flex items-center gap-4 p-4 rounded-base" style={{ background: theme.system.background ?? 'rgba(0,0,0,0.06)' }}>
            <div className="flex items-center justify-center w-10 h-10 rounded-full shrink-0" style={{ background: theme.system.foreground }}>
              <Wallet className="w-5 h-5" style={{ color: theme.system.dark, opacity: 0.7 }} />
            </div>
            <div className="min-w-0">
              <Text
                variant="sm"
                className="tracking-widest uppercase font-medium block mb-1"
                style={{ color: theme.system.dark, opacity: 0.5 }}
              >
                {currencyCode} · {p.budgetType} rate
              </Text>
              {budgetLines(p).map((line, li) => (
                <Text key={li} variant="sm" className="font-medium" style={{ opacity: 0.9 }}>
                  {line}
                </Text>
              ))}
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: borderColor }} />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          {p.requiredSkills && p.requiredSkills.length > 0 ? (
            <div className="min-w-0 flex flex-wrap gap-2">
              {p.requiredSkills.map((s) => {
                const idx =
                  Math.abs(s.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % Math.max(1, skillColors.length)
                const c = skillColors[idx] ?? theme.brand.secondary ?? '#FF9600'
                return (
                  <span key={s} className="px-3 py-1 rounded-full text-[11px] font-medium" style={{ background: `${c}18`, color: c }}>
                    {s}
                  </span>
                )
              })}
            </div>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 shrink-0">
            {secondaryActionOverride ? (
              <button
                type="button"
                onClick={secondaryClick}
                disabled={secondaryDisabled}
                onMouseEnter={() => setSecondaryHover(true)}
                onMouseLeave={() => setSecondaryHover(false)}
                className="px-5 py-2 rounded-full text-[13px] font-medium border-0 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed min-w-[160px]"
                style={{
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
              onClick={actionClick}
              disabled={actionDisabled}
              onMouseEnter={() => setPrimaryHover(true)}
              onMouseLeave={() => setPrimaryHover(false)}
              className="px-5 py-2 rounded-full text-[13px] font-medium border-0 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed min-w-[160px]"
              style={{
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
        </div>
      </div>
    </div>
  )
}

export default MarketplaceProjectCard

