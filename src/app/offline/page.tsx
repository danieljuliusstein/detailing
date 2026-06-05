import { WifiSlash } from '@phosphor-icons/react/dist/ssr'

export default function OfflinePage() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#0f0f0f', color: '#f5f5f5' }}>
      <WifiSlash size={48} weight="duotone" color="#737373" aria-hidden="true" style={{ marginBottom: 16 }} />
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>You&apos;re offline</h1>
      <p style={{ fontSize: 14, color: '#737373', textAlign: 'center' }}>
        Reconnect to sync your latest data.
      </p>
    </div>
  )
}
