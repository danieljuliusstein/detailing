import type { InputHTMLAttributes, ReactNode } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode
  wrapClassName?: string
}

export default function Input({ icon, wrapClassName = '', className = 'input', ...props }: InputProps) {
  if (!icon) {
    return <input className={className} {...props} />
  }

  return (
    <div className={`book-input-wrap ${wrapClassName}`.trim()}>
      <span className="book-input-icon" aria-hidden="true">
        {icon}
      </span>
      <input className={className} {...props} />
    </div>
  )
}
