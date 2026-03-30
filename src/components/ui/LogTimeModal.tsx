import { useCallback, useEffect, useMemo, useState } from 'react'
import Text, { baseFontSize } from '../base/Text'
import { Button, CustomSelect, Input, Modal, RichTextEditor } from './index'
import { Authstore } from '../../data/Authstore'
import { Themestore } from '../../data/Themestore'
import { projectService, milestoneService, taskService } from '../../services'
import type { Milestone, Project } from '../../types'
import { toast } from 'react-toastify'

/** Contrasting text color on a hex background: white or dark so step number is always readable. */
function textOnBg(hex: string | undefined, dark: string | undefined): string {
  if (!hex || !hex.startsWith('#')) return dark ?? '#1a1a1a'
  const s = hex.replace('#', '')
  const r = parseInt(s.slice(0, 2), 16) / 255
  const g = parseInt(s.slice(2, 4), 16) / 255
  const b = parseInt(s.slice(4, 6), 16) / 255
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b
  return luminance > 0.6 ? (dark ?? '#1a1a1a') : '#fff'
}

export interface LogTimeModalProps {
  open: boolean
  onClose: () => void
  onSaved?: (data?: unknown) => void
  /** Prefill description when opening (e.g. from "create task from selection" on Notes). */
  initialDescription?: string
  /** Prefill title when opening. */
  initialTitle?: string
  /** When set (e.g. from project detail as consultant), project is prefilled and step 1 is skipped. */
  initialProjectId?: string
  /** When set with initialProjectId, milestone is prefilled. */
  initialMilestoneId?: string
}

type Step = 1 | 2 | 3

export default function LogTimeModal({ open, onClose, onSaved, initialDescription, initialTitle, initialProjectId, initialMilestoneId }: LogTimeModalProps) {
  const { current, mode } = Themestore()
  const user = Authstore((s) => s.user)
  const dark = current?.system?.dark
  const fg = current?.system?.foreground ?? '#fff'
  const borderColor = current?.system?.border ?? 'rgba(0,0,0,0.1)'

  const [step, setStep] = useState<Step>(1)
  const [projects, setProjects] = useState<Project[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingMilestones, setLoadingMilestones] = useState(false)

  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const currentUserId = user?.id ?? ''

  useEffect(() => {
    if (!open) return
    setTitle(initialTitle ?? '')
    setDescription(initialDescription ?? '')
    if (initialProjectId) {
      setSelectedProjectId(initialProjectId)
      setSelectedMilestoneId(initialMilestoneId ?? '')
      setStep(initialMilestoneId ? 3 : 2)
    } else {
      setStep(1)
      setSelectedProjectId('')
      setSelectedMilestoneId('')
    }
  }, [open, initialTitle, initialDescription, initialProjectId, initialMilestoneId])

  useEffect(() => {
    if (!open) return
    setLoadingProjects(true)
    const isConsultant = user?.role === 'consultant'
    const load = isConsultant && currentUserId
      ? taskService.listByOwner(currentUserId).then((tasks) => {
        const projectIds = [...new Set(tasks.map((t) => t.projectId).filter(Boolean))]
        return Promise.all(projectIds.map((pid) => projectService.get(pid))).then((results) =>
          results.filter((p): p is Project => p != null)
        )
      })
      : projectService.list()
    load
      .then(async (list) => {
        const base = list ?? []
        if (initialProjectId && !base.some((p) => p.id === initialProjectId)) {
          const p = await projectService.get(initialProjectId)
          if (p) setProjects([p, ...base])
          else setProjects(base)
        } else {
          setProjects(base)
        }
      })
      .catch(() => {
        setProjects([])
      })
      .finally(() => {
        setLoadingProjects(false)
      })
  }, [open, currentUserId, user?.role, initialProjectId])

  const projectOptions = useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name })),
    [projects]
  )

  const assignedMilestones = useMemo(() => {
    return milestones.filter((m) => {
      const ids = m.assigneeIds ?? []
      if (ids.length === 0) return true
      return ids.includes(currentUserId)
    })
  }, [milestones, currentUserId])

  const milestoneOptions = useMemo(
    () =>
      assignedMilestones.map((m) => ({
        value: m.id,
        label: `${m.name} (${new Date(m.targetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })})`,
      })),
    [assignedMilestones]
  )

  useEffect(() => {
    if (!selectedProjectId) {
      setMilestones([])
      setSelectedMilestoneId('')
      return
    }
    setLoadingMilestones(true)
    setSelectedMilestoneId('')
    milestoneService.listByProject(selectedProjectId).then((list) => {
      setMilestones(list)
      setLoadingMilestones(false)
    })
  }, [selectedProjectId])

  const selectedProject = useMemo(
    () => projects.find((p) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  )
  const selectedMilestone = useMemo(
    () => milestones.find((m) => m.id === selectedMilestoneId),
    [milestones, selectedMilestoneId]
  )

  const canNextFromStep1 = !!selectedProjectId
  const canNextFromStep2 = !!selectedMilestoneId
  // const canSubmit = !!title.trim() && !!selectedProjectId && !!selectedMilestoneId && !!currentUserId
  const canSubmit = true

  const handleNext = useCallback(() => {
    if (step === 1 && canNextFromStep1) setStep(2)
    else if (step === 2 && canNextFromStep2) setStep(3)
  }, [step, canNextFromStep1, canNextFromStep2])

  const handleBack = useCallback(() => {
    if (step === 2) setStep(1)
    else if (step === 3) setStep(2)
  }, [step])

  const handleSubmit = useCallback(async () => {
    // if (!canSubmit || !selectedProjectId || !selectedMilestoneId) {
    //   toast("missing project")
    // }
    const workflow = await projectService.getWorkflow(selectedProjectId)
    const firstStateId = workflow?.states?.[0]?.id ?? 's1'
    setSaving(true)
    try {
      const task = await taskService.create({
        projectId: selectedProjectId,
        milestoneId: selectedMilestoneId,
        title: title.trim(),
        description: description.trim() || undefined,
        workflowStateId: firstStateId,
        ownerId: currentUserId,
        priority: 'medium',
        dependencyIds: [],
      })
      onSaved?.(task)
      onClose()
    }
    catch (e) {

    }
    finally {
      setSaving(false)
    }
  }, [canSubmit, selectedProjectId, selectedMilestoneId, title, description, currentUserId, onSaved, onClose])

  const contentBg = mode === 'dark' ? (dark ? `${dark}18` : 'rgba(255,255,255,0.06)') : 'rgba(0,0,0,0.04)'
  const secondary = current?.brand?.secondary ?? '#FF9600'
  const activeStepBg = secondary
  const activeStepColor = textOnBg(secondary, dark)
  const inactiveStepColor = dark ?? '#1a1a1a'



  return (
    <Modal open={open} onClose={() => !saving && onClose()} closeOnBackdrop variant="wide">
      <div
        className="p-6 flex flex-col gap-6 min-h-0 max-h-[85vh] overflow-y-auto scroll-slim"
        style={{ backgroundColor: fg, color: dark }}
      >
        <h3 className="font-semibold shrink-0" style={{ fontSize: baseFontSize * 1.15, color: dark }}>
          Log time
        </h3>

        {/* Step indicator: full-width bar with middle divider lines */}
        <div
          className="flex w-full shrink-0 overflow-hidden rounded-base"
          style={{ height: 40, backgroundColor: contentBg }}
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={3}
          aria-label={`Step ${step} of 3`}
        >
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className="flex flex-1 items-center justify-center text-sm font-semibold transition-colors"
              style={{
                backgroundColor: step === s ? activeStepBg : contentBg,
                color: step === s ? activeStepColor : inactiveStepColor,
                borderRight: s < 3 ? `1px solid ${borderColor}` : 'none',
              }}
            >
              {s}
            </div>
          ))}
        </div>

        {/* Step 1: Select project */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Text variant="sm" className="font-medium opacity-90" style={{ color: dark }}>
              Select project
            </Text>
            {loadingProjects ? (
              <Text variant="sm" style={{ color: dark }}>Loading projects…</Text>
            ) : (
              <CustomSelect
                label="Project"
                options={projectOptions}
                value={selectedProjectId}
                onChange={(v) => setSelectedProjectId(v)}
                placeholder="Select project"
                placement="below"
              />
            )}
          </div>
        )}

        {/* Step 2: Select milestone */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <Text variant="sm" className="font-medium opacity-90" style={{ color: dark }}>
              Select milestone
            </Text>
            {selectedProject && (
              <Text variant="sm" className="opacity-75" style={{ color: dark }}>
                Project: {selectedProject.name}
              </Text>
            )}
            {loadingMilestones ? (
              <Text variant="sm" style={{ color: dark }}>Loading milestones…</Text>
            ) : assignedMilestones.length === 0 ? (
              <Text variant="sm" style={{ color: dark }}>No milestones assigned to you for this project.</Text>
            ) : (
              <CustomSelect
                label="Milestone"
                options={milestoneOptions}
                value={selectedMilestoneId}
                onChange={(v) => setSelectedMilestoneId(v)}
                placeholder="Select milestone"
                placement="below"
              />
            )}
          </div>
        )}

        {/* Step 3: Title + description */}
        {step === 3 && (
          <div className="flex flex-col gap-4 flex-1 min-h-0">
            {selectedProject && selectedMilestone && (
              <div className="flex flex-wrap gap-2 text-sm opacity-80" style={{ color: dark }}>
                <span>{selectedProject.name}</span>
                <span>→</span>
                <span>{selectedMilestone.name}</span>
              </div>
            )}
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task or time log title"
              labelBackgroundColor={fg}
            />
            <div className="flex flex-col gap-2 flex-1 min-h-0">
              <Text variant="sm" className="font-medium opacity-90" style={{ color: dark }}>
                Description
              </Text>
              <RichTextEditor
                placeholder="Describe what you did… Headings, lists, quotes, @mentions supported."
                value={description}
                onChange={setDescription}
                minHeight="220px"
                toolbarPreset="full"
                mode="fill"
                borderless
                contentBackgroundColor={contentBg}
                contentFontFamily="'Comic Sans MS', 'Comic Neue', Chalkboard, cursive"
                contentFontSize={16}
                enableMentions
                className="min-h-0 flex flex-col [&>div]:min-h-0 [&>div]:flex-1 [&_.ProseMirror]:min-h-[180px] [&_.ProseMirror]:flex-1"
              />
            </div>
          </div>
        )}

        <div className="flex justify-between gap-2 pt-2 shrink-0 border-t" style={{ borderColor }}>
          <div>
            {step > 1 && step < 3 && (
              <Button variant="background" label="Back" onClick={handleBack} disabled={saving} />
            )}
          </div>
          <div className="flex gap-2">
            {step < 3 ? (
              <Button
                label="Next"
                onClick={handleNext}
                disabled={
                  saving ||
                  (step === 1 && !canNextFromStep1) ||
                  (step === 2 && !canNextFromStep2)
                }
                loading={saving}
              />
            ) : (
              <>
                <Button variant="background" label="Cancel" onClick={onClose} disabled={saving} />
                <Button
                  label="Log time"
                  onClick={handleSubmit}
                  // disabled={saving || !canSubmit}
                  loading={saving}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}
