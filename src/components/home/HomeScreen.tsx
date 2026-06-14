'use client'

import { useRouter } from 'next/navigation'
import { Gear } from '@phosphor-icons/react'
import ComingUpCard from '@/components/home/ComingUpCard'
import InventoryAlertCard from '@/components/home/InventoryAlertCard'
import TodayJobCard from '@/components/home/TodayJobCard'
import { TipBannerOptional } from '@/components/home/TipBanner'
import type {
  ComingUpJobData,
  InventoryAlertData,
  TodayJobCardData,
} from '@/lib/home-dashboard'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

export interface HomeScreenProps {
  todayJob: TodayJobCardData | null
  inventoryAlert: InventoryAlertData | null
  comingUp: ComingUpJobData | null
  tipInsight: string | null
  onStartJob: (jobId: string) => void
}

export default function HomeScreen({
  todayJob,
  inventoryAlert,
  comingUp,
  tipInsight,
  onStartJob,
}: HomeScreenProps) {
  const router = useRouter()

  return (
    <div className="home-screen">
      <header className="page-header">
        <div>
          <h1 className="lg">{greeting()}</h1>
          <p>{todayLabel()}</p>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Settings"
          onClick={() => router.push('/settings')}
        >
          <Gear size={18} weight="regular" aria-hidden="true" />
        </button>
      </header>

      <p className="sec">Today&apos;s job</p>
      <TodayJobCard
        job={todayJob}
        onDirections={(address) => {
          window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank', 'noopener,noreferrer')
        }}
        onStart={onStartJob}
        onAddJob={() => router.push('/jobs/new')}
      />

      {inventoryAlert && (
        <InventoryAlertCard alert={inventoryAlert} onPress={() => router.push('/inventory')} />
      )}

      {comingUp && (
        <>
          <p className="sec">Coming up</p>
          <ComingUpCard job={comingUp} onPress={() => router.push(`/jobs/${comingUp.id}`)} />
        </>
      )}

      <TipBannerOptional text={tipInsight} />
    </div>
  )
}
