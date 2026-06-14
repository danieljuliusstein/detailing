'use client'

import { useRouter } from 'next/navigation'
import { CalendarPlus, FileText, PencilSimple, Link } from '@phosphor-icons/react'
import JobPhotosEntry from '@/components/jobs/JobPhotosEntry'
import { suggestNextServiceDate } from '@/lib/next-service'
import { normalizeReturnDays } from '@/lib/package-cadence'
import BackButton from '@/components/BackButton'
import ShareLinkActions from '@/components/portal/ShareLinkActions'
import {
  effectiveRate,
  fmtDetailed,
  jobExpensesForDisplay,
  marginPct,
  netProfit,
} from '@/lib/calculations'
import type { ExpenseLine, JobStatus, JobWithRelations } from '@/lib/types'

const statusConfig: Record<JobStatus | 'overdue', { label: string; badge: string }> = {
  scheduled: { label: 'Scheduled', badge: 'badge-scheduled' },
  in_progress: { label: 'In progress', badge: 'badge-pending' },
  completed: { label: 'Completed', badge: 'badge-draft' },
  invoiced: { label: 'Invoice sent', badge: 'badge-pending' },
  paid: { label: 'Paid', badge: 'badge-paid' },
  overdue: { label: 'Overdue', badge: 'badge-overdue' },
}

const expenseLabel: Record<ExpenseLine['category'], string> = {
  supplies: 'Supplies used',
  travel: 'Gas/travel',
  equipment: 'Equipment',
  marketing: 'Marketing',
  labor: 'Labor',
  other: 'Other',
}

interface JobDetailProps {
  job: JobWithRelations
}

export default function JobDetail({ job }: JobDetailProps) {
  const router = useRouter()
  const expenses = jobExpensesForDisplay(job)
  const profit = netProfit(job)
  const rate = effectiveRate(job)
  const margin = marginPct(job)

  const displayStatus =
    job.invoice?.status === 'overdue'
      ? 'overdue'
      : job.status
  const status = statusConfig[displayStatus]

  const payments = job.invoice?.payments ?? []
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0)
  const balanceDue = (job.revenue + job.tip) - totalPaid

  const invoiceNumber = job.invoice?.invoice_number ?? '—'

  const showNextService =
    (job.status === 'completed' || job.status === 'paid' || job.status === 'invoiced') &&
    job.package &&
    job.client
  const returnDays = normalizeReturnDays(job.package?.expected_return_days)
  const nextServiceDate = showNextService ? suggestNextServiceDate(job.date, returnDays) : null

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20, gap: 12 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {job.client?.name ?? 'Unknown client'}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            {invoiceNumber} · {new Date(job.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <span className={`badge ${status.badge}`}>{status.label}</span>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {[
            ['Package', job.package?.name ?? '—'],
            ['Vehicle', `${job.vehicle_type.charAt(0).toUpperCase() + job.vehicle_type.slice(1)}`],
            ['Location', job.location_type.charAt(0).toUpperCase() + job.location_type.slice(1)],
            ['Hours worked', job.hours_worked > 0 ? `${job.hours_worked} hrs` : '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Revenue</span>
          <span className="money" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{fmtDetailed(job.revenue)}</span>
        </div>
        {job.tip > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Tip</span>
            <span className="money" style={{ fontSize: 13, color: 'var(--text-primary)' }}>{fmtDetailed(job.tip)}</span>
          </div>
        )}

        {expenses.length > 0 && <div className="divider" />}

        {expenses.map((exp, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {expenseLabel[exp.category]}
              {exp.description ? ` · ${exp.description}` : ''}
            </span>
            <span className="money money-negative" style={{ fontSize: 13 }}>−{fmtDetailed(exp.amount)}</span>
          </div>
        ))}

        <div className="divider" />

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>Net profit</span>
          <span className={`money ${profit >= 0 ? 'money-positive' : 'money-negative'}`} style={{ fontSize: 15, fontWeight: 700 }}>
            {fmtDetailed(profit)}
          </span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Margin <span className="money" style={{ color: margin >= 50 ? 'var(--green)' : margin >= 30 ? 'var(--amber)' : 'var(--red)' }}>{margin}%</span>
          </span>
          {rate !== null && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Effective rate <span className="money" style={{ color: 'var(--text-secondary)' }}>${rate.toFixed(2)}/hr</span>
            </span>
          )}
        </div>
      </div>

      {(job.status === 'invoiced' || job.status === 'paid' || job.invoice) && payments.length > 0 && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-title" style={{ marginBottom: 10 }}>Payments</div>
          {payments.map((p, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {p.method} · {new Date(p.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
              <span className="money money-positive" style={{ fontSize: 13 }}>{fmtDetailed(p.amount)}</span>
            </div>
          ))}
          {balanceDue > 0 && job.invoice && (
            <>
              <div className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--amber)' }}>Balance due</span>
                <span className="money" style={{ fontSize: 13, fontWeight: 700, color: 'var(--amber)' }}>{fmtDetailed(balanceDue)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {nextServiceDate && job.client && job.package && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-title">Next service</div>
          <div style={{ fontSize: 14, marginBottom: 10 }}>
            Suggested:{' '}
            {new Date(nextServiceDate + 'T12:00:00').toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}> ({returnDays}-day cadence)</span>
          </div>
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onClick={() =>
              router.push(
                `/jobs/new?clientId=${job.client_id}&packageId=${job.package_id}&date=${nextServiceDate}`
              )
            }
          >
            <CalendarPlus size={18} /> Book next
          </button>
        </div>
      )}

      <button
        className="btn-ghost"
        onClick={() => router.push(`/jobs/${job.id}/invoice`)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          padding: '14px 8px',
          width: '100%',
          marginBottom: 10,
        }}
      >
        <FileText size={22} weight="regular" color="var(--text-secondary)" aria-hidden="true" />
        <span style={{ fontSize: 12 }}>Invoice</span>
      </button>

      <JobPhotosEntry job={job} onPress={() => router.push(`/jobs/${job.id}/photos`)} />

      {job.notes && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-title">Notes</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{job.notes}</div>
        </div>
      )}

      {job.client && (
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link size={18} /> Client portal link
          </div>
          <ShareLinkActions
            clientId={job.client_id}
            clientEmail={job.client.email}
            clientName={job.client.name}
            jobId={job.id}
            scope="full"
            emailMessage="View your service details, invoice, and photos using the secure link below."
          />
        </div>
      )}

      <button className="btn-ghost" onClick={() => router.push(`/jobs/${job.id}/edit`)} style={{ width: '100%', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <PencilSimple size={16} weight="regular" color="var(--text-secondary)" />
        Edit job
      </button>
    </div>
  )
}
