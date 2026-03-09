import Text, { baseFontSize } from '../../components/base/Text'
import { Button, Modal } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import type { ProjectWithMeta } from './types'

type DeleteProjectModalProps = {
  project: ProjectWithMeta | null
  open: boolean
  onClose: () => void
  saving: boolean
  onConfirm: () => void
}

const DeleteProjectModal = ({ project, open, onClose, saving, onConfirm }: DeleteProjectModalProps) => {
  const { current } = Themestore()
  const dark = current?.system?.dark

  return (
    <Modal open={open} onClose={() => !saving && onClose()}>
      <div className="min-w-0 w-full flex flex-col p-6" style={{ backgroundColor: current?.system?.foreground }}>
        <h2 className="font-medium mb-2" style={{ fontSize: baseFontSize * 1.2, color: dark }}>
          Delete project?
        </h2>
        <Text variant="sm" className="opacity-80 mb-4" style={{ color: dark }}>
          {project
            ? `Are you sure you want to delete "${project.name}"? This cannot be undone.`
            : ''}
        </Text>
        <footer className="flex justify-end gap-2 pt-4 mt-4 border-t" style={{ borderColor: current?.system?.border }}>
          <Button variant="background" label="Cancel" onClick={() => !saving && onClose()} disabled={saving} />
          <Button variant="danger" label="Delete" onClick={onConfirm} disabled={saving} loading={saving} />
        </footer>
      </div>
    </Modal>
  )
}

export default DeleteProjectModal
