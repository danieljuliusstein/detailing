'use client'

import { useRef } from 'react'
import { Camera, Image as ImageIcon, X } from '@phosphor-icons/react'

interface Props {
  imageUrl: string | null
  onChange: (url: string | null) => void
  label?: string
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export default function InventoryImagePicker({ imageUrl, onChange, label = 'Product photo' }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const pick = async (file: File | undefined) => {
    if (!file) return
    const dataUrl = await readFileAsDataUrl(file)
    onChange(dataUrl)
  }

  return (
    <div className="inv-image-picker">
      <p className="inv-field-label">{label.toUpperCase()}</p>
      <div className="inv-image-picker__row">
        <div className="inv-image-picker__preview">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" />
          ) : (
            <ImageIcon size={22} weight="duotone" color="#636366" aria-hidden />
          )}
        </div>
        <div className="inv-image-picker__actions">
          <button type="button" className="inv-image-picker__btn" onClick={() => cameraRef.current?.click()}>
            <Camera size={16} weight="duotone" aria-hidden />
            Take photo
          </button>
          <button type="button" className="inv-image-picker__btn" onClick={() => fileRef.current?.click()}>
            <ImageIcon size={16} weight="duotone" aria-hidden />
            Choose photo
          </button>
          {imageUrl && (
            <button type="button" className="inv-image-picker__remove" onClick={() => onChange(null)}>
              <X size={14} aria-hidden />
              Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="inv-image-picker__input"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="inv-image-picker__input"
        onChange={(e) => void pick(e.target.files?.[0])}
      />
    </div>
  )
}
