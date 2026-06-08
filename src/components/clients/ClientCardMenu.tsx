'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarPlus, ChatCircle, DotsThreeVertical, Phone } from '@phosphor-icons/react'
import type { ClientWithStats } from '@/lib/types'

interface ClientCardMenuProps {
  client: ClientWithStats
}

export default function ClientCardMenu({ client }: ClientCardMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="client-card-menu" ref={rootRef}>
      <button
        type="button"
        className="client-card-menu-trigger"
        aria-label={`Actions for ${client.name}`}
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <DotsThreeVertical size={20} weight="bold" aria-hidden="true" />
      </button>

      {open && (
        <div className="client-card-menu-popover" role="menu" aria-label="Client actions">
          <a
            href={client.phone ? `tel:${client.phone}` : undefined}
            role="menuitem"
            className={`client-card-menu-item${client.phone ? '' : ' client-card-menu-item--disabled'}`}
            onClick={(e) => {
              e.stopPropagation()
              if (!client.phone) e.preventDefault()
              else setOpen(false)
            }}
          >
            <Phone size={16} aria-hidden="true" />
            Call
          </a>
          <a
            href={client.phone ? `sms:${client.phone}` : undefined}
            role="menuitem"
            className={`client-card-menu-item${client.phone ? '' : ' client-card-menu-item--disabled'}`}
            onClick={(e) => {
              e.stopPropagation()
              if (!client.phone) e.preventDefault()
              else setOpen(false)
            }}
          >
            <ChatCircle size={16} aria-hidden="true" />
            Text
          </a>
          <button
            type="button"
            role="menuitem"
            className="client-card-menu-item client-card-menu-item--primary"
            onClick={(e) => {
              e.stopPropagation()
              setOpen(false)
              router.push(`/jobs/new?clientId=${client.id}`)
            }}
          >
            <CalendarPlus size={16} aria-hidden="true" />
            Book job
          </button>
        </div>
      )}
    </div>
  )
}
