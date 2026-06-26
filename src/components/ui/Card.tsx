import type { HTMLAttributes, ReactNode } from 'react'

type CardVariant = 'default' | 'pressable'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  children: ReactNode
}

export default function Card({ variant = 'default', className = '', children, ...props }: CardProps) {
  const base = variant === 'pressable' ? 'card-pressable' : 'card'
  return (
    <div className={[base, className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  )
}
