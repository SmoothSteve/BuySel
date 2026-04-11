# Azure → Supabase + Cloudflare Migration Plan

This document tracks the migration away from Azure-specific dependencies.

## Target architecture

- **Primary backend/data:** Supabase (Postgres + Auth + Storage policies where applicable)
- **Public/static file hosting (photos/docs):** Cloudflare (R2 + optional CDN/custom domain)
- **Frontend API base URL:** configurable via `NEXT_PUBLIC_BACKEND_API_URL`

## What has already been migrated in this phase

1. Added provider-agnostic URL helpers in `lib/config.ts`:
   - `buildApiUrl(path)` for API calls
   - `getPublicFileUrl(filename)` for documents/images (Cloudflare-first with Azure fallback)
2. Replaced hardcoded `https://buysel.azurewebsites.net` API calls in key UI components with `buildApiUrl(...)`.
3. Replaced `getAzureBlobUrl(...)` usage in key UI components with `getPublicFileUrl(...)`.

## Remaining migration tasks

### Phase 1 — eliminate hardcoded Azure references

- Replace remaining `buysel.azurewebsites.net` references in:
  - other components/hooks
  - scripts and docs
  - deployment shell scripts
- Keep only temporary compatibility references in migration docs.

### Phase 2 — storage upload path migration (Azure Blob SDK removal)

- Current `components/UserProfile.tsx` still uploads directly with `@azure/storage-blob`.
- Replace with one of:
  1. Signed upload URL flow to Cloudflare R2 via a server route, or
  2. Supabase Storage upload flow.
- After migration:
  - remove `@azure/storage-blob` package
  - delete `NEXT_PUBLIC_AZUREBLOB_*` env vars
  - rename DB columns (`photoazurebloburl` etc.) if desired.

### Phase 3 — backend endpoint migration to Supabase-native routes

- Move C#/.NET API dependencies to Next.js API routes (or Supabase Edge Functions).
- Add shared API client wrappers per domain:
  - users
  - offers
  - audit
  - chat
- Cut over component by component using typed clients.

### Phase 4 — cleanup and hard cutover

- Remove Azure deployment scripts and docs once production traffic is fully cut over.
- Add CI guard (`rg` check) to fail on new Azure endpoint literals.
- Perform final credential cleanup and rotation.

## Recommended env vars going forward

```bash
NEXT_PUBLIC_BACKEND_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_STORAGE_PUBLIC_BASE_URL=https://cdn.yourdomain.com
```

## Optional compatibility env vars (temporary)

```bash
NEXT_PUBLIC_AZUREBLOB_SASURL_BASE=...
NEXT_PUBLIC_AZUREBLOB_CONTAINER=...
NEXT_PUBLIC_AZUREBLOB_SASTOKEN=...
```

These are used only as fallback while migrating existing blob records.
