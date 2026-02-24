import { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Themestore } from '../../data/Themestore'

export type ModalVariant = 'default' | 'wide' | 'fullscreen'

const VARIANT_CLASSES: Record<ModalVariant, string> = {
  default: 'max-w-md max-h-[min(90vh,calc(100dvh-2rem))] min-h-0',
  wide: 'max-w-4xl max-h-[min(95vh,calc(100dvh-2rem))] min-h-0',
  fullscreen: 'fixed inset-0 w-full h-full max-w-none max-h-none rounded-none',
}

export interface Props {
  open: boolean
  onClose?: () => void
  children: ReactNode
  /** Clicking the backdrop calls onClose when true (default true) */
  closeOnBackdrop?: boolean
  /** Layout size: default (narrow) or wide (e.g. for invoice/details) */
  variant?: ModalVariant
}

const overlayTransition = { duration: 0.2 }
const panelTransition = { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const }

const Modal = ({
  open,
  onClose,
  children,
  closeOnBackdrop = true,
  variant = 'default',
}: Props) => {
  const { current } = Themestore()
  const panelClass = VARIANT_CLASSES[variant]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="modal"
          className={`fixed inset-0 z-50 flex items-center justify-center overflow-hidden ${variant === 'fullscreen' ? 'p-0' : 'p-4'}`}
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
            className={`relative rounded-base shadow-lg w-full overflow-auto scroll-slim ${panelClass}`}
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
