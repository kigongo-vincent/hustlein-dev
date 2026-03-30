import type { Area } from 'react-easy-crop'
import { AVATAR_XL_PIXEL_SIZE } from '../components/base/iconTokens'

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (e) => reject(e))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

/**
 * Crops to `pixelCrop`, scales to a square of `outputSize` (matches largest Avatar display size).
 * Uses default JPEG encoding (no extra quality reduction — downsizing keeps files small).
 */
export async function renderCroppedAvatarDataUrl(
  imageSrc: string,
  pixelCrop: Area,
  outputSize: number = AVATAR_XL_PIXEL_SIZE,
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')
  canvas.width = outputSize
  canvas.height = outputSize
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize,
  )
  return canvas.toDataURL('image/jpeg')
}
