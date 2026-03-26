import { useEffect, useMemo, useState } from 'react'
import Text, { baseFontSize } from '../../components/base/Text'
import { Button, Modal, Input, CustomSelect, RichTextEditor, DatePicker, Textarea, CurrencyInput } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import type { MarketplaceBudgetType, ProjectType } from '../../types'

type LeadOption = { value: string; label: string }

type CreateInternalPayload = {
  projectType: 'internal'
  name: string
  description: string
  leadId: string
  dueDate: string
}

type CreateExternalPayload = {
  projectType: 'external'
  title: string
  description: string
  budgetType: MarketplaceBudgetType
  hourlyMin?: number
  hourlyMax?: number
  fixedMin?: number
  fixedMax?: number
  currency: string
  requiredSkills: string[]
}

export type CreateProjectPayload = CreateInternalPayload | CreateExternalPayload

type CreateProjectModalProps = {
  open: boolean
  onClose: () => void
  saving: boolean
  name: string
  description: string
  leadId: string
  dueDate: string
  onNameChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onLeadIdChange: (v: string) => void
  onDueDateChange: (v: string) => void
  onSubmit: (payload: CreateProjectPayload) => void
  leadOptions: LeadOption[]
  /** When true, show Internal vs External choice + confirmation step */
  projectTypeChoiceEnabled?: boolean
}

const CreateProjectModal = ({
  open,
  onClose,
  saving,
  name,
  description,
  leadId,
  dueDate,
  onNameChange,
  onDescriptionChange,
  onLeadIdChange,
  onDueDateChange,
  onSubmit,
  leadOptions,
  projectTypeChoiceEnabled = false,
}: CreateProjectModalProps) => {
  const { current } = Themestore()
  const dark = current?.system?.dark
  const fg = current?.system?.foreground
  const borderColor = current?.system?.border

  const [step, setStep] = useState<'confirm' | 'form'>(projectTypeChoiceEnabled ? 'confirm' : 'form')
  const [selectedType, setSelectedType] = useState<ProjectType>('internal')

  // External marketplace posting fields (separate from internal project fields)
  const [extTitle, setExtTitle] = useState('')
  const [extDescription, setExtDescription] = useState('')
  const [extBudgetType, setExtBudgetType] = useState<MarketplaceBudgetType>('hybrid')
  const [extHourlyMin, setExtHourlyMin] = useState('')
  const [extHourlyMax, setExtHourlyMax] = useState('')
  const [extFixedMin, setExtFixedMin] = useState('')
  const [extFixedMax, setExtFixedMax] = useState('')
  const [extCurrency, setExtCurrency] = useState('UGX')
  const [extSkills, setExtSkills] = useState('')

  const resetExternal = () => {
    setExtTitle('')
    setExtDescription('')
    setExtBudgetType('hybrid')
    setExtHourlyMin('')
    setExtHourlyMax('')
    setExtFixedMin('')
    setExtFixedMax('')
    setExtCurrency('UGX')
    setExtSkills('')
  }

  useEffect(() => {
    if (!open) return
    setSelectedType('internal')
    setStep(projectTypeChoiceEnabled ? 'confirm' : 'form')
    resetExternal()
  }, [open, projectTypeChoiceEnabled])

  const BUDGET_OPTIONS = useMemo(() => {
    return [
      { value: 'hybrid', label: 'Hybrid' },
      { value: 'hourly', label: 'Hourly' },
      { value: 'fixed', label: 'Fixed' },
    ]
  }, [])

  const CURRENCY_OPTIONS = useMemo(() => {
    return [
      { value: 'UGX', label: 'UGX' },
      { value: 'KES', label: 'KES' },
      { value: 'TZS', label: 'TZS' },
      { value: 'USD', label: 'USD' },
      { value: 'EUR', label: 'EUR' },
      { value: 'GBP', label: 'GBP' },
    ]
  }, [])

  const externalRequiredOk = useMemo(() => {
    if (!extTitle.trim()) return false
    const cur = extCurrency.trim()
    if (!cur) return false
    const skillsOk = true // can be empty, backend will accept []

    const hourlyOk = !!extHourlyMin.trim() && !!extHourlyMax.trim()
    const fixedOk = !!extFixedMin.trim() && !!extFixedMax.trim()

    if (!skillsOk) return false

    if (extBudgetType === 'hourly') return hourlyOk
    if (extBudgetType === 'fixed') return fixedOk
    return hourlyOk && fixedOk
  }, [extTitle, extCurrency, extBudgetType, extHourlyMin, extHourlyMax, extFixedMin, extFixedMax])

  return (
    <Modal open={open} onClose={() => !saving && onClose()} variant="wide">
      <div className="min-w-0 w-full flex flex-col p-6" style={{ backgroundColor: fg }}>
        {step === 'confirm' ? (
          <>
            <Text className="font-medium mb-4" style={{ fontSize: baseFontSize * 1.2, color: dark }}>
              Create project type
            </Text>
            <div className="space-y-3">
              {(() => {
                const primary = current?.brand?.primary ?? '#682308'
                const cardSelected = selectedType === 'internal'
                const cardBg = cardSelected ? `${primary}14` : current?.system?.background ?? 'rgba(0,0,0,0.04)'
                const cardBorder = cardSelected ? `1px solid ${primary}` : `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.08)'}` // keeps layout stable
                const cardText = current?.system?.dark ?? '#111'

                return (
                  <div className="rounded-base p-4" style={{ backgroundColor: cardBg, border: cardBorder }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Text className="font-semibold" variant="md" style={{ color: cardText }}>
                          Internal
                        </Text>
                        <Text className="opacity-70" variant="sm" style={{ color: cardText }}>
                          Only for your internal PM workflow (not shown on the marketplace).
                        </Text>
                      </div>
                      <Button
                        size="sm"
                        variant={cardSelected ? 'primary' : 'outlinePrimary'}
                        label="Select"
                        onClick={() => setSelectedType('internal')}
                        disabled={saving}
                      />
                    </div>
                  </div>
                )
              })()}

              {(() => {
                const primary = current?.brand?.primary ?? '#682308'
                const cardSelected = selectedType === 'external'
                const cardBg = cardSelected ? `${primary}14` : current?.system?.background ?? 'rgba(0,0,0,0.04)'
                const cardBorder = cardSelected ? `1px solid ${primary}` : `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.08)'}`
                const cardText = current?.system?.dark ?? '#111'

                return (
                  <div className="rounded-base p-4" style={{ backgroundColor: cardBg, border: cardBorder }}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Text className="font-semibold" variant="md" style={{ color: cardText }}>
                          External (Marketplace)
                        </Text>
                        <Text className="opacity-70" variant="sm" style={{ color: cardText }}>
                          Creates a marketplace listing that freelancers can view and apply to.
                        </Text>
                      </div>
                      <Button
                        size="sm"
                        variant={cardSelected ? 'primary' : 'outlinePrimary'}
                        label="Select"
                        onClick={() => setSelectedType('external')}
                        disabled={saving}
                      />
                    </div>
                  </div>
                )
              })()}
            </div>

            <footer className="flex justify-end gap-2 pt-4 mt-4 border-t shrink-0" style={{ borderColor }}>
              <Button variant="background" label="Cancel" onClick={() => !saving && onClose()} disabled={saving} />
              <Button
                label="Continue"
                onClick={() => setStep('form')}
                disabled={saving}
              />
            </footer>
          </>
        ) : (
          <>
            <h2 className="font-medium mb-4" style={{ fontSize: baseFontSize * 1.2, color: dark }}>
              {selectedType === 'external' ? 'Create marketplace listing' : 'Create project'}
            </h2>

            {selectedType === 'external' ? (
              <div className="space-y-4">
                <Input
                  label="Title"
                  type="text"
                  placeholder="Project posting title"
                  value={extTitle}
                  onChange={(e) => setExtTitle(e.target.value)}
                  aria-label="Marketplace title"
                />
                <Textarea
                  label="Description"
                  placeholder="Describe the role and requirements"
                  value={extDescription}
                  onChange={(e) => setExtDescription(e.target.value)}
                />

                <CustomSelect
                  label="Budget type"
                  options={BUDGET_OPTIONS}
                  value={extBudgetType}
                  onChange={(v) => setExtBudgetType(v === 'hourly' || v === 'fixed' || v === 'hybrid' ? v : 'hybrid')}
                  placement="below"
                />

                {extBudgetType === 'hourly' || extBudgetType === 'hybrid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CurrencyInput
                      label="Hourly min"
                      value={extHourlyMin}
                      onChange={setExtHourlyMin}
                      currency={extCurrency}
                      showCurrencySymbol={false}
                    />
                    <CurrencyInput
                      label="Hourly max"
                      value={extHourlyMax}
                      onChange={setExtHourlyMax}
                      currency={extCurrency}
                      showCurrencySymbol={false}
                    />
                  </div>
                ) : null}

                {extBudgetType === 'fixed' || extBudgetType === 'hybrid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <CurrencyInput
                      label="Fixed min"
                      value={extFixedMin}
                      onChange={setExtFixedMin}
                      currency={extCurrency}
                      showCurrencySymbol={false}
                    />
                    <CurrencyInput
                      label="Fixed max"
                      value={extFixedMax}
                      onChange={setExtFixedMax}
                      currency={extCurrency}
                      showCurrencySymbol={false}
                    />
                  </div>
                ) : null}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <CustomSelect
                    label="Currency"
                    options={CURRENCY_OPTIONS}
                    value={extCurrency}
                    onChange={(v) => setExtCurrency(v || 'UGX')}
                    placement="below"
                  />
                  <Input
                    label="Required skills"
                    placeholder="Comma-separated (e.g. React, Go, Figma)"
                    value={extSkills}
                    onChange={(e) => setExtSkills(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Name"
                  type="text"
                  placeholder="Project name"
                  value={name}
                  onChange={(e) => onNameChange(e.target.value)}
                  aria-label="Project name"
                />
                <RichTextEditor
                  label="Description (optional)"
                  placeholder="Brief description"
                  value={description}
                  onChange={(html) => onDescriptionChange(html)}
                  toolbarPreset="minimal"
                  minHeight="120px"
                />
                <CustomSelect
                  label="Project lead"
                  options={leadOptions}
                  value={leadId}
                  onChange={(v) => onLeadIdChange(v || '')}
                  placeholder="Select lead"
                  aria-label="Project lead"
                  placement="below"
                />
                <DatePicker
                  label="Due date (optional)"
                  value={dueDate}
                  onChange={onDueDateChange}
                  aria-label="Project due date"
                />
              </div>
            )}

            <footer className="flex justify-end gap-2 pt-4 mt-4 border-t shrink-0" style={{ borderColor }}>
              <Button
                variant="background"
                label="Back"
                onClick={() => setStep('confirm')}
                disabled={saving}
              />
              <Button
                label={selectedType === 'external' ? 'Create listing' : 'Create'}
                onClick={() => {
                  if (selectedType === 'external') {
                    const requiredSkills = extSkills
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)

                    onSubmit({
                      projectType: 'external',
                      title: extTitle.trim(),
                      description: extDescription.trim(),
                      budgetType: extBudgetType,
                      hourlyMin: extHourlyMin.trim() ? Number(extHourlyMin) : undefined,
                      hourlyMax: extHourlyMax.trim() ? Number(extHourlyMax) : undefined,
                      fixedMin: extFixedMin.trim() ? Number(extFixedMin) : undefined,
                      fixedMax: extFixedMax.trim() ? Number(extFixedMax) : undefined,
                      currency: extCurrency.trim() || 'UGX',
                      requiredSkills,
                    })
                    return
                  }

                  onSubmit({
                    projectType: 'internal',
                    name: name.trim(),
                    description,
                    leadId,
                    dueDate,
                  })
                }}
                disabled={
                  saving ||
                  (selectedType === 'external' ? !externalRequiredOk : !name.trim() || !leadId)
                }
                loading={saving}
              />
            </footer>
          </>
        )}
      </div>
    </Modal>
  )
}

export default CreateProjectModal
