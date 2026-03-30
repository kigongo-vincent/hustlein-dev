import { useCallback, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import { Themestore } from '../../data/Themestore'
import Text from '../base/Text'
import { Button } from '../ui'
import { AVATAR_XL_PIXEL_SIZE } from '../base/iconTokens'
import { renderCroppedAvatarDataUrl } from '../../utils/avatarImage'

export interface AvatarCropModalProps {
  open: boolean
  imageSrc: string | null
  onClose: () => void
  onConfirm: (dataUrl: string) => void | Promise<void>
}

const AvatarCropModal = ({ open, imageSrc, onClose, onConfirm }: AvatarCropModalProps) => {
  const { current } = Themestore()
  const dark = current?.system?.dark ?? '#111'
  const bg = current?.system?.foreground ?? '#fff'
  const border = current?.system?.border

  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const handleClose = () => {
    if (saving) return
    setError('')
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setCroppedAreaPixels(null)
    onClose()
  }

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) {
      setError('Adjust the crop, then try again.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const dataUrl = await renderCroppedAvatarDataUrl(imageSrc, croppedAreaPixels, AVATAR_XL_PIXEL_SIZE)
      await onConfirm(dataUrl)
      handleClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not process image.')
    } finally {
      setSaving(false)
    }
  }

  if (!open || !imageSrc) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-crop-title"
    >
      <div
        className="w-full max-w-md rounded-base overflow-hidden shadow-lg flex flex-col"
        style={{ background: bg, border: border ? `1px solid ${border}` : undefined }}
      >
        <div className="px-4 pt-4 pb-2">
          <Text id="avatar-crop-title" className="font-medium" style={{ color: dark }}>
            Crop profile photo
          </Text>
          <Text variant="sm" className="opacity-80 mt-1" style={{ color: dark }}>
            Pinch or zoom to fit. Saved at {AVATAR_XL_PIXEL_SIZE}×{AVATAR_XL_PIXEL_SIZE}px to keep file size small.
          </Text>
        </div>
        <div className="relative w-full h-[min(70vh,360px)] bg-black/5">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="px-4 py-3 flex flex-col gap-3">
          <label className="flex items-center gap-2">
            <span className="text-sm opacity-80" style={{ color: dark }}>
              Zoom
            </span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 min-w-0"
            />
          </label>
          {error && (
            <Text variant="sm" color={current?.system?.error}>
              {error}
            </Text>
          )}
          <div className="flex justify-end gap-2">
            <Button label="Cancel" variant="outlineSecondary" onClick={handleClose} disabled={saving} />
            <Button label={saving ? 'Saving…' : 'Save'} onClick={handleSave} disabled={saving} loading={saving} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AvatarCropModal
