import Text from '../../components/base/Text'
import { Button, CustomSelect } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import { X } from 'lucide-react'
import { SORT_OPTIONS } from './constants'

type LeadOption = { value: string; label: string }

type ProjectListFiltersProps = {
  open: boolean
  exiting: boolean
  entered: boolean
  onClose: () => void
  filterLeadId: string
  filterSort: string
  onFilterLeadChange: (v: string) => void
  onFilterSortChange: (v: string) => void
  onReset: () => void
  leadOptions: LeadOption[]
  durationMs: number
}

const ProjectListFilters = ({
  open,
  exiting,
  entered,
  onClose,
  filterLeadId,
  filterSort,
  onFilterLeadChange,
  onFilterSortChange,
  onReset,
  leadOptions,
  durationMs,
}: ProjectListFiltersProps) => {
  const { current } = Themestore()

  if (!open && !exiting) return null

  return (
    <>
      <div
        role="presentation"
        className="fixed inset-0 z-40 transition-opacity ease-out"
        style={{
          backgroundColor: 'rgba(0,0,0,0.35)',
          opacity: entered && !exiting ? 1 : 0,
          transitionDuration: `${durationMs}ms`,
        }}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-sm flex flex-col shadow-lg transition-transform ease-out"
        style={{
          backgroundColor: current?.system?.foreground ?? '#fff',
          borderLeft: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.1)'}`,
          transform: entered && !exiting ? 'translateX(0)' : 'translateX(100%)',
          transitionDuration: `${durationMs}ms`,
        }}
        aria-label="Filter projects"
      >
        <div
          className="flex items-center justify-between gap-3 px-4 py-3 border-b shrink-0"
          style={{ borderColor: current?.system?.border }}
        >
          <Text className="font-medium">Filters</Text>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-base opacity-80 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-1"
            style={{ color: current?.system?.dark }}
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto scroll-slim flex-1 min-h-0 space-y-5">
          <CustomSelect
            label="Lead"
            options={[{ value: '', label: 'All leads' }, ...leadOptions]}
            value={filterLeadId}
            onChange={(v) => onFilterLeadChange(v || '')}
            placeholder="All leads"
            aria-label="Filter by lead"
            placement="below"
          />
          <CustomSelect
            label="Sort by"
            options={SORT_OPTIONS}
            value={filterSort}
            onChange={(v) => onFilterSortChange(v || 'name_asc')}
            placeholder="Sort by"
            aria-label="Sort projects"
            placement="below"
          />
          <div className="pt-3 mt-1 border-t" style={{ borderColor: current?.system?.border ?? 'rgba(0,0,0,0.08)' }}>
            <Button
              size="sm"
              fullWidth
              variant="background"
              label="Reset filters"
              onClick={onReset}
              disabled={!filterLeadId && filterSort === 'name_asc'}
            />
          </div>
        </div>
      </aside>
    </>
  )
}

export default ProjectListFilters
