# UI CSS Audit

Owner map for shared patterns across the detailing app. Use this when adding surfaces or consolidating CSS in Phase 3.

**Last updated:** Phase 1 Week 1 (design evolution sprint)

---

## Design systems

| System | Scope | Token source |
|--------|-------|--------------|
| Operator Dark | `/`, `/jobs`, `/clients`, sheets, FAB | `globals.css` `:root` + `app-ui.css` |
| Client Light | `/book/*`, `/portal/*` (Phase 2) | `client-light.css` → `--cl-*` |
| Sheet sub-language | Bottom sheets, quick actions, inventory pickers | `globals.css` inventory/sheet blocks |

**Accent green:** `#22c55e` via `--green` / `--green-text`. Inventory OK state keeps `--inv-ok: #3dc97a` (semantic, not UI accent).

---

## Pattern owners

### `.card` — generic elevated surface

| Owner | File | Notes |
|-------|------|-------|
| **Primary** | `globals.css` | Base `.card`, `.card-pressable`; used settings advanced, damage docs |
| Extend | `settings.css`, `damage.css` | Page-scoped overrides only |

**Do not** duplicate full card rules in feature CSS; extend `.card`.

---

### `.job-card` — job list rows

| Owner | File | Notes |
|-------|------|-------|
| **Primary** | `app-ui.css` | `.job-card`, hover, home variant `.job-card--home` |
| Status | `app-ui.css` | `.job-card .badge-status` |
| **Not** | `globals.css` | No `.job-card` in globals |

Used by: `JobsList`, `Dashboard` (`HomeJobRow`).

---

### `.client-card` — client list rows

| Owner | File | Notes |
|-------|------|-------|
| **Primary** | `app-ui.css` | `.client-card`, `.client-card.vip`, `.client-card-main` |
| Menu | `globals.css` | `.client-card-menu-*` (popover actions) |

**Overlap (defer Phase 3):** `globals.css` has `.clients-*` list utilities from earlier iteration. Prefer `app-ui.css` `.client-card` for new work.

Used by: `ClientsList`, `ClientDetail` related lists.

---

### `.bottom-nav` — operator shell navigation

| Owner | File | Notes |
|-------|------|-------|
| **Canonical** | `globals.css` | Full layout, FAB, safe-area, animations |
| **Overrides** | `app-ui.css` | Minor tab label sizing — **duplicate risk** |

**Action (Phase 3):** Collapse `app-ui.css` bottom-nav block into globals or document as intentional overrides only.

Used by: `BottomNav.tsx`.

---

### `.page-header` — screen title row

| Owner | File | Notes |
|-------|------|-------|
| **Primary** | `app-ui.css` | `.page-header`, `h1`, `h1.lg`, subtitle `p` |
| Actions | `app-ui.css` | `.icon-btn` beside header |

Used by: `Dashboard`, `JobsList`, `ClientsList`, `Reports`, settings, etc.

**Messages affordance:** Dashboard uses `.icon-btn` + optional `messages.css` `.home-header__messages` pattern for unread state.

---

## Removed / dead (Phase 1)

| Item | Resolution |
|------|------------|
| `home/home.css` | Import removed from `globals.css`; `HomeScreen.tsx` unrouted — file kept for reference |
| `JobsRevenueChart.tsx` | Deleted; `.jobs-chart-*` / `.jobs-filter-chip` CSS removed from globals |
| Stray greens `#16a34a`, `#4caf50`, `#3dc97a` | Replaced with `var(--green)` except `--inv-ok` |

---

## Deferred (Phase 2–3)

- QuickAddJob footer → `.btn-primary` / `.btn-ghost` (**done** Phase 2)
- Portal → `client-light.css` tokens (**done** Phase 2)
- `src/components/ui/*` primitives (**done** Phase 3) — adopt incrementally in new screens
- Empty state standardization (**done** Quotes, Inventory; Jobs/Clients already used `.empty-state`)
