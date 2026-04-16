# Supabase Profile Migration (Azure -> Supabase)

This repository now supports a 3-stage profile migration:

1. **Stage 1: App profile routes moved to Supabase**
   - `GET /api/user/email/[email]`
   - `POST /api/user`
   - `PUT /api/user`
2. **Stage 2: Data migration + optional dual-write**
3. **Stage 3: Document uploads moved to Supabase Storage** via `POST /api/user/upload`

## Environment variables

Required:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Accepted aliases (for platform compatibility):

- `NEXT_PUBLIC_SUPABASE_URL` (used if `SUPABASE_URL` is not set)
- `SUPABASE_SERVICE_KEY` (used if `SUPABASE_SERVICE_ROLE_KEY` is not set)

Optional:

- `SUPABASE_PROFILE_TABLE` (default: `user_profiles`)
- `SUPABASE_PROFILE_BUCKET` (default: `profile-documents`)
- `PROFILE_DUAL_WRITE_AZURE` (`true` to mirror writes back to Azure)
- `AZURE_BACKEND_API_URL` (default: `https://buysel.azurewebsites.net`)

## 1) Create the profile table

Run SQL in Supabase:

- `supabase/migrations/20260411_create_user_profiles.sql`

Also create and make public a storage bucket for profile documents:

- bucket name: `profile-documents` (or set `SUPABASE_PROFILE_BUCKET`)

## 2) Backfill users from Azure

### Option A: pull from Azure API directly

```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
AZURE_BACKEND_API_URL=https://buysel.azurewebsites.net \
node scripts/migrate-azure-users-to-supabase.mjs --source=api
```

### Option B: import from JSON dump

```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
node scripts/migrate-azure-users-to-supabase.mjs --source=file --file=./users.json
```

## 3) Dual-write (safety window)

Set:

```bash
PROFILE_DUAL_WRITE_AZURE=true
AZURE_BACKEND_API_URL=https://buysel.azurewebsites.net
```

When enabled, profile POST/PUT writes to Supabase first and mirrors to Azure.

## 4) Final cutover

- Keep dual-write on for a validation window.
- Verify profile create/update/read + upload paths.
- Disable `PROFILE_DUAL_WRITE_AZURE` once confidence is high.

## 5) Directly inspect storage bucket contents (images/docs)

Use the helper script to list files in a Supabase bucket.

```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run storage:check-supabase-bucket -- --bucket=profile-documents --recursive
```

Useful flags:

- `--path=users/123` only list inside a folder path.
- `--limit=200` change list page size (max 1000).
- `--signed-urls` include temporary signed URLs for each object.
- `--signed-url-expiry=3600` signed URL lifetime in seconds.

Example with signed URLs:

```bash
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
npm run storage:check-supabase-bucket -- --bucket=profile-documents --recursive --signed-urls --signed-url-expiry=600
```
