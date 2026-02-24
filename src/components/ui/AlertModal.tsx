import Text from '../base/Text'
import Button from './Button'
import Modal from './Modal'
import { Themestore } from '../../data/Themestore'

export interface Props {
  open: boolean
  title?: string
  message: string
  onClose: () => void
  /** When set, primary button calls this then onClose (e.g. for delete confirm) */
  onConfirm?: () => void | Promise<void>
  /** Optional label for the primary button (default "OK") */
  confirmLabel?: string
  /** 'error' uses theme error color for title */
  variant?: 'neutral' | 'error'
}

const AlertModal = ({
  open,
  title = 'Message',
  message,
  onClose,
  onConfirm,
  confirmLabel = 'OK',
  variant = 'neutral',
}: Props) => {
  const { current } = Themestore()

  const handleConfirm = () => {
    if (onConfirm) {
      Promise.resolve(onConfirm()).then(onClose)
    } else {
      onClose()
    }
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <Text
          className="font-semibold mb-2"
          color={variant === 'error' ? current?.system?.error : current?.system?.dark}
        >
          {title}
        </Text>
        <Text variant="sm" className="opacity-90 mb-6">
          {message}
        </Text>
        <div className="flex justify-end">
          <Button
            type="button"
            label={confirmLabel}
            onClick={handleConfirm}
          />
        </div>
      </div>
    </Modal>
  )
}

export default AlertModal
