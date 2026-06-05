'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CameraPlus, Trash, Image as ImageIcon } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { deleteJobPhoto, getJobPhotos, uploadJobPhoto } from '@/lib/api'
import type { JobPhoto, JobWithRelations, PhotoType } from '@/lib/types'

function PhotoTile({
  photo,
  onDelete,
}: {
  photo: JobPhoto
  onDelete: () => void
}) {
  return (
    <div style={{ position: 'relative', aspectRatio: '1', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '0.5px solid var(--border)' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      <button
        onClick={onDelete}
        aria-label="Delete photo"
        style={{
          position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)',
          border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex',
          alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}
      >
        <Trash size={14} color="#fff" />
      </button>
    </div>
  )
}

function EmptySlot() {
  return (
    <div style={{
      aspectRatio: '1', borderRadius: 'var(--radius-md)',
      border: '1px dashed var(--border-strong)',
      background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <ImageIcon size={28} weight="duotone" color="var(--text-dim)" />
    </div>
  )
}

export default function PhotoGallery({ job }: { job: JobWithRelations }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<JobPhoto[]>([])
  const [uploadType, setUploadType] = useState<PhotoType>('before')
  const [uploading, setUploading] = useState(false)

  const loadPhotos = useCallback(async () => {
    const list = await getJobPhotos(job.id)
    setPhotos(list)
  }, [job.id])

  useEffect(() => { loadPhotos() }, [loadPhotos])

  const beforePhotos = photos.filter((p) => p.type === 'before')
  const afterPhotos = photos.filter((p) => p.type === 'after')

  const handleAddClick = (type: PhotoType) => {
    setUploadType(type)
    fileRef.current?.click()
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadJobPhoto(job.id, file, uploadType)
      await loadPhotos()
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleDelete = async (filename: string) => {
    await deleteJobPhoto(job.id, filename)
    await loadPhotos()
  }

  return (
    <div className="screen page-content">
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />

      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20, gap: 12 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Photos</div>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{photos.length}</span>
      </div>

      <div className="section-title">Before</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {beforePhotos.map((p) => (
          <PhotoTile key={p.filename} photo={p} onDelete={() => handleDelete(p.filename)} />
        ))}
        {beforePhotos.length === 0 && <EmptySlot />}
      </div>
      <button
        className="btn-ghost"
        onClick={() => handleAddClick('before')}
        disabled={uploading}
        style={{ width: '100%', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <CameraPlus size={18} /> Add before photo
      </button>

      <div className="section-title">After</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        {afterPhotos.map((p) => (
          <PhotoTile key={p.filename} photo={p} onDelete={() => handleDelete(p.filename)} />
        ))}
        {afterPhotos.length === 0 && <EmptySlot />}
      </div>
      <button
        className="btn-ghost"
        onClick={() => handleAddClick('after')}
        disabled={uploading}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        <CameraPlus size={18} /> {uploading ? 'Uploading…' : 'Add after photo'}
      </button>
    </div>
  )
}
