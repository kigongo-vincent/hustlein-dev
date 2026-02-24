import { ReactNode, useRef, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Themestore } from '../../data/Themestore'

export interface PopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  children: ReactNode
  /** Placement of panel relative to trigger */
  placement?: 'bottom-end' | 'bottom-start'
}

const Popover = ({
  open,
  onOpenChange,
  trigger,
  children,
  placement = 'bottom-end',
}: PopoverProps) => {
  const triggerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelRect, setPanelRect] = useState<{ top: number; left: number; minWidth: number } | null>(null)
  const { current } = Themestore()

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const gap = 4
    const minWidth = 180
    setPanelRect({
      top: rect.bottom + gap,
      left: placement === 'bottom-end' ? rect.right - minWidth : rect.left,
      minWidth,
    })
  }, [open, placement])

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      onOpenChange(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onOpenChange])

  return (
    <div ref={triggerRef} className="relative inline-block">
      <div onClick={() => onOpenChange(!open)} className="cursor-pointer">
        {trigger}
      </div>
      {open &&
        panelRect &&
        createPortal(
          <div
            ref={panelRef}
            className="py-1 rounded-lg shadow-lg border z-[99999]"
            style={{
              position: 'fixed',
              top: panelRect.top,
              left: panelRect.left,
              minWidth: panelRect.minWidth,
              backgroundColor: current?.system?.foreground ?? '#fff',
              borderColor: current?.system?.border ?? 'rgba(0,0,0,0.1)',
            }}
            role="menu"
          >
            {children}
          </div>,
          document.body
        )}
    </div>
  )
}

export default Popover
