import Image from 'next/image'

interface AppLogoProps {
  size?: number
  className?: string
  priority?: boolean
}

export default function AppLogo({ size = 48, className = '', priority = false }: AppLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Detailing"
      width={size}
      height={size}
      className={className}
      priority={priority}
      style={{ display: 'block' }}
    />
  )
}
