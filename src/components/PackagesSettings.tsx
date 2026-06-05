'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import { createPackage, getAllPackages, updatePackage } from '@/lib/api'
import { fmt } from '@/lib/calculations'
import type { Package } from '@/lib/types'

export default function PackagesSettings() {
  const router = useRouter()
  const [packages, setPackages] = useState<Package[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [price, setPrice] = useState(0)
  const [description, setDescription] = useState('')

  const load = async () => setPackages(await getAllPackages())
  useEffect(() => { load() }, [])

  const handleToggle = async (pkg: Package) => {
    await updatePackage(pkg.id, { active: !pkg.active })
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
        <div style={{ flex: 1, fontSize: 18, fontWeight: 600 }}>Packages</div>
        <button onClick={() => setShowAdd(!showAdd)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} aria-label="Add package">
          <Plus size={22} color="var(--green)" />
        </button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input className="input" placeholder="Package name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" type="number" placeholder="Base price" value={price || ''} onChange={(e) => setPrice(Number(e.target.value))} />
          <input className="input" placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <button className="btn-primary" onClick={handleAdd}>Add package</button>
        </div>
      )}

      {packages.map((pkg) => (
        <div key={pkg.id} className="card" style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, opacity: pkg.active ? 1 : 0.5 }}>{pkg.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {fmt(pkg.base_price)}{pkg.description ? ` · ${pkg.description}` : ''}
            </div>
          </div>
          <button className="btn-ghost" onClick={() => handleToggle(pkg)} style={{ fontSize: 12, padding: '6px 12px' }}>
            {pkg.active ? 'Active' : 'Inactive'}
          </button>
        </div>
      ))}
    </div>
  )
}
