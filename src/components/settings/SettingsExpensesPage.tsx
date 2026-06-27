'use client'

import { useRouter } from 'next/navigation'
import { CaretRight, CurrencyDollar, Wallet } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { useSettingsBack } from '@/hooks/useSettingsBack'
import SettingsFooter from './SettingsFooter'

const EXPENSE_ITEMS = [
  {
    id: 'overhead',
    title: 'Overhead expenses',
    subtitle: 'Rent, insurance, subscriptions',
    href: '/settings/overhead',
    Icon: Wallet,
    tone: 'purple' as const,
  },
  {
    id: 'business',
    title: 'Business expenses',
    subtitle: 'One-off costs and purchases',
    href: '/settings/business-expenses',
    Icon: CurrencyDollar,
    tone: 'green' as const,
  },
]

export default function SettingsExpensesPage() {
  const router = useRouter()
  const goBack = useSettingsBack()

  return (
    <div className="screen page-content settings-screen">
      <header className="settings-header">
        <BackButton onClick={goBack} />
        <h1 className="settings-header__title">Expenses</h1>
      </header>

      <div className="settings-hub">
        <div className="settings-menu-group">
          {EXPENSE_ITEMS.map((item) => {
            const Icon = item.Icon
            return (
              <button
                key={item.id}
                type="button"
                className="settings-menu-item"
                onClick={() => router.push(item.href)}
              >
                <span className={`settings-menu-icon settings-menu-icon--${item.tone}`}>
                  <Icon size={18} weight="duotone" aria-hidden="true" />
                </span>
                <span className="settings-menu-text">
                  <span className="settings-menu-title">{item.title}</span>
                  <span className="settings-menu-sub">{item.subtitle}</span>
                </span>
                <CaretRight size={16} className="settings-menu-chevron" aria-hidden="true" />
              </button>
            )
          })}
        </div>
      </div>

      <SettingsFooter showSave={false} />
    </div>
  )
}
