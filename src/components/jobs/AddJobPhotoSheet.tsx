'use client'

import { useEffect, useRef } from 'react'
import { Camera, Images } from '@phosphor-icons/react'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/body-scroll-lock'

interface AddJobPhotoSheetProps {
  sectionLabel: string
  onPhotoSelected: (file: File) => void
  onClose: () => void
}

export default function AddJobPhotoSheet({
  sectionLabel,
  onPhotoSelected,
  onClose,
}: AddJobPhotoSheetProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const libraryRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    lockBodyScroll()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      unlockBodyScroll()
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const handleFile = (file: File | undefined) => {
    if (!file) return
    onPhotoSelected(file)
  }

  return (
    <div className="damage-sheet-root" role="dialog" aria-modal="true" aria-label={`Add ${sectionLabel} photo`}>
      <button type="button" className="damage-sheet-overlay" onClick={onClose} aria-label="Close" />
      <div className="damage-sheet">
        <div className="damage-sheet__handle" />
        <div className="damage-sheet__title">Add {sectionLabel.toLowerCase()} photo</div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          hidden
          onChange={(e) => {
            handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />
        <input
          ref={libraryRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            handleFile(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        <button type="button" className="damage-sheet-row" onClick={() => cameraRef.current?.click()}>
          <span className="damage-sheet-row__icon">
            <Camera size={18} weight="duotone" aria-hidden="true" />
          </span>
          <span>
            <div className="damage-sheet-row__title">Take photo</div>
            <div className="damage-sheet-row__sub">Opens camera · best on the job</div>
          </span>
        </button>

        <button type="button" className="damage-sheet-row" onClick={() => libraryRef.current?.click()}>
          <span className="damage-sheet-row__icon">
            <Images size={18} weight="duotone" aria-hidden="true" />
          </span>
          <span>
            <div className="damage-sheet-row__title">Photo library</div>
            <div className="damage-sheet-row__sub">Choose from camera roll</div>
          </span>
        </button>

        <button type="button" className="damage-sheet__cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
