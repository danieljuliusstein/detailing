# PocketBase Setup — Phase 1

## 1. Download & run

```bash
# From pocketbase/ directory — download binary for your OS from https://pocketbase.io/docs/
chmod +x pocketbase
./pocketbase serve --http=127.0.0.1:8090
```

Admin UI: http://127.0.0.1:8090/_/

## 2. Create admin + app user

1. On first launch, create your **admin** account (for the admin UI only).
2. Go to **Settings → Admins** is not needed — instead create an **app user**:
   - **Collections** → ensure `users` auth collection exists (default)
   - **Authentication → Users** → New user:
     - Email: `detailing@local` (or your choice)
     - Password: choose a strong password
     - Toggle **Verified** on

## 3. Import collections

**Recommended — safe CLI import** (keeps `users` auth collection):

```bash
cd pocketbase
./pocketbase migrate up
```

This applies `pb_migrations/1738780000_detailing_collections.js` in **merge mode** — only adds/updates the 8 app collections, never deletes `users` or system collections.

**Alternative — admin UI import:** Settings → Import collections → upload `pb_schema.json`

⚠️ **Before confirming**, enable **"Merge with existing collections"** (or equivalent). The default import mode deletes collections not in the JSON — including your `users` auth collection — which breaks app login.

The schema uses the **PocketBase 0.23+ format** (`fields`, flattened options, stable collection IDs for relations). API rules are included — no need to set them manually.

## 4. Configure the Next.js app

Copy env example and fill in credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_PB_URL=http://127.0.0.1:8090
NEXT_PUBLIC_PB_EMAIL=detailing@local
NEXT_PUBLIC_PB_PASSWORD=your-app-user-password
```

Restart the dev server after changing `.env.local`.

## 5. Seed packages (optional)

If packages weren't auto-seeded on first app load:

```bash
PB_URL=http://127.0.0.1:8090 \
PB_EMAIL=detailing@local \
PB_PASSWORD=your-password \
node scripts/seed-packages.mjs
```

## How the app connects

1. User unlocks app with PIN
2. App authenticates to PocketBase with `NEXT_PUBLIC_PB_EMAIL` / `PASSWORD`
3. On first connect, localStorage data migrates to PocketBase (clients, jobs, invoices, supplies, overhead)
4. Offline writes queue in IndexedDB and flush to PocketBase on reconnect
5. Default packages seed if collection is empty
6. All API calls route through `src/lib/api/index.ts` → `pocketbase.ts`
7. If PB is down or env vars missing → falls back to localStorage + offline queue

## Verify it's working

1. Open browser devtools → Network
2. Unlock app → look for requests to `127.0.0.1:8090/api/collections/...`
3. Create a job in the app → check PocketBase admin → `jobs` collection

## Collections

| Collection | Phase 1 usage |
|---|---|
| `packages` | Read + auto-seed |
| `clients` | CRUD via jobs |
| `jobs` | Full CRUD |
| `invoices` | Read + migration |
| `app_settings` | Schema ready (Phase 2) |
| `supplies` | CRUD + auto-seed + inventory deduction on job complete |
| `overhead_expenses` | CRUD + P&L overhead proration |
| `jobs.photo_meta` | Before/after photo tagging (re-import schema if upgrading) |
| `notifications_log` | Schema ready (Phase 5) |

## Deploy (Fly.io) — Phase 6

See **`DEPLOY.md`** for full Fly.io setup (volume, HTTPS, CORS, secrets).

Quick start:

```bash
cd pocketbase
fly volumes create pb_data --region iad --size 1
fly deploy
```

Set CORS allowed origins in admin UI to match your Next.js app URL.
