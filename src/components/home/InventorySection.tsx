'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CaretDown,
  Flask,
  Package,
  PencilSimple,
  Star,
  Warehouse,
  Wrench,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react'
import InventoryEditSheet from './InventoryEditSheet'
import {
  countLowItems,
  deleteHomeInventoryItem,
  getItemsByCategory,
  loadHomeInventory,
  saveHomeInventory,
  upsertHomeInventoryItem,
  type HomeInventoryItem,
  type InventoryCategory,
  type InventoryStatus,
} from '@/lib/home-inventory'

type OpenSections = Record<InventoryCategory, boolean>

const SECTIONS: {
  key: InventoryCategory
  title: string
  Icon: PhosphorIcon
  iconBg: string
  iconColor: string
  addLabel: string
  hasStatus?: boolean
  isWishlist?: boolean
}[] = [
  { key: 'chemicals', title: 'Chemicals', Icon: Flask, iconBg: 'var(--green-dim)', iconColor: 'var(--green-text)', addLabel: 'chemical', hasStatus: true },
  { key: 'equipment', title: 'Equipment', Icon: Wrench, iconBg: 'var(--blue-dim)', iconColor: 'var(--blue-text)', addLabel: 'equipment' },
  { key: 'supplies', title: 'Supplies', Icon: Package, iconBg: 'var(--amber-dim)', iconColor: 'var(--amber-text)', addLabel: 'supply', hasStatus: true },
  { key: 'wishlist', title: 'Wish List', Icon: Star, iconBg: 'var(--red-dim)', iconColor: 'var(--amber-text)', addLabel: 'item', isWishlist: true },
]

function notifyLowStock(name: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(`You're running low on ${name} — time to restock`)
  } catch {
    // ignore
  }
}

function sectionSubtitle(
  section: (typeof SECTIONS)[number],
  sectionItems: HomeInventoryItem[]
): string {
  if (section.isWishlist) {
    const total = sectionItems.reduce((sum, i) => sum + (i.priceEstimate ?? 0), 0)
    return `$${total} total`
  }
  const low = sectionItems.filter((i) => i.status === 'low').length
  if (section.hasStatus) {
    return `${sectionItems.length} item${sectionItems.length === 1 ? '' : 's'} · ${low} low`
  }
  return `${sectionItems.length} item${sectionItems.length === 1 ? '' : 's'}`
}

function ItemRow({
  item,
  section,
  onEdit,
  showDivider,
}: {
  item: HomeInventoryItem
  section: (typeof SECTIONS)[number]
  onEdit: () => void
  showDivider: boolean
}) {
  return (
    <div className={`inv-item-row-wrap${showDivider ? ' inv-item-row-wrap--divider' : ''}`}>
      <button type="button" className="inv-item-row" onClick={onEdit}>
        <span className="inv-item-name">{item.name}</span>
        <div className="inv-item-row-right">
          {section.hasStatus && item.status && (
            <span className={`inv-status-badge inv-status-badge--${item.status}`}>
              {item.status === 'low' ? 'LOW' : 'OK'}
            </span>
          )}
          {section.isWishlist && (
            <span className="inv-item-price">${item.priceEstimate ?? 0}</span>
          )}
          <span className="inv-item-edit" aria-hidden>
            <PencilSimple size={14} weight="bold" color="var(--text-dim)" />
          </span>
        </div>
      </button>
    </div>
  )
}

export default function InventorySection() {
  const [items, setItems] = useState<HomeInventoryItem[]>([])
  const [inventoryOpen, setInventoryOpen] = useState(true)
  const [openSections, setOpenSections] = useState<OpenSections>({
    chemicals: true,
    equipment: true,
    supplies: true,
    wishlist: true,
  })
  const [editingItem, setEditingItem] = useState<HomeInventoryItem | null>(null)
  const [addingCategory, setAddingCategory] = useState<InventoryCategory | null>(null)

  useEffect(() => {
    setItems(loadHomeInventory())
  }, [])

  const lowCount = useMemo(() => countLowItems(items), [items])
  const totalItems = items.length

  const persist = useCallback((next: HomeInventoryItem[]) => {
    setItems(next)
    saveHomeInventory(next)
  }, [])

  const toggleSection = (key: InventoryCategory) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const expandAll = () => {
    setInventoryOpen(true)
    setOpenSections({ chemicals: true, equipment: true, supplies: true, wishlist: true })
  }

  const openEdit = (item: HomeInventoryItem) => {
    setAddingCategory(null)
    setEditingItem(item)
  }

  const handleSave = (data: {
    name: string
    status?: InventoryStatus
    notes: string
    priceEstimate?: number
  }) => {
    const category = addingCategory ?? editingItem?.category
    if (!category) return

    const previousStatus = editingItem?.status
    const next = upsertHomeInventoryItem(items, {
      id: editingItem?.id,
      name: data.name,
      category,
      status: data.status,
      notes: data.notes,
      priceEstimate: data.priceEstimate,
    })
    persist(next)

    if (data.status === 'low' && previousStatus !== 'low') {
      notifyLowStock(data.name)
    }

    setEditingItem(null)
    setAddingCategory(null)
  }

  const handleDelete = (id: string) => {
    persist(deleteHomeInventoryItem(items, id))
    setEditingItem(null)
  }

  const sheetOpen = Boolean(editingItem || addingCategory)

  return (
    <section className="inv-section">
      <div className="inv-section-label">INVENTORY</div>

      <div className="inv-dropdown-card inv-dropdown-card--outer">
        <button
          type="button"
          className="inv-dropdown-header"
          onClick={() => setInventoryOpen((o) => !o)}
        >
          <div className="inv-dropdown-header-left">
            <span className="inv-dropdown-icon" style={{ background: 'var(--bg-surface-hover)' }}>
              <Warehouse size={18} weight="duotone" color="var(--green-text)" />
            </span>
            <div>
              <div className="inv-dropdown-title">Inventory</div>
              <div className="inv-dropdown-subtitle">
                {totalItems} item{totalItems === 1 ? '' : 's'}
                {lowCount > 0 ? ` · ${lowCount} low` : ''}
              </div>
            </div>
          </div>
          <span className={`inv-chevron${inventoryOpen ? ' inv-chevron--open' : ''}`}>
            <CaretDown size={12} weight="bold" color="var(--text-dim)" />
          </span>
        </button>

        {inventoryOpen && (
          <div className="inv-dropdown-body inv-dropdown-body--outer">
            {lowCount > 0 && (
              <button type="button" className="inv-alert-banner inv-alert-banner--nested" onClick={expandAll}>
                <span className="inv-alert-dot" />
                <span className="inv-alert-text">
                  <strong>{lowCount}</strong> item{lowCount === 1 ? '' : 's'} are running low — tap to restock
                </span>
              </button>
            )}

            {SECTIONS.map((section) => {
              const sectionItems = getItemsByCategory(items, section.key)
              const isOpen = openSections[section.key]
              const { Icon } = section

              return (
                <div key={section.key} className="inv-sub-dropdown">
                  <button
                    type="button"
                    className="inv-sub-header"
                    onClick={() => toggleSection(section.key)}
                  >
                    <div className="inv-dropdown-header-left">
                      <span className="inv-dropdown-icon inv-dropdown-icon--sm" style={{ background: section.iconBg }}>
                        <Icon size={16} weight="duotone" color={section.iconColor} />
                      </span>
                      <div>
                        <div className="inv-sub-title">{section.title}</div>
                        <div className="inv-dropdown-subtitle">{sectionSubtitle(section, sectionItems)}</div>
                      </div>
                    </div>
                    <span className={`inv-chevron${isOpen ? ' inv-chevron--open' : ''}`}>
                      <CaretDown size={12} weight="bold" color="var(--text-dim)" />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="inv-sub-body">
                      {sectionItems.map((item, index) => (
                        <ItemRow
                          key={item.id}
                          item={item}
                          section={section}
                          onEdit={() => openEdit(item)}
                          showDivider={index < sectionItems.length - 1}
                        />
                      ))}

                      <button
                        type="button"
                        className="inv-add-row"
                        onClick={() => {
                          setEditingItem(null)
                          setAddingCategory(section.key)
                        }}
                      >
                        <span className="inv-add-btn">+</span>
                        <span className="inv-add-label">Add {section.addLabel}</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {sheetOpen && (
        <InventoryEditSheet
          item={editingItem}
          category={addingCategory ?? editingItem!.category}
          isNew={!editingItem}
          onSave={handleSave}
          onDelete={() => editingItem && handleDelete(editingItem.id)}
          onClose={() => {
            setEditingItem(null)
            setAddingCategory(null)
          }}
        />
      )}
    </section>
  )
}
