'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  SquaresFour,
  Briefcase,
  Users,
  ChartBar,
  Plus,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import { useQuickAction } from '@/providers/QuickActionContext'

interface NavItem {
  href: string
  label: string
  Icon: PhosphorIcon
}

const LEFT_TABS: NavItem[] = [
  { href: '/', label: 'Home', Icon: SquaresFour },
  { href: '/jobs', label: 'Jobs', Icon: Briefcase },
]

const RIGHT_TABS: NavItem[] = [
  { href: '/clients', label: 'Clients', Icon: Users },
  { href: '/reports', label: 'Reports', Icon: ChartBar },
]

function NavTab({ tab, active }: { tab: NavItem; active: boolean }) {
  const { Icon } = tab
  return (
    <Link
      href={tab.href}
      className={`bottom-nav-tab${active ? ' active' : ''}`}
      aria-current={active ? 'page' : undefined}
    >
      <span className="bottom-nav-tab-icon">
        <Icon
          size={22}
          weight={active ? 'fill' : 'regular'}
          color={active ? 'var(--green)' : 'var(--text-dim)'}
          aria-hidden="true"
          style={{ transition: 'color 150ms ease' }}
        />
      </span>
      <span className="bottom-nav-tab-label">{tab.label}</span>
    </Link>
  )
}

export default function BottomNav() {
  const pathname = usePathname()
  const { menuOpen, openMenu, closeMenu } = useQuickAction()

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  if (pathname === '/auth' || pathname.startsWith('/jobs/new') || pathname.startsWith('/settings')) return null

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {LEFT_TABS.map((tab) => (
        <NavTab key={tab.href} tab={tab} active={isActive(tab.href)} />
      ))}

      <div className="bottom-nav-fab">
        <button
          type="button"
          className={`bottom-nav-fab-link${menuOpen ? ' bottom-nav-fab-link--open' : ''}`}
          aria-label={menuOpen ? 'Close quick actions' : 'Quick actions'}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={() => (menuOpen ? closeMenu() : openMenu())}
        >
          <Plus size={24} weight="bold" color="#071407" aria-hidden="true" />
        </button>
      </div>

      {RIGHT_TABS.map((tab) => (
        <NavTab key={tab.href} tab={tab} active={isActive(tab.href)} />
      ))}
    </nav>
  )
}
