'use client'

import { useEffect, useState } from 'react'
import { CaretRight, Images } from '@phosphor-icons/react'
import { getJobPhotos } from '@/lib/api'
import type { JobWithRelations } from '@/lib/types'

interface JobPhotosEntryProps {
  job: JobWithRelations
  onPress: () => void
}

export default function JobPhotosEntry({ job, onPress }: JobPhotosEntryProps) {
  const [beforeCount, setBeforeCount] = useState(0)
  const [afterCount, setAfterCount] = useState(0)

  useEffect(() => {
    getJobPhotos(job.id).then((photos) => {
      setBeforeCount(photos.filter((p) => p.type === 'before').length)
      setAfterCount(photos.filter((p) => p.type === 'after').length)
    })
  }, [job.id])

  const subtitle =
    beforeCount + afterCount > 0
      ? `${beforeCount} before · ${afterCount} after`
      : 'No photos yet'

  return (
    <button type="button" className="job-photos-entry" onClick={onPress}>
      <span className="job-photos-entry__icon">
        <Images size={20} weight="duotone" color="var(--green)" aria-hidden="true" />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <div className="job-photos-entry__title">Photos</div>
        <div className="job-photos-entry__sub">{subtitle}</div>
      </span>
      <CaretRight size={16} color="var(--text-dim)" aria-hidden="true" />
    </button>
  )
}
