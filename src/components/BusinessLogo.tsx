const DEFAULT_LOGO = '/api/business-logo'

interface BusinessLogoProps {
  logoUrl?: string | null
  size?: number
  className?: string
}

export default function BusinessLogo({ logoUrl, size = 64, className = '' }: BusinessLogoProps) {
  const src = logoUrl?.trim() || DEFAULT_LOGO

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`business-logo ${className}`.trim()}
      aria-hidden="true"
      onError={(e) => {
        const img = e.currentTarget
        if (img.src.endsWith('/logo.png')) return
        img.src = '/logo.png'
      }}
    />
  )
}
