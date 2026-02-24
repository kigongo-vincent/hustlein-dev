import Text, { baseFontSize } from '../../components/base/Text'
import { Button, Modal } from '../../components/ui'
import { Themestore } from '../../data/Themestore'
import type { ProjectWithMeta } from './types'

type SuspendProjectModalProps = {
  project: ProjectWithMeta | null
  open: boolean
  onClose: () => void
  saving: boolean
  onConfirm: () => void
}

const SuspendProjectModal = ({ project, open, onClose, saving, onConfirm }: SuspendProjectModalProps) => {
  const { current } = Themestore()
  const dark = current?.system?.dark
  const isResume = project?.status === 'suspended'

  return (
    <Modal open={open} onClose={() => !saving && onClose()}>
      <div className="min-w-0 w-full flex flex-col p-6" style={{ backgroundColor: current?.system?.foreground }}>
        <h2 className="font-medium mb-2" style={{ fontSize: baseFontSize * 1.2, color: dark }}>
          {isResume ? 'Resume project?' : 'Suspend project?'}
        </h2>
        <Text variant="sm" className="opacity-80 mb-4" style={{ color: dark }}>
          {project
            ? isResume
              ? `"${project.name}" will be reactivated and visible again.`
              : `"${project.name}" will be suspended. You can reactivate it later from the project settings.`
            : ''}
        </Text>
        <footer className="flex justify-end gap-2 pt-4 mt-4 border-t" style={{ borderColor: current?.system?.border }}>
          <Button variant="secondary" label="Cancel" onClick={() => !saving && onClose()} disabled={saving} />
          <Button label={isResume ? 'Resume' : 'Suspend'} onClick={onConfirm} disabled={saving} />
        </footer>
      </div>
    </Modal>
  )
}

export default SuspendProjectModal
