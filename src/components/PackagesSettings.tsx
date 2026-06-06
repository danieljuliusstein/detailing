'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PencilSimple, Plus } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { createPackage, getAllPackages, updatePackage } from '@/lib/api'
import { fmt } from '@/lib/calculations'
import type { Package } from '@/lib/types'

export default function PackagesSettings() {
  const router = useRouter()
  const [packages, setPackages] = useState<Package[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [description, setDescription] = useState('')

  const load = async () => setPackages(await getAllPackages())
  useEffect(() => { load() }, [])

  const startEdit = (pkg: Package) => {
    setEditingId(pkg.id)
    setName(pkg.name)
    setPrice(pkg.base_price)
    setDescription(pkg.description ?? '')
    setShowAdd(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setName('')
    setPrice(0)
    setDescription('')
  }

  const handleToggle = async (pkg: Package) => {
    await updatePackage(pkg.id, { active: !pkg.active })
    await load()
  }

  const handleSaveEdit = async () => {
    if (!editingId || !name.trim()) return
    await updatePackage(editingId, {
      name: name.trim(),
      base_price: price,
      description: description.trim() || undefined,
    })
    cancelEdit()
    await load()
  }

  const handleAdd = async () => {
    if (!name.trim()) return
    await createPackage({
      name: name.trim(),
      base_price: price,
      description: description.trim() || undefined,
      active: true,
    })
    setShowAdd(false)
    setName('')
    setPrice(0)
    setDescription('')
    await load()
  }

  return (
    <div className="screen page-content">
      <div style={{ display: 'flex', alignItems: 'center', paddingTop: 16, paddingBottom: 20, gap: 12 }}>
        <BackButton onClick={() => router.back()} />
        <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Services &amp; pricing</div>
        <button
          onClick={() => { setShowAdd(!showAdd); cancelEdit() }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          aria-label="Add service"
        >
          <Plus size={22} color="var(--green)" />
        </button>
      </div>

      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.5 }}>
        Set base prices for each service. New jobs use these as defaults — you can still override per job.
      </div>

      {(showAdd || editingId) && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="section-title">{editingId ? 'Edit service' : 'New service'}</div>
          <input className="input" placeholder="Service name" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            className="input"
            type="number"
            min={0}
            step={1}
            placeholder="Price"
            value={price || ''}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
          <input className="input" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={() => { showAdd ? setShowAdd(false) : cancelEdit() }} style={{ flex: 1 }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={editingId ? handleSaveEdit : handleAdd} style={{ flex: 1 }}>
              {editingId ? 'Save' : 'Add service'}
            </button>
          </div>
        </div>
      )}

      {packages.map((pkg) => (
        <div key={pkg.id} className="card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, opacity: pkg.active ? 1 : 0.5 }}>{pkg.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {fmt(pkg.base_price)}{pkg.description ? ` · ${pkg.description}` : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <button
              className="btn-ghost"
              onClick={() => startEdit(pkg)}
              style={{ fontSize: 12, padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <PencilSimple size={14} weight="bold" />
              Edit
            </button>
            <button className="btn-ghost" onClick={() => handleToggle(pkg)} style={{ fontSize: 12, padding: '6px 12px' }}>
              {pkg.active ? 'Active' : 'Inactive'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
