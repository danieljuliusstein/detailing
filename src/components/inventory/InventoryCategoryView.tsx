'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { CaretDown, ListBullets, MagnifyingGlass, Plus, SquaresFour } from '@phosphor-icons/react'
import BackButton from '@/components/BackButton'
import {
  EquipmentInventoryRow,
  SupplyInventoryRow,
  WishlistInventoryRow,
} from '@/components/inventory/InventoryRow'
import { EquipmentProductGrid, SupplyProductGrid } from '@/components/inventory/ProductGrid'
import {
  SECTION_CONFIG,
  defaultViewMode,
  filterBySearch,
  filterSuppliesList,
  groupSupplies,
  visibleItems,
  SUPPLY_FILTER_CHIPS,
  EQUIPMENT_FILTER_CHIPS,
  type CategoryViewMode,
  type SectionKey,
  type SupplyFilterChip,
} from '@/components/inventory/inventory-utils'
import { filterInventoryByExpenseTracking } from '@/lib/inventory-expense-logic'
import SwipeableRow from '@/components/SwipeableRow'
import { filterSuppliesByKind } from '@/lib/supplies-logic'
import type { HomeInventoryItem } from '@/lib/home-inventory'
import type { BusinessExpense, Equipment, Supply } from '@/lib/types'

interface InventoryCategoryViewProps {
  sectionKey: SectionKey
  catalog: Supply[]
  equipment: Equipment[]
  equipmentExpenseMap: Map<string, BusinessExpense>
  supplyExpenseIds: Set<string>
  wishlist: HomeInventoryItem[]
  swipedRowId: string | null
  onSwipedRowChange: (id: string | null) => void
  onBack: () => void
  onAdd: () => void
  onOpenSupply: (supply: Supply) => void
  onOpenEquipment: (item: Equipment) => void
  onOpenWishlist: (item: HomeInventoryItem) => void
  onDeleteSupply: (id: string) => void
  onDeleteEquipment: (id: string) => void
  onDeleteWishlist: (id: string) => void
}

function GroupBlock<T>({
  label,
  items,
  renderRow,
  defaultOpen = true,
}: {
  label: string
  items: T[]
  renderRow: (item: T, index: number) => ReactNode
  defaultOpen?: boolean
}) {
  const [collapsed, setCollapsed] = useState(!defaultOpen)
  const [expanded, setExpanded] = useState(false)
  const { visible, hiddenCount } = visibleItems(items, expanded)

  if (items.length === 0) return null

  return (
    <>
      <button
        type="button"
        className={`inventory-group-header${collapsed ? ' inventory-group-header--collapsed' : ''}`}
        onClick={() => setCollapsed((c) => !c)}
      >
        <p className="inventory-group-header__label">
          {label} ({items.length})
        </p>
        <CaretDown className="inventory-group-header__chevron" size={14} weight="bold" />
      </button>
      <div className={collapsed ? 'inventory-group-content--collapsed' : undefined}>
        {visible.map((item, index) => renderRow(item, index))}
        {hiddenCount > 0 && (
          <button
            type="button"
            className={`inventory-show-more${expanded ? ' inventory-show-more--expanded' : ''}`}
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? 'Show less' : `Show ${hiddenCount} more`}
            <CaretDown className="inventory-show-more__icon" size={14} weight="bold" />
          </button>
        )}
      </div>
    </>
  )
}

function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: CategoryViewMode
  onChange: (mode: CategoryViewMode) => void
}) {
  return (
    <div className="inv-view-toggle">
      <button
        type="button"
        className={`inv-view-toggle__btn${mode === 'grid' ? ' inv-view-toggle__btn--active' : ''}`}
        onClick={() => onChange('grid')}
        aria-label="Grid view"
      >
        <SquaresFour size={16} weight="bold" />
      </button>
      <button
        type="button"
        className={`inv-view-toggle__btn${mode === 'list' ? ' inv-view-toggle__btn--active' : ''}`}
        onClick={() => onChange('list')}
        aria-label="List view"
      >
        <ListBullets size={16} weight="bold" />
      </button>
    </div>
  )
}

export default function InventoryCategoryView({
  sectionKey,
  catalog,
  equipment,
  equipmentExpenseMap,
  supplyExpenseIds,
  wishlist,
  swipedRowId,
  onSwipedRowChange,
  onBack,
  onAdd,
  onOpenSupply,
  onOpenEquipment,
  onOpenWishlist,
  onDeleteSupply,
  onDeleteEquipment,
  onDeleteWishlist,
}: InventoryCategoryViewProps) {
  const section = SECTION_CONFIG.find((s) => s.key === sectionKey)!
  const [query, setQuery] = useState('')
  const [chip, setChip] = useState<SupplyFilterChip>('all')
  const [viewMode, setViewMode] = useState<CategoryViewMode>(() => defaultViewMode(sectionKey))

  useEffect(() => {
    setChip('all')
    setQuery('')
    setViewMode(defaultViewMode(sectionKey))
  }, [sectionKey])

  const supplyItems = useMemo(() => {
    if (!section.supplyKind) return []
    const base = filterSuppliesByKind(catalog, section.supplyKind)
    const filtered = filterSuppliesList(base, query, chip)
    return filterInventoryByExpenseTracking(
      filtered,
      supplyExpenseIds,
      chip === 'not_in_expenses'
    )
  }, [catalog, section.supplyKind, query, chip, supplyExpenseIds])

  const equipmentItems = useMemo(() => {
    const searched = filterBySearch(equipment, query)
    return filterInventoryByExpenseTracking(
      searched,
      new Set(equipmentExpenseMap.keys()),
      chip === 'not_in_expenses'
    )
  }, [equipment, query, chip, equipmentExpenseMap])

  const wishlistItems = useMemo(
    () => filterBySearch(wishlist, query),
    [wishlist, query]
  )

  const { attention, stocked } = useMemo(() => groupSupplies(supplyItems), [supplyItems])

  const showSupplyFilters = Boolean(section.supplyKind)
  const showEquipmentFilters = Boolean(section.isEquipment)
  const showViewToggle = !section.isWishlist
  const isGrid = viewMode === 'grid'
  const filterChips = section.isEquipment ? EQUIPMENT_FILTER_CHIPS : SUPPLY_FILTER_CHIPS
  const showExpenseFilters = showSupplyFilters || showEquipmentFilters
  const listIsEmpty =
    !section.isWishlist &&
    ((section.supplyKind && supplyItems.length === 0) ||
      (section.isEquipment && equipmentItems.length === 0))

  const supplyGrid = (
    <SupplyProductGrid
      supplies={supplyItems}
      onOpen={onOpenSupply}
      kind={section.supplyKind}
      expenseIds={supplyExpenseIds}
    />
  )

  return (
    <>
      <div className="inventory-category-nav">
        <BackButton onClick={onBack} label="Back to inventory" />
        <h2 className="inventory-category-nav__title">{section.title}</h2>
        {showViewToggle && <ViewModeToggle mode={viewMode} onChange={setViewMode} />}
      </div>

      <div className="inventory-search">
        <MagnifyingGlass className="inventory-search__icon" size={16} weight="bold" />
        <input
          type="search"
          className="inventory-search__input"
          placeholder={`Search ${section.title.toLowerCase()}…`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={`Search ${section.title}`}
        />
      </div>

      {showExpenseFilters && (
        <div className="inventory-filters">
          {filterChips.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={`filter-chip${chip === id ? ' filter-chip--active' : ''}`}
              onClick={() => setChip(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {listIsEmpty && (
        <div className="inventory-empty-filter">
          {chip === 'not_in_expenses'
            ? 'No items here — everything in this category is linked to expenses.'
            : 'No items match your search or filters.'}
        </div>
      )}

      {section.isWishlist && (
        <div className="inventory-card">
          {wishlistItems.map((item, index) => (
            <SwipeableRow
              key={item.id}
              rowId={`wishlist-${item.id}`}
              openRowId={swipedRowId}
              onOpenChange={onSwipedRowChange}
              onEdit={() => onOpenWishlist(item)}
              onDelete={() => onDeleteWishlist(item.id)}
              deleteConfirmMessage={`Remove "${item.name}" from your wish list?`}
              showDivider={index < wishlistItems.length - 1}
            >
              <WishlistInventoryRow item={item} onPress={() => onOpenWishlist(item)} />
            </SwipeableRow>
          ))}
          <button type="button" className="inventory-add-row" onClick={onAdd}>
            <Plus className="inventory-add-row__icon" size={16} weight="bold" />
            Add {section.addLabel}
          </button>
        </div>
      )}

      {section.isEquipment && isGrid && !listIsEmpty && (
        <>
          <EquipmentProductGrid
            items={equipmentItems}
            onOpen={onOpenEquipment}
            expenseMap={equipmentExpenseMap}
          />
          <button type="button" className="inventory-add-row inventory-add-row--standalone" onClick={onAdd}>
            <Plus className="inventory-add-row__icon" size={16} weight="bold" />
            Add {section.addLabel}
          </button>
        </>
      )}

      {section.isEquipment && !isGrid && !listIsEmpty && (
        <div className="inventory-card">
          {equipmentItems.map((item, index) => (
            <SwipeableRow
              key={item.id}
              rowId={`equipment-${item.id}`}
              openRowId={swipedRowId}
              onOpenChange={onSwipedRowChange}
              onEdit={() => onOpenEquipment(item)}
              onDelete={() => onDeleteEquipment(item.id)}
              deleteConfirmMessage={`Delete "${item.name}" from equipment?`}
              showDivider={index < equipmentItems.length - 1}
            >
              <EquipmentInventoryRow
                item={item}
                onPress={() => onOpenEquipment(item)}
                inExpenses={equipmentExpenseMap.has(item.id)}
              />
            </SwipeableRow>
          ))}
          <button type="button" className="inventory-add-row" onClick={onAdd}>
            <Plus className="inventory-add-row__icon" size={16} weight="bold" />
            Add {section.addLabel}
          </button>
        </div>
      )}

      {section.supplyKind && isGrid && !listIsEmpty && (
        <>
          {supplyGrid}
          <button type="button" className="inventory-add-row inventory-add-row--standalone" onClick={onAdd}>
            <Plus className="inventory-add-row__icon" size={16} weight="bold" />
            Add {section.addLabel}
          </button>
        </>
      )}

      {section.supplyKind && !isGrid && !listIsEmpty && (
        <div className="inventory-card">
          <GroupBlock
            label="Needs attention"
            items={attention}
            renderRow={(item, index) => (
              <SwipeableRow
                key={item.id}
                rowId={`supply-${item.id}`}
                openRowId={swipedRowId}
                onOpenChange={onSwipedRowChange}
                onEdit={() => onOpenSupply(item)}
                onDelete={() => onDeleteSupply(item.id)}
                deleteConfirmMessage={`Delete "${item.name}" from inventory?`}
                showDivider={index < attention.length - 1 || stocked.length > 0}
              >
                <SupplyInventoryRow
                  supply={item}
                  onPress={() => onOpenSupply(item)}
                  inExpenses={supplyExpenseIds.has(item.id)}
                />
              </SwipeableRow>
            )}
          />
          <GroupBlock
            label="Stocked"
            items={stocked}
            renderRow={(item, index) => (
              <SwipeableRow
                key={item.id}
                rowId={`supply-${item.id}`}
                openRowId={swipedRowId}
                onOpenChange={onSwipedRowChange}
                onEdit={() => onOpenSupply(item)}
                onDelete={() => onDeleteSupply(item.id)}
                deleteConfirmMessage={`Delete "${item.name}" from inventory?`}
                showDivider={index < stocked.length - 1}
              >
                <SupplyInventoryRow
                  supply={item}
                  onPress={() => onOpenSupply(item)}
                  inExpenses={supplyExpenseIds.has(item.id)}
                />
              </SwipeableRow>
            )}
          />
          <button type="button" className="inventory-add-row" onClick={onAdd}>
            <Plus className="inventory-add-row__icon" size={16} weight="bold" />
            Add {section.addLabel}
          </button>
        </div>
      )}

      {listIsEmpty && !section.isWishlist && (
        <button type="button" className="inventory-add-row inventory-add-row--standalone" onClick={onAdd}>
          <Plus className="inventory-add-row__icon" size={16} weight="bold" />
          Add {section.addLabel}
        </button>
      )}
    </>
  )
}
