# Backend base URL + Storage Migration Setup Guide

This guide explains exactly where and how to wire environment variables for local, staging, and production so helper-based API calls resolve correctly, and what credentials/config you need ready for the storage migration phase.

## 1) What is already implemented in code

- **Client-side API helper:** `lib/config.ts` uses
  - `NEXT_PUBLIC_BACKEND_API_URL` (preferred), then
  - `NEXT_PUBLIC_API_URL` (legacy fallback).
- **Server-side API helper:** `lib/server-config.ts` uses
  - `BACKEND_API_URL` (preferred), then
  - `NEXT_PUBLIC_API_URL` (legacy fallback).
- **OAuth server routes now use the server helper** (`backendUrl(...)`) so they follow the same env rules rather than hardcoding `NEXT_PUBLIC_API_URL`.

## 2) Environment variable matrix by runtime

Use this matrix as the source of truth:

| Runtime | Required | Optional (temporary legacy) | Notes |
|---|---|---|---|
| Browser/client bundle | `NEXT_PUBLIC_BACKEND_API_URL` | `NEXT_PUBLIC_API_URL` | Must be set at build time for Next.js client code. |
| Next.js server routes | `BACKEND_API_URL` | `NEXT_PUBLIC_API_URL` | Keep `BACKEND_API_URL` explicit per environment. |
| Storage public URL | `NEXT_PUBLIC_STORAGE_PUBLIC_BASE_URL` | Azure blob envs | Used by `getPublicFileUrl(...)` Cloudflare-first flow. |

## 3) Local development (where to set it)

Create a local env file (for example `.env.local`) in the repo root and set:

```bash
# Client
NEXT_PUBLIC_BACKEND_API_URL=http://localhost:5000

# Server routes
BACKEND_API_URL=http://localhost:5000

# Temporary fallback (only if needed during transition)
# NEXT_PUBLIC_API_URL=http://localhost:5000

# Storage (Phase 2 target)
NEXT_PUBLIC_STORAGE_PUBLIC_BASE_URL=https://cdn.local-or-dev.example.com
```

Then restart Next.js (`npm run dev`) so both client and server pick up env changes.

## 4) Staging environment (where to set it)

Set the same keys in your staging host’s environment variable UI/CLI (e.g., Azure Static Web Apps/App Service, Vercel, etc.):

```bash
NEXT_PUBLIC_BACKEND_API_URL=https://api-staging.yourdomain.com
BACKEND_API_URL=https://api-staging.yourdomain.com
NEXT_PUBLIC_STORAGE_PUBLIC_BASE_URL=https://cdn-staging.yourdomain.com
```

Recommended: keep `NEXT_PUBLIC_API_URL` set in staging only during cutover; remove it once all routes rely on new vars.

## 5) Production environment (where to set it)

Set production runtime values:

```bash
NEXT_PUBLIC_BACKEND_API_URL=https://api.yourdomain.com
BACKEND_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_STORAGE_PUBLIC_BASE_URL=https://cdn.yourdomain.com
```

After rollout and verification, remove legacy `NEXT_PUBLIC_API_URL` from production.

## 6) Verification checklist (must pass per environment)

1. Open `app/env-check/page.tsx` (if used in your workflow) or inspect network calls in browser devtools.
2. Confirm client requests use `NEXT_PUBLIC_BACKEND_API_URL` host.
3. Trigger server routes (OAuth callbacks / API routes) and verify server-side requests use `BACKEND_API_URL` host.
4. Confirm no requests are sent to old hardcoded Azure host unless intentionally configured.

Useful scan command:

```bash
rg -n "buysel.azurewebsites.net|NEXT_PUBLIC_API_URL" --glob '!**/node_modules/**'
```

## 7) Phase 2 storage migration prerequisites (credentials/config you need confirmed)

Before replacing Azure blob upload flows, confirm one of these target stacks:

### Option A: Cloudflare R2 signed-upload flow

Required configuration to collect/confirm:

- Cloudflare account ID
- R2 bucket name(s): staging + production
- R2 access key ID + secret access key (server-side only)
- Public delivery base URL (custom domain or R2 public endpoint)
- CORS policy for browser uploads
- Max object size + allowed mime types
- Object key naming strategy (e.g., `users/{userId}/...`)

### Option B: Supabase Storage flow

Required configuration to collect/confirm:

- Supabase project URL
- Supabase anon key (client)
- Supabase service role key (server-only)
- Storage bucket names + public/private setting
- RLS/storage policies for upload/read/delete
- Signed URL expiry defaults
- File size and mime restrictions

## 8) Suggested rollout order

1. **Set env vars in local/staging/prod first** (this change is backward compatible).
2. **Deploy and verify helper-based API resolution**.
3. **Implement storage upload replacement** for `components/UserProfile.tsx` upload path.
4. **Cut traffic over**, then remove Azure blob env vars and package usage.
