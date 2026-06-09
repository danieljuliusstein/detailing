const DEFAULT_LOGO = '/api/business-logo'

interface BusinessLogoProps {
  logoUrl?: string | null
  size?: number
  className?: string
}

export default function BusinessLogo({ logoUrl, size = 64, className = '' }: BusinessLogoProps) {
  const src = logoUrl?.trim() || DEFAULT_LOGO

  return (
    <span
      className={`business-logo-wrap ${className}`.trim()}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="business-logo"
        onError={(e) => {
          const img = e.currentTarget
          if (img.src.endsWith('/logo.png')) return
          img.src = '/logo.png'
        }}
      />
    </span>
  )
}
