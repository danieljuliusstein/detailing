import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'ghost' | 'danger'

const variantClass: Record<ButtonVariant, string> = {
  primary: 'btn-primary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  children: ReactNode
}

export default function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  const classes = [variantClass[variant], className].filter(Boolean).join(' ')
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}
