import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import type { PLReport } from '@/lib/api/aggregates'
import { EXPENSE_LABELS, EXPENSE_ORDER } from '@/lib/reports-metrics'

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#111' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#555', marginBottom: 20 },
  section: { fontSize: 9, color: '#777', textTransform: 'uppercase', marginBottom: 8, marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { fontSize: 11, color: '#333' },
  rowValue: { fontSize: 11 },
  expense: { fontSize: 10, color: '#555' },
  expenseValue: { fontSize: 10, color: '#c44' },
  divider: { borderBottomWidth: 1, borderBottomColor: '#ddd', marginVertical: 10 },
  profit: { fontSize: 13, fontWeight: 'bold', color: '#1a7a3a' },
  muted: { fontSize: 9, color: '#888', marginTop: 20 },
})

function money(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

interface Props {
  report: PLReport
  periodLabel: string
  businessName: string
}

export default function ReportPdfDocument({ report, periodLabel, businessName }: Props) {
  const expenseRows = EXPENSE_ORDER.map((key) => ({
    label: EXPENSE_LABELS[key],
    amount: report.expenses[key],
  })).filter((r) => r.amount > 0)

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{businessName}</Text>
        <Text style={styles.subtitle}>Profit &amp; Loss — {periodLabel}</Text>

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Jobs in range</Text>
          <Text style={styles.rowValue}>{report.jobCount}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.rowLabel}>Revenue</Text>
          <Text style={styles.rowValue}>{money(report.revenue)}</Text>
        </View>

        <Text style={styles.section}>Expenses</Text>
        {expenseRows.map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.expense}>{row.label}</Text>
            <Text style={styles.expenseValue}>−{money(row.amount)}</Text>
          </View>
        ))}
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Total expenses</Text>
          <Text style={styles.expenseValue}>−{money(report.totalExpenses)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <Text style={styles.profit}>Net profit</Text>
          <Text style={styles.profit}>{money(report.netProfit)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Margin</Text>
          <Text style={styles.rowValue}>{report.marginPct}%</Text>
        </View>

        <Text style={styles.muted}>Generated {new Date().toLocaleString()}</Text>
      </Page>
    </Document>
  )
}
