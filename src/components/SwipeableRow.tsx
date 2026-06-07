'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type TouchEvent,
} from 'react'
import { Trash } from '@phosphor-icons/react'
import RowContextMenu from './RowContextMenu'

const SWIPE_OPEN_OFFSET = -72
const SWIPE_THRESHOLD = 48
const LONG_PRESS_MS = 450
const DIRECTION_LOCK_PX = 10

interface SwipeableRowProps {
  rowId: string
  openRowId: string | null
  onOpenChange: (id: string | null) => void
  children: ReactNode
  onEdit: () => void
  onDelete: () => void
  deleteConfirmMessage: string
  showDivider?: boolean
}

export default function SwipeableRow({
  rowId,
  openRowId,
  onOpenChange,
  children,
  onEdit,
  onDelete,
  deleteConfirmMessage,
  showDivider = false,
}: SwipeableRowProps) {
  const [offset, setOffset] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const gesture = useRef({
    startX: 0,
    startY: 0,
    axis: null as 'x' | 'y' | null,
    longPressTimer: null as ReturnType<typeof setTimeout> | null,
    longPressTriggered: false,
    movedX: 0,
  })
  const blockClickRef = useRef(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const isOpen = openRowId === rowId

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const blockScrollDuringHorizontalSwipe = (e: globalThis.TouchEvent) => {
      if (gesture.current.axis === 'x') e.preventDefault()
    }
    el.addEventListener('touchmove', blockScrollDuringHorizontalSwipe, { passive: false })
    return () => el.removeEventListener('touchmove', blockScrollDuringHorizontalSwipe)
  }, [])

  useEffect(() => {
    if (!isOpen) setOffset(0)
    else setOffset(SWIPE_OPEN_OFFSET)
  }, [isOpen])

  const resetSwipe = useCallback(() => {
    setOffset(0)
    if (isOpen) onOpenChange(null)
  }, [isOpen, onOpenChange])

  const confirmDelete = useCallback(() => {
    if (!confirm(deleteConfirmMessage)) return
    onDelete()
    resetSwipe()
  }, [deleteConfirmMessage, onDelete, resetSwipe])

  const clearLongPress = () => {
    if (gesture.current.longPressTimer) {
      clearTimeout(gesture.current.longPressTimer)
      gesture.current.longPressTimer = null
    }
  }

  const onTouchStart = (e: TouchEvent) => {
    if (menuOpen) return
    const touch = e.touches[0]
    gesture.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      axis: null,
      longPressTimer: null,
      longPressTriggered: false,
      movedX: 0,
    }
    blockClickRef.current = false

    if (openRowId && openRowId !== rowId) {
      onOpenChange(null)
      setOffset(0)
    }

    gesture.current.longPressTimer = setTimeout(() => {
      gesture.current.longPressTriggered = true
      clearLongPress()
      setMenuOpen(true)
    }, LONG_PRESS_MS)
  }

  const onTouchMove = (e: TouchEvent) => {
    if (menuOpen || gesture.current.longPressTriggered) return
    const touch = e.touches[0]
    const dx = touch.clientX - gesture.current.startX
    const dy = touch.clientY - gesture.current.startY

    if (!gesture.current.axis) {
      if (Math.abs(dx) < DIRECTION_LOCK_PX && Math.abs(dy) < DIRECTION_LOCK_PX) return
      if (Math.abs(dy) > Math.abs(dx)) {
        gesture.current.axis = 'y'
        clearLongPress()
        return
      }
      gesture.current.axis = 'x'
      setIsDragging(true)
      clearLongPress()
    }

    if (gesture.current.axis === 'y') return

    const next = Math.min(0, Math.max(SWIPE_OPEN_OFFSET, dx))
    gesture.current.movedX = Math.abs(dx)
    setOffset(next)
    if (next < -20) onOpenChange(rowId)
  }

  const onTouchEnd = () => {
    clearLongPress()
    if (gesture.current.longPressTriggered) {
      blockClickRef.current = true
      gesture.current.axis = null
      return
    }
    if (gesture.current.axis === 'y') {
      gesture.current.axis = null
      return
    }
    if (gesture.current.axis === 'x') {
      if (gesture.current.movedX > 10) blockClickRef.current = true
      if (offset <= -SWIPE_THRESHOLD) {
        setOffset(SWIPE_OPEN_OFFSET)
        onOpenChange(rowId)
      } else {
        resetSwipe()
      }
    }
    setIsDragging(false)
    gesture.current.axis = null
  }

  const onTouchCancel = () => {
    clearLongPress()
    setIsDragging(false)
    gesture.current.axis = null
  }

  return (
    <>
      <div
        className={`swipe-row-wrap${showDivider ? ' inv-item-row-wrap--divider' : ''}`}
        data-swipe-open={isOpen || undefined}
      >
        {(isOpen || offset < 0) && (
          <div className="swipe-row-actions" aria-hidden={!isOpen}>
            <button
              type="button"
              className="swipe-row-delete-btn"
              onClick={confirmDelete}
              aria-label="Delete"
            >
              <Trash size={18} weight="bold" />
            </button>
          </div>
        )}
        <div
          ref={contentRef}
          className="swipe-row-content"
          style={{
            transform: `translateX(${offset}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease',
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
          onClickCapture={(e) => {
            if (blockClickRef.current) {
              e.preventDefault()
              e.stopPropagation()
              blockClickRef.current = false
            }
          }}
        >
          {children}
        </div>
      </div>

      {menuOpen && (
        <RowContextMenu
          onEdit={onEdit}
          onDelete={confirmDelete}
          onClose={() => setMenuOpen(false)}
        />
      )}
    </>
  )
}
