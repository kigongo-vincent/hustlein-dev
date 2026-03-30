import type { ProjectPosting } from '../types'

/** Max of hourly and fixed bands (min=max counts as one amount). */
export function postingBudgetMax(
  p: Pick<ProjectPosting, 'hourlyMin' | 'hourlyMax' | 'fixedMin' | 'fixedMax'>,
): number {
  const hourly = Math.max(p.hourlyMax ?? 0, p.hourlyMin ?? 0)
  const fixed = Math.max(p.fixedMax ?? 0, p.fixedMin ?? 0)
  return Math.max(hourly, fixed)
}

type FormatMoney = (value?: number, currency?: string) => string

/**
 * Budget strings for cards — one figure per band. When min≠max (legacy data), shows the ceiling (max) only.
 */
export function postingBudgetLineParts(
  p: Pick<ProjectPosting, 'budgetType' | 'currency' | 'hourlyMin' | 'hourlyMax' | 'fixedMin' | 'fixedMax'>,
  formatMoney: FormatMoney,
): string[] {
  const cur = p.currency || 'UGX'
  const pair = (a?: number, b?: number, suffix = '') => {
    if (a == null && b == null) return `—${suffix}`
    const lo = a ?? b
    const hi = b ?? a
    if (lo == null || hi == null) return `${formatMoney(lo ?? hi, cur)}${suffix}`
    const single = lo === hi ? lo : Math.max(lo, hi)
    return `${formatMoney(single, cur)}${suffix}`
  }
  if (p.budgetType === 'hourly') return [pair(p.hourlyMin, p.hourlyMax, ' / hr')]
  if (p.budgetType === 'fixed') return [pair(p.fixedMin, p.fixedMax, '')]
  return [pair(p.hourlyMin, p.hourlyMax, ' / hr'), `${pair(p.fixedMin, p.fixedMax, '')} fixed`]
}

/** One-line summary for detail headers (joins hybrid with a bullet). */
export function postingBudgetSummary(
  p: Pick<ProjectPosting, 'budgetType' | 'currency' | 'hourlyMin' | 'hourlyMax' | 'fixedMin' | 'fixedMax'>,
  formatMoney: FormatMoney,
): string {
  return postingBudgetLineParts(p, formatMoney).join(' • ')
}
