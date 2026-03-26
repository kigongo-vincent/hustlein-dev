import { useMemo } from 'react'
import View from '../../components/base/View'
import Text from '../../components/base/Text'
import { Modal, Button } from '../../components/ui'
import { Themestore } from '../../data/Themestore'

export type AccountType = 'freelancer' | 'company'

interface Props {
  open: boolean
  onClose: () => void
  onSelect: (accountType: AccountType) => void
  /** Defaults to true */
  closeOnBackdrop?: boolean
}

const AccountTypeModal = ({ open, onClose, onSelect, closeOnBackdrop = true }: Props) => {
  const { current } = Themestore()

  const helperText = useMemo(() => {
    return {
      freelancer: 'Access freelancer workspace: tasks, milestones, timesheets, and invoices.',
      company: 'You will complete company setup (including logo) before using the app.',
    }
  }, [])

  return (
    <Modal open={open} onClose={onClose} closeOnBackdrop={closeOnBackdrop} variant="default">
      <View className="space-y-5 p-6">
        <div className="space-y-2">
          <Text variant="md" className="font-semibold">
            Continue as
          </Text>
          <Text variant="sm" className="opacity-80">
            Choose the account type you want to proceed with.
          </Text>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            className="w-full rounded-base transition opacity-90 hover:opacity-100"
            style={{
              backgroundColor: current?.system?.background ?? undefined,
              color: current?.system?.dark,
              padding: '14px 16px',
              border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.06)'}`,
            }}
            onClick={() => onSelect('freelancer')}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 text-left">
                <Text variant="sm" className="font-semibold">
                  Freelancer
                </Text>
                <Text variant="sm" className="opacity-80">
                  {helperText.freelancer}
                </Text>
              </div>
            </div>
          </button>

          <button
            type="button"
            className="w-full rounded-base transition opacity-90 hover:opacity-100"
            style={{
              backgroundColor: current?.system?.background ?? undefined,
              color: current?.system?.dark,
              padding: '14px 16px',
              border: `1px solid ${current?.system?.border ?? 'rgba(0,0,0,0.06)'}`,
            }}
            onClick={() => onSelect('company')}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 text-left">
                <Text variant="sm" className="font-semibold">
                  Company
                </Text>
                <Text variant="sm" className="opacity-80">
                  {helperText.company}
                </Text>
              </div>
            </div>
          </button>
        </div>

        <div className="pt-1 flex justify-end">
          <Button
            type="button"
            label="Cancel"
            variant="background"
            onClick={onClose}
            className="opacity-80"
          />
        </div>
      </View>
    </Modal>
  )
}

export default AccountTypeModal

