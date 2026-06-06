'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import BackButton from '@/components/BackButton'
import { createClient, updateClient } from '@/lib/api'
import type { Client, ClientInput } from '@/lib/types'

const LEAD_SOURCES = ['google', 'referral', 'instagram', 'facebook', 'tiktok', 'word_of_mouth', 'other']

interface Props {
  client?: Client
}

export default function ClientForm({ client }: Props) {
  const router = useRouter()
  const isEdit = !!client
  const [name, setName] = useState(client?.name ?? '')
  const [phone, setPhone] = useState(client?.phone ?? '')
  const [email, setEmail] = useState(client?.email ?? '')
  const [address, setAddress] = useState(client?.address ?? '')
  const [leadSource, setLeadSource] = useState(client?.lead_source ?? '')
  const [notes, setNotes] = useState(client?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const buildInput = (): ClientInput => ({
    name,
    phone: phone || undefined,
    email: email || undefined,
    address: address || undefined,
    lead_source: leadSource || undefined,
    notes: notes || undefined,
  })

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (isEdit && client) {
        const updated = await updateClient(client.id, buildInput())
        if (!updated) throw new Error('Update failed')
        router.push(`/clients/${client.id}`)
      } else {
        const created = await createClient(buildInput())
        router.push(`/clients/${created.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20, gap: 12 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ fontSize: 18, fontWeight: 600 }}>{isEdit ? 'Edit client' : 'New client'}</div>
      </div>

      <div className="card" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {([
          ['Name', name, setName, 'text'],
          ['Phone', phone, setPhone, 'tel'],
          ['Email', email, setEmail, 'email'],
          ['Address', address, setAddress, 'text'],
        ] as const).map(([label, value, setter, type]) => (
          <div key={label}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
            <input className="input" type={type} value={value} onChange={(e) => setter(e.target.value)} />
          </div>
        ))}
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Lead source</div>
          <select className="input" value={leadSource} onChange={(e) => setLeadSource(e.target.value)}>
            <option value="">—</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Notes</div>
          <textarea className="input" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ resize: 'vertical' }} />
        </div>
      </div>

      {error && <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{error}</div>}

      <button className="btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create client'}
      </button>
    </div>
  )
}
