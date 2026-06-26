import type { HTMLAttributes, ReactNode } from 'react'

export type BadgeStatus =
  | 'draft'
  | 'pending'
  | 'paid'
  | 'overdue'
  | 'scheduled'
  | 'completed'

const statusClass: Record<BadgeStatus, string> = {
  draft: 'badge-draft',
  pending: 'badge-pending',
  paid: 'badge-paid',
  overdue: 'badge-overdue',
  scheduled: 'badge-scheduled',
  completed: 'badge-draft',
}

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status?: BadgeStatus
  children: ReactNode
}

export default function Badge({ status, className = '', children, ...props }: BadgeProps) {
  const classes = ['badge', status ? statusClass[status] : '', className].filter(Boolean).join(' ')
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  )
}
