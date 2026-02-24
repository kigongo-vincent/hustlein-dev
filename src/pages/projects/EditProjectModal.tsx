import { baseFontSize } from '../../components/base/Text'
import { Button, Modal, Input, Textarea, CustomSelect } from '../../components/ui'
import { Themestore } from '../../data/Themestore'

type LeadOption = { value: string; label: string }

type EditProjectModalProps = {
  open: boolean
  onClose: () => void
  saving: boolean
  name: string
  description: string
  leadId: string
  onNameChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onLeadIdChange: (v: string) => void
  onSubmit: () => void
  leadOptions: LeadOption[]
}

const EditProjectModal = ({
  open,
  onClose,
  saving,
  name,
  description,
  leadId,
  onNameChange,
  onDescriptionChange,
  onLeadIdChange,
  onSubmit,
  leadOptions,
}: EditProjectModalProps) => {
  const { current } = Themestore()
  const dark = current?.system?.dark
  const fg = current?.system?.foreground
  const borderColor = current?.system?.border

  return (
    <Modal open={open} onClose={() => !saving && onClose()}>
      <div className="min-w-0 w-full flex flex-col p-6" style={{ backgroundColor: fg }}>
        <h2 className="font-medium mb-4" style={{ fontSize: baseFontSize * 1.2, color: dark }}>
          Edit project
        </h2>
        <div className="space-y-4">
          <Input
            label="Name"
            type="text"
            placeholder="Project name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            aria-label="Project name"
          />
          <Textarea
            label="Description (optional)"
            placeholder="Brief description"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            aria-label="Project description"
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
        </div>
        <footer className="flex justify-end gap-2 pt-4 mt-4 border-t shrink-0" style={{ borderColor }}>
          <Button variant="secondary" label="Cancel" onClick={() => !saving && onClose()} disabled={saving} />
          <Button label="Save" onClick={onSubmit} disabled={saving || !name.trim() || !leadId} />
        </footer>
      </div>
    </Modal>
  )
}

export default EditProjectModal
