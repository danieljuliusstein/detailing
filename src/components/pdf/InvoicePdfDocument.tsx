import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { AppSettings } from '@/lib/settings'
import type { JobWithRelations, Invoice } from '@/lib/types'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#111' },
  header: { marginBottom: 24 },
  businessName: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  muted: { fontSize: 10, color: '#555', marginBottom: 2 },
  label: { fontSize: 9, color: '#777', textTransform: 'uppercase', marginBottom: 4 },
  invoiceNum: { fontSize: 12, fontFamily: 'Courier', marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#ddd', marginVertical: 12 },
  total: { fontSize: 14, fontWeight: 'bold' },
  footer: { fontSize: 9, color: '#666', marginTop: 24, lineHeight: 1.4 },
})

function money(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

interface Props {
  job: JobWithRelations
  invoice: Invoice
  settings: AppSettings
}

export default function InvoicePdfDocument({ job, invoice, settings }: Props) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.businessName}>{settings.business_name}</Text>
          {settings.business_phone ? <Text style={styles.muted}>{settings.business_phone}</Text> : null}
          {settings.business_email ? <Text style={styles.muted}>{settings.business_email}</Text> : null}
          {settings.business_address ? <Text style={styles.muted}>{settings.business_address}</Text> : null}
        </View>

        <Text style={styles.label}>Invoice</Text>
        <Text style={styles.invoiceNum}>{invoice.invoice_number}</Text>

        <Text style={styles.label}>Bill to</Text>
        <Text style={{ marginBottom: 12 }}>{job.client?.name ?? 'Client'}</Text>

        <Text style={styles.muted}>
          {new Date(job.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          {' · '}{job.vehicle_type} · {job.package?.name}
        </Text>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text>{job.package?.name}</Text>
          <Text>{money(job.revenue)}</Text>
        </View>
        {job.tip > 0 && (
          <View style={styles.row}>
            <Text>Tip</Text>
            <Text>{money(job.tip)}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.total}>Total</Text>
          <Text style={styles.total}>{money(invoice.total)}</Text>
        </View>

        {invoice.payments.length > 0 && (
          <>
            <View style={styles.divider} />
            <Text style={styles.label}>Payments</Text>
            {invoice.payments.map((p, i) => (
              <View key={i} style={styles.row}>
                <Text>{p.method} · {p.date}</Text>
                <Text>{money(p.amount)}</Text>
              </View>
            ))}
            {invoice.balance_due > 0 && (
              <View style={styles.row}>
                <Text>Balance due</Text>
                <Text>{money(invoice.balance_due)}</Text>
              </View>
            )}
          </>
        )}

        <Text style={styles.footer}>{settings.invoice_terms_footer}</Text>
      </Page>
    </Document>
  )
}
