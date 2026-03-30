export interface Props {
  size?: 'sm' | 'md'
  className?: string
}

/** Indeterminate ring — Material / Android–style (hollow arc, not a filled box). */
const Spinner = ({ size = 'md', className = '' }: Props) => {
  const dim = size === 'sm' ? 16 : 32
  const stroke = size === 'sm' ? 2 : 2.5
  const r = dim / 2 - stroke / 2
  const c = 2 * Math.PI * r
  const arcLen = c * 0.28
  const gapLen = c - arcLen

  return (
    <svg
      width={dim}
      height={dim}
      viewBox={`0 0 ${dim} ${dim}`}
      className={`inline-block shrink-0 animate-spin text-current ${className}`.trim()}
      style={{
        animationDuration: '0.7s',
        animationTimingFunction: 'linear',
      }}
      role="status"
      aria-label="Loading"
    >
      <circle
        cx={dim / 2}
        cy={dim / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${arcLen} ${gapLen}`}
        transform={`rotate(-90 ${dim / 2} ${dim / 2})`}
      />
    </svg>
  )
}

export default Spinner
