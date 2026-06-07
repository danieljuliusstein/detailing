'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, FileText, Flask, Receipt, Warehouse } from '@phosphor-icons/react'
import { useQuickAction } from '@/providers/QuickActionContext'
import { lockBodyScroll, unlockBodyScroll } from '@/lib/body-scroll-lock'

interface ActionItem {
  id: string
  label: string
  subtitle: string
  Icon: typeof Briefcase
  onSelect: () => void
}

export default function QuickActionMenu() {
  const router = useRouter()
  const { menuOpen, closeMenu, openExpenseSheet, openSupplyPurchaseSheet } = useQuickAction()
  const firstActionRef = useRef<HTMLButtonElement>(null)

  const actions: ActionItem[] = [
    {
      id: 'new-job',
      label: 'New job',
      subtitle: 'Schedule a detail and log revenue',
      Icon: Briefcase,
      onSelect: () => {
        closeMenu()
        router.push('/jobs/new')
      },
    },
    {
      id: 'new-quote',
      label: 'New quote',
      subtitle: 'Send an estimate to a client',
      Icon: FileText,
      onSelect: () => {
        closeMenu()
        router.push('/quotes/new')
      },
    },
    {
      id: 'log-expense',
      label: 'Log business expense',
      subtitle: 'One-time payment like LLC renewal',
      Icon: Receipt,
      onSelect: openExpenseSheet,
    },
    {
      id: 'buy-supplies',
      label: 'Buy supplies',
      subtitle: 'Chemicals and consumables → expense + inventory',
      Icon: Flask,
      onSelect: openSupplyPurchaseSheet,
    },
    {
      id: 'inventory',
      label: 'Inventory',
      subtitle: 'Chemicals, equipment, supplies & wish list',
      Icon: Warehouse,
      onSelect: () => {
        closeMenu()
        router.push('/inventory')
      },
    },
  ]

  useEffect(() => {
    if (!menuOpen) return
    lockBodyScroll()
    firstActionRef.current?.focus()
    return () => {
      unlockBodyScroll()
    }
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen, closeMenu])

  if (!menuOpen) return null

  return (
    <div className="quick-action-root" role="presentation">
      <button
        type="button"
        className="quick-action-backdrop"
        onClick={closeMenu}
        aria-label="Close quick actions"
      />
      <div className="quick-action-sheet" role="menu" aria-label="Quick actions">
        <div className="quick-action-sheet-handle" />
        <div className="quick-action-sheet-title">Quick actions</div>
        {actions.map((action, index) => {
          const { Icon } = action
          return (
            <button
              key={action.id}
              ref={index === 0 ? firstActionRef : undefined}
              type="button"
              role="menuitem"
              className="quick-action-row"
              onClick={action.onSelect}
            >
              <span className="quick-action-row-icon">
                <Icon size={22} weight="duotone" color="var(--green)" aria-hidden="true" />
              </span>
              <span className="quick-action-row-text">
                <span className="quick-action-row-label">{action.label}</span>
                <span className="quick-action-row-subtitle">{action.subtitle}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
