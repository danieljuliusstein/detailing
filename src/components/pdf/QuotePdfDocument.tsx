import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { AppSettings } from '@/lib/settings'
import type { QuoteWithRelations } from '@/lib/types'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#111' },
  header: { marginBottom: 24 },
  businessName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  muted: { fontSize: 10, color: '#555', marginBottom: 2 },
  label: { fontSize: 9, color: '#777', textTransform: 'uppercase', marginBottom: 4 },
  total: { fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  footer: { fontSize: 9, color: '#666', marginTop: 24, lineHeight: 1.4 },
})

function money(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default function QuotePdfDocument({
  quote,
  settings,
}: {
  quote: QuoteWithRelations
  settings: AppSettings
}) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.businessName}>{settings.business_name}</Text>
          {settings.business_phone ? <Text style={styles.muted}>{settings.business_phone}</Text> : null}
          {settings.business_email ? <Text style={styles.muted}>{settings.business_email}</Text> : null}
        </View>

        <Text style={styles.label}>Estimate</Text>
        <Text style={{ fontFamily: 'Courier', marginBottom: 12 }}>{quote.quote_number}</Text>

        <Text style={styles.label}>Prepared for</Text>
        <Text style={{ marginBottom: 12 }}>{quote.client?.name ?? 'Client'}</Text>

        <Text style={styles.muted}>
          {quote.package?.name} · {quote.vehicle_type} · {quote.location_type}
        </Text>
        <Text style={styles.muted}>
          Proposed date:{' '}
          {new Date(quote.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
        {quote.valid_until ? (
          <Text style={styles.muted}>
            Valid until:{' '}
            {new Date(quote.valid_until + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </Text>
        ) : null}

        <Text style={styles.total}>{money(quote.subtotal)}</Text>

        {quote.notes ? <Text style={{ marginTop: 16, lineHeight: 1.4 }}>{quote.notes}</Text> : null}

        {settings.invoice_terms_footer ? (
          <Text style={styles.footer}>{settings.invoice_terms_footer}</Text>
        ) : null}
      </Page>
    </Document>
  )
}
