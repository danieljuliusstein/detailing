'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
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
import EquipmentEditSheet, { type EquipmentSheetMode } from '@/components/home/EquipmentEditSheet'
import InventoryEditSheet from '@/components/home/InventoryEditSheet'
import SupplyEditSheet, { type SupplySheetMode } from '@/components/home/SupplyEditSheet'
import SwipeableRow from '@/components/SwipeableRow'
import {
  createEquipment,
  createSupply,
  createSupplyPurchase,
  deleteEquipment,
  deleteSupply,
  getEquipment,
  getSupplies,
  restockSupply,
  updateEquipment,
  updateSupply,
} from '@/lib/api'
import { fmtDetailed } from '@/lib/calculations'
import {
  deleteHomeInventoryItem,
  getItemsByCategory,
  loadHomeInventory,
  saveHomeInventory,
  upsertHomeInventoryItem,
  type HomeInventoryItem,
} from '@/lib/home-inventory'
import { filterSuppliesByKind, isLowStock } from '@/lib/supplies-logic'
import type { Equipment, Supply, SupplyKind } from '@/lib/types'

type SectionKey = 'chemicals' | 'equipment' | 'supplies' | 'wishlist'
type OpenSections = Record<SectionKey, boolean>

const SECTIONS: {
  key: SectionKey
  title: string
  Icon: PhosphorIcon
  iconBg: string
  iconColor: string
  addLabel: string
  supplyKind?: SupplyKind
  isWishlist?: boolean
  isEquipment?: boolean
}[] = [
  {
    key: 'chemicals',
    title: 'Chemicals',
    Icon: Flask,
    iconBg: 'var(--green-dim)',
    iconColor: 'var(--green-text)',
    addLabel: 'chemical',
    supplyKind: 'chemical',
  },
  {
    key: 'equipment',
    title: 'Equipment',
    Icon: Wrench,
    iconBg: 'var(--blue-dim)',
    iconColor: 'var(--blue-text)',
    addLabel: 'equipment',
    isEquipment: true,
  },
  {
    key: 'supplies',
    title: 'Supplies',
    Icon: Package,
    iconBg: 'var(--amber-dim)',
    iconColor: 'var(--amber-text)',
    addLabel: 'supply',
    supplyKind: 'consumable',
  },
  {
    key: 'wishlist',
    title: 'Wish List',
    Icon: Star,
    iconBg: 'var(--red-dim)',
    iconColor: 'var(--amber-text)',
    addLabel: 'item',
    isWishlist: true,
  },
]

function InventoryItemRow({ onPress, children }: { onPress: () => void; children: ReactNode }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="inv-item-row"
      onClick={onPress}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onPress()
        }
      }}
    >
      {children}
    </div>
  )
}

function notifyLowStock(name: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    new Notification(`You're running low on ${name} — time to restock`)
  } catch {
    // ignore
  }
}

export default function InventoryPage() {
  const [catalog, setCatalog] = useState<Supply[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [wishlist, setWishlist] = useState<HomeInventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [openSections, setOpenSections] = useState<OpenSections>({
    chemicals: true,
    equipment: false,
    supplies: false,
    wishlist: false,
  })
  const [swipedRowId, setSwipedRowId] = useState<string | null>(null)

  const [editingSupply, setEditingSupply] = useState<Supply | null>(null)
  const [supplyKind, setSupplyKind] = useState<SupplyKind>('chemical')
  const [supplyMode, setSupplyMode] = useState<SupplySheetMode>('add')
  const [addingSupplyKind, setAddingSupplyKind] = useState<SupplyKind | null>(null)

  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null)
  const [equipmentMode, setEquipmentMode] = useState<EquipmentSheetMode>('add')
  const [addingEquipment, setAddingEquipment] = useState(false)

  const [editingWishlist, setEditingWishlist] = useState<HomeInventoryItem | null>(null)
  const [addingWishlist, setAddingWishlist] = useState(false)

  const reload = useCallback(async () => {
    const [supplies, equip] = await Promise.all([getSupplies(), getEquipment()])
    setCatalog(supplies)
    setEquipment(equip.filter((e) => (e.status ?? 'active') !== 'retired'))
    setWishlist(getItemsByCategory(loadHomeInventory(), 'wishlist'))
    setLoading(false)
  }, [])

  useEffect(() => {
    setWishlist(getItemsByCategory(loadHomeInventory(), 'wishlist'))
    reload()
  }, [reload])

  const lowCount = useMemo(() => catalog.filter(isLowStock).length, [catalog])
  const totalItems = catalog.length + equipment.length + wishlist.length

  const toggleSection = (key: SectionKey) => {
    setSwipedRowId(null)
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const expandLowStock = () => {
    setOpenSections({ chemicals: true, equipment: false, supplies: true, wishlist: false })
  }

  const openSupplyEdit = (supply: Supply, kind: SupplyKind) => {
    setSwipedRowId(null)
    setAddingSupplyKind(null)
    setEditingSupply(supply)
    setSupplyKind(kind)
    setSupplyMode('edit')
  }

  const openSupplyAdd = (kind: SupplyKind) => {
    setSwipedRowId(null)
    setEditingSupply(null)
    setAddingSupplyKind(kind)
    setSupplyKind(kind)
    setSupplyMode('add')
  }

  const handleSupplyDelete = async (id: string) => {
    await deleteSupply(id)
    await reload()
    setEditingSupply(null)
    setSwipedRowId(null)
  }

  const handleEquipmentDelete = async (id: string) => {
    await deleteEquipment(id)
    await reload()
    setEditingEquipment(null)
    setSwipedRowId(null)
  }

  const handleWishlistSave = (data: { name: string; notes: string; priceEstimate?: number }) => {
    const items = loadHomeInventory()
    const next = upsertHomeInventoryItem(items, {
      id: editingWishlist?.id,
      name: data.name,
      category: 'wishlist',
      notes: data.notes,
      priceEstimate: data.priceEstimate,
    })
    saveHomeInventory(next)
    setWishlist(getItemsByCategory(next, 'wishlist'))
    setEditingWishlist(null)
    setAddingWishlist(false)
  }

  const handleWishlistDelete = (id: string) => {
    const next = deleteHomeInventoryItem(loadHomeInventory(), id)
    saveHomeInventory(next)
    setWishlist(getItemsByCategory(next, 'wishlist'))
    setEditingWishlist(null)
    setSwipedRowId(null)
  }

  const supplySheetOpen = Boolean(editingSupply || addingSupplyKind)
  const equipmentSheetOpen = Boolean(editingEquipment || addingEquipment)
  const wishlistSheetOpen = Boolean(editingWishlist || addingWishlist)

  return (
    <div className="screen page-content inventory-page">
      <div className="inventory-page-header">
        <span className="inventory-page-icon">
          <Warehouse size={22} weight="duotone" color="var(--green-text)" />
        </span>
        <div className="inventory-page-header-text">
          <h1 className="inventory-page-title">Inventory</h1>
          <p className="inventory-page-subtitle">
            {loading ? 'Loading…' : `${totalItems} item${totalItems === 1 ? '' : 's'}`}
            {lowCount > 0 ? ` · ${lowCount} low` : ''}
          </p>
        </div>
      </div>

      {lowCount > 0 && (
        <button type="button" className="inv-alert-banner" onClick={expandLowStock}>
          <span className="inv-alert-dot" />
          <span className="inv-alert-text">
            <strong>{lowCount}</strong> item{lowCount === 1 ? '' : 's'} running low — tap to view
          </span>
        </button>
      )}

      <div className="inv-dropdown-card">
        {SECTIONS.map((section) => {
          const isOpen = openSections[section.key]
          const { Icon } = section

          const sectionItems = section.isWishlist
            ? wishlist
            : section.isEquipment
              ? equipment
              : filterSuppliesByKind(catalog, section.supplyKind!)

          const low = section.supplyKind
            ? sectionItems.filter((s) => isLowStock(s as Supply)).length
            : 0

          const subtitle = section.isWishlist
            ? `$${wishlist.reduce((sum, i) => sum + (i.priceEstimate ?? 0), 0)} total`
            : section.supplyKind
              ? `${sectionItems.length} item${sectionItems.length === 1 ? '' : 's'} · ${low} low`
              : `${sectionItems.length} item${sectionItems.length === 1 ? '' : 's'}`

          return (
            <div key={section.key} className="inv-sub-dropdown">
              <button type="button" className="inv-sub-header" onClick={() => toggleSection(section.key)}>
                <div className="inv-dropdown-header-left">
                  <span className="inv-dropdown-icon inv-dropdown-icon--sm" style={{ background: section.iconBg }}>
                    <Icon size={16} weight="duotone" color={section.iconColor} />
                  </span>
                  <div>
                    <div className="inv-sub-title">{section.title}</div>
                    <div className="inv-dropdown-subtitle">{subtitle}</div>
                  </div>
                </div>
                <span className={`inv-chevron${isOpen ? ' inv-chevron--open' : ''}`}>
                  <CaretDown size={12} weight="bold" color="var(--text-dim)" />
                </span>
              </button>

              {isOpen && (
                <div className="inv-sub-body">
                  {section.isWishlist &&
                    wishlist.map((item, index) => (
                      <SwipeableRow
                        key={item.id}
                        rowId={`wishlist-${item.id}`}
                        openRowId={swipedRowId}
                        onOpenChange={setSwipedRowId}
                        onEdit={() => {
                          setAddingWishlist(false)
                          setEditingWishlist(item)
                        }}
                        onDelete={() => handleWishlistDelete(item.id)}
                        deleteConfirmMessage={`Remove "${item.name}" from your wish list?`}
                        showDivider={index < wishlist.length - 1}
                      >
                        <InventoryItemRow
                          onPress={() => {
                            setSwipedRowId(null)
                            setAddingWishlist(false)
                            setEditingWishlist(item)
                          }}
                        >
                          <span className="inv-item-name">{item.name}</span>
                          <div className="inv-item-row-right">
                            <span className="inv-item-price">${item.priceEstimate ?? 0}</span>
                            <span className="inv-item-edit" aria-hidden>
                              <PencilSimple size={14} weight="bold" color="var(--text-dim)" />
                            </span>
                          </div>
                        </InventoryItemRow>
                      </SwipeableRow>
                    ))}

                  {section.isEquipment &&
                    equipment.map((item, index) => (
                      <SwipeableRow
                        key={item.id}
                        rowId={`equipment-${item.id}`}
                        openRowId={swipedRowId}
                        onOpenChange={setSwipedRowId}
                        onEdit={() => {
                          setAddingEquipment(false)
                          setEditingEquipment(item)
                          setEquipmentMode('edit')
                        }}
                        onDelete={() => handleEquipmentDelete(item.id)}
                        deleteConfirmMessage={`Delete "${item.name}" from equipment?`}
                        showDivider={index < equipment.length - 1}
                      >
                        <InventoryItemRow
                          onPress={() => {
                            setSwipedRowId(null)
                            setAddingEquipment(false)
                            setEditingEquipment(item)
                            setEquipmentMode('edit')
                          }}
                        >
                          <span className="inv-item-name">{item.name}</span>
                          <div className="inv-item-row-right">
                            {item.purchase_price != null && item.purchase_price > 0 && (
                              <span className="inv-item-price">{fmtDetailed(item.purchase_price)}</span>
                            )}
                            <span className="inv-item-edit" aria-hidden>
                              <PencilSimple size={14} weight="bold" color="var(--text-dim)" />
                            </span>
                          </div>
                        </InventoryItemRow>
                      </SwipeableRow>
                    ))}

                  {section.supplyKind &&
                    (sectionItems as Supply[]).map((item, index) => {
                      const lowStock = isLowStock(item)
                      return (
                        <SwipeableRow
                          key={item.id}
                          rowId={`supply-${item.id}`}
                          openRowId={swipedRowId}
                          onOpenChange={setSwipedRowId}
                          onEdit={() => openSupplyEdit(item, section.supplyKind!)}
                          onDelete={() => handleSupplyDelete(item.id)}
                          deleteConfirmMessage={`Delete "${item.name}" from inventory?`}
                          showDivider={index < sectionItems.length - 1}
                        >
                          <InventoryItemRow
                            onPress={() => {
                              setSwipedRowId(null)
                              openSupplyEdit(item, section.supplyKind!)
                            }}
                          >
                            <span className="inv-item-name">{item.name}</span>
                            <div className="inv-item-row-right">
                              <span style={{ fontSize: 11, color: 'var(--text-dim)', marginRight: 6 }}>
                                {item.quantity_on_hand} {item.unit}
                                {item.cost_per_unit != null && item.cost_per_unit > 0
                                  ? ` · ${fmtDetailed(item.cost_per_unit)}/${item.unit}`
                                  : ''}
                              </span>
                              <span className={`inv-status-badge inv-status-badge--${lowStock ? 'low' : 'ok'}`}>
                                {lowStock ? 'LOW' : 'OK'}
                              </span>
                              <span className="inv-item-edit" aria-hidden>
                                <PencilSimple size={14} weight="bold" color="var(--text-dim)" />
                              </span>
                            </div>
                          </InventoryItemRow>
                        </SwipeableRow>
                      )
                    })}

                  <button
                    type="button"
                    className="inv-add-row"
                    onClick={() => {
                      setSwipedRowId(null)
                      if (section.isWishlist) {
                        setEditingWishlist(null)
                        setAddingWishlist(true)
                      } else if (section.isEquipment) {
                        setEditingEquipment(null)
                        setAddingEquipment(true)
                        setEquipmentMode('add')
                      } else if (section.supplyKind) {
                        openSupplyAdd(section.supplyKind)
                      }
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

      {supplySheetOpen && (
        <SupplyEditSheet
          supply={editingSupply}
          kind={supplyKind}
          mode={supplyMode}
          onModeChange={setSupplyMode}
          onSaveAdd={async (input) => {
            await createSupply(input)
            await reload()
          }}
          onSaveEdit={async (id, input) => {
            const prev = catalog.find((s) => s.id === id)
            const wasLow = prev ? isLowStock(prev) : false
            await updateSupply(id, input)
            const updated = await getSupplies()
            const next = updated.find((s) => s.id === id)
            if (next && isLowStock(next) && !wasLow) notifyLowStock(next.name)
            await reload()
          }}
          onRestock={async (id, quantity, totalCost) => {
            const supply = catalog.find((s) => s.id === id)
            if (totalCost > 0 && supply) {
              await createSupplyPurchase({
                date: new Date().toISOString().slice(0, 10),
                name: supply.name,
                amount: totalCost,
                quantity,
                supply_id: id,
                vendor: supply.supplier,
              })
            } else {
              await restockSupply(id, { quantity, total_cost: totalCost || undefined })
            }
            await reload()
          }}
          onDelete={handleSupplyDelete}
          onClose={() => {
            setEditingSupply(null)
            setAddingSupplyKind(null)
          }}
        />
      )}

      {equipmentSheetOpen && (
        <EquipmentEditSheet
          item={editingEquipment}
          mode={equipmentMode}
          onSaveAdd={async (input) => {
            await createEquipment(input)
            await reload()
          }}
          onSaveEdit={async (id, input) => {
            await updateEquipment(id, input)
            await reload()
          }}
          onDelete={handleEquipmentDelete}
          onClose={() => {
            setEditingEquipment(null)
            setAddingEquipment(false)
          }}
        />
      )}

      {wishlistSheetOpen && (
        <InventoryEditSheet
          item={editingWishlist}
          category="wishlist"
          isNew={!editingWishlist}
          onSave={(data) =>
            handleWishlistSave({
              name: data.name,
              notes: data.notes,
              priceEstimate: data.priceEstimate,
            })
          }
          onDelete={() => editingWishlist && handleWishlistDelete(editingWishlist.id)}
          onClose={() => {
            setEditingWishlist(null)
            setAddingWishlist(false)
          }}
        />
      )}
    </div>
  )
}
