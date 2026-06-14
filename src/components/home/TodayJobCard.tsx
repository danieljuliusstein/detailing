'use client'

import { CalendarBlank, MapPin } from '@phosphor-icons/react'
import { todayJobDetailsLine, type TodayJobCardData } from '@/lib/home-dashboard'

interface TodayJobCardProps {
  job: TodayJobCardData | null
  onDirections: (address: string) => void
  onStart: (jobId: string) => void
  onAddJob: () => void
}

export default function TodayJobCard({ job, onDirections, onStart, onAddJob }: TodayJobCardProps) {
  if (!job) {
    return (
      <div className="today-job-card today-job-card--empty">
        <CalendarBlank className="today-job-card__empty-icon" size={28} weight="duotone" />
        <p className="today-job-card__empty-text">No jobs scheduled for today</p>
        <button type="button" className="today-job-card__btn today-job-card__btn--start" onClick={onAddJob}>
          Schedule a job
        </button>
      </div>
    )
  }

  const hasAddress = Boolean(job.address?.trim())

  return (
    <div className="today-job-card">
      <div className="today-job-card__top">
        <div>
          <p className="today-job-card__client">{job.clientName}</p>
          <p className="today-job-card__details">{todayJobDetailsLine(job)}</p>
        </div>
        {job.startTimeLabel && <span className="today-job-card__time">{job.startTimeLabel}</span>}
      </div>

      {hasAddress && (
        <div className="today-job-card__row today-job-card__row--bordered">
          <MapPin className="today-job-card__row-icon" size={15} weight="duotone" />
          <p className="today-job-card__row-text">{job.address}</p>
        </div>
      )}

      <div className="today-job-card__actions">
        <button
          type="button"
          className="today-job-card__btn today-job-card__btn--directions"
          disabled={!hasAddress}
          onClick={() => job.address && onDirections(job.address)}
        >
          Directions
        </button>
        <button
          type="button"
          className="today-job-card__btn today-job-card__btn--start"
          onClick={() => onStart(job.id)}
        >
          {job.jobStatus === 'in_progress' ? 'View job' : 'Start job'}
        </button>
      </div>
    </div>
  )
}
