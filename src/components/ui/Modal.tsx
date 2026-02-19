import { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Themestore } from '../../data/Themestore'

export interface Props {
  open: boolean
  onClose?: () => void
  children: ReactNode
  /** Clicking the backdrop calls onClose when true (default true) */
  closeOnBackdrop?: boolean
}

const overlayTransition = { duration: 0.2 }
const panelTransition = { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }

const Modal = ({
  open,
  onClose,
  children,
  closeOnBackdrop = true,
}: Props) => {
  const { current } = Themestore()

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={overlayTransition}
        >
          <motion.div
            className="absolute inset-0 bg-neutral-400/30  backdrop-saturate-150"
            aria-hidden
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
            onClick={closeOnBackdrop ? onClose : undefined}
          />
          <motion.div
            className="relative rounded-base shadow-lg max-w-md w-full max-h-[90vh] overflow-auto"
            style={{
              backgroundColor: current?.system?.foreground ?? undefined,
            }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={panelTransition}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Modal
