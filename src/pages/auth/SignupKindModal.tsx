import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Text from '../../components/base/Text'
import { Themestore } from '../../data/Themestore'
import { authCardCaptionColor } from './authCardTheme'

export type SignupAccountKind = 'freelancer' | 'company'

type Props = {
  open: boolean
  onClose: () => void
  onPickKind: (kind: SignupAccountKind) => void
}

export default function SignupKindModal({ open, onClose, onPickKind }: Props) {
  const current = Themestore((s) => s.current)
  const mode = Themestore((s) => s.mode)

  return (
    <Modal open={open} onClose={onClose} closeOnBackdrop>
      <div className="p-6 sm:p-7 space-y-4">
        <Text variant="md" className="font-bold text-center">
          Create your account
        </Text>
        <Text variant="sm" className="text-center px-1 leading-snug" style={{ color: authCardCaptionColor(mode) }}>
          Choose how you&apos;ll sign up. Organizations use email and password; freelancers can also use Google after
          signing in.
        </Text>
        <div className="flex flex-col gap-3 pt-1">
          <Button
            type="button"
            label="Continue as freelancer"
            fullWidth
            onClick={() => onPickKind('freelancer')}
          />
          <Button
            type="button"
            variant="background"
            label="Continue as organization"
            fullWidth
            onClick={() => onPickKind('company')}
          />
        </div>
        <button
          type="button"
          className="w-full text-center text-sm underline opacity-80 hover:opacity-100 transition-opacity"
          style={{ color: current?.system?.dark }}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </Modal>
  )
}
