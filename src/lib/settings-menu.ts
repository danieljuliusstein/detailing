import type { Icon as PhosphorIcon } from '@phosphor-icons/react'
import {
  Bell,
  CurrencyDollar,
  Package,
  Receipt,
  Shield,
  Sparkle,
  Storefront,
  Wallet,
} from '@phosphor-icons/react'

export type SettingsIconTone = 'green' | 'amber' | 'blue' | 'purple'

export interface SettingsMenuItem {
  id: string
  group: 'business' | 'preferences' | 'management'
  title: string
  subtitle: string
  href: string
  Icon: PhosphorIcon
  tone: SettingsIconTone
  searchKeys: string[]
}

export const SETTINGS_MENU_GROUPS = [
  { id: 'business', label: 'Business' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'management', label: 'Management' },
] as const

export const SETTINGS_MENU_ITEMS: SettingsMenuItem[] = [
  {
    id: 'business',
    group: 'business',
    title: 'Your business',
    subtitle: 'Profile and online booking',
    href: '/settings/business',
    Icon: Storefront,
    tone: 'green',
    searchKeys: [
      'booking',
      'logo',
      'brand',
      'business',
      'company',
      'phone',
      'email',
      'address',
      'contact',
      'profile',
    ],
  },
  {
    id: 'invoicing',
    group: 'business',
    title: 'Invoicing',
    subtitle: 'Invoice and quote footer text',
    href: '/settings/invoicing',
    Icon: Receipt,
    tone: 'amber',
    searchKeys: ['terms', 'footer', 'invoice', 'quote'],
  },
  {
    id: 'preferences',
    group: 'preferences',
    title: 'App preferences',
    subtitle: 'Reminders and notifications',
    href: '/settings/preferences',
    Icon: Bell,
    tone: 'blue',
    searchKeys: ['notification', 'reminder', 'push', 'tour', 'walkthrough'],
  },
  {
    id: 'access',
    group: 'preferences',
    title: 'Access and data',
    subtitle: 'PIN, backups, and exports',
    href: '/settings/access',
    Icon: Shield,
    tone: 'purple',
    searchKeys: ['pin', 'password', 'backup', 'export', 'privacy'],
  },
  {
    id: 'inventory',
    group: 'management',
    title: 'Inventory',
    subtitle: 'Supplies and stock',
    href: '/inventory',
    Icon: Package,
    tone: 'amber',
    searchKeys: ['inventory', 'supplies', 'stock'],
  },
  {
    id: 'packages',
    group: 'management',
    title: 'Service packages',
    subtitle: 'Manage your offerings',
    href: '/settings/packages',
    Icon: Sparkle,
    tone: 'blue',
    searchKeys: ['packages', 'services', 'pricing'],
  },
  {
    id: 'invoices',
    group: 'management',
    title: 'All invoices',
    subtitle: 'Financial records',
    href: '/invoices',
    Icon: CurrencyDollar,
    tone: 'green',
    searchKeys: ['invoices', 'money', 'billing'],
  },
  {
    id: 'expenses',
    group: 'management',
    title: 'Expenses',
    subtitle: 'Overhead and business costs',
    href: '/settings/expenses',
    Icon: Wallet,
    tone: 'purple',
    searchKeys: ['expenses', 'overhead', 'business costs'],
  },
]
