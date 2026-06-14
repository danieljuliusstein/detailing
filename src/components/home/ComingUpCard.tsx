'use client'

import { comingUpDetailsLine, type ComingUpJobData } from '@/lib/home-dashboard'

interface ComingUpCardProps {
  job: ComingUpJobData
  onPress: () => void
}

export default function ComingUpCard({ job, onPress }: ComingUpCardProps) {
  return (
    <button type="button" className="coming-up-card" onClick={onPress}>
      <div>
        <p className="coming-up-card__name">{job.clientName}</p>
        <p className="coming-up-card__details">{comingUpDetailsLine(job)}</p>
      </div>
      <p className="coming-up-card__datetime">{job.datetimeLabel}</p>
    </button>
  )
}
