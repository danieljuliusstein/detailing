# Accessibility Audit — Phase 2

**Scope:** Booking flow, QuickAddJob, FAB/sheets, operator contextual links  
**Date:** Design evolution sprint

---

## Fixes applied

| Area | Change |
|------|--------|
| Booking errors | `role="alert"` + `aria-live="assertive"` on `.book-error-banner` |
| Booking step 2 | Removed faux clock control; time selection is slot grid only |
| Booking summary | `aria-live="polite"` on sticky package summary |
| Step 3 collapse | `aria-expanded` on "More options" toggle |
| QuickAddJob | `BackButton` with `aria-label`; footer uses shared `.btn-primary` / `.btn-ghost` (44px+ targets) |
| FAB menu | `role="menu"` / `menuitem`; Escape closes; focus moves to first action |
| Dashboard | Messages + Settings icon buttons have `aria-label` |

---

## Sheet semantics (intentional)

### `.inv-sheet-save` inverted styling

Inventory and job sheets use **light** save buttons (`#f2f2f7` background, `#111` text) on **dark** sheet chrome. This is deliberate sheet sub-language contrast—not a token bug.

- Documented in `globals.css` above `.inv-sheet-save`
- Outline variant `.inv-sheet-save--outline` shares the same inverted palette
- `BottomSheet.tsx` footer slot passes through children; sheet-specific save classes remain in feature CSS

### Bottom sheets

- `BottomSheet`: `aria-label` prop, Escape dismiss, body scroll lock
- Drag-to-dismiss handle is visual only; close button has `aria-label="Close"`

---

## Manual QA matrix (recommended)

| Flow | Chrome | iOS Safari |
|------|--------|------------|
| `/book/test` step 2 date + slots | ✓ verify | ✓ verify native date picker |
| QuickAddJob save + expenses | ✓ | ✓ |
| FAB → 6 actions | ✓ | ✓ |
| Portal light + photos dark | ✓ | ✓ |
| PIN auth | ✓ | ✓ |

---

## Deferred

- Focus trap inside all sheets (partial today via first-focus on FAB only)
- Skip link for operator shell
- High-contrast mode audit
