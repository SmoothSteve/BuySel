# BuySel Weekly Change Summary (April 11–18, 2026)

## Simple dot-point version (business-friendly)
- We completed most of the move from older Azure-style profile/storage handling to **Supabase**, which should reduce breakages and make data handling more consistent.
- We fixed many issues in the **core APIs** (`/api/user`, `/api/property`, admin routes), improving reliability for everyday actions.
- We tightened **security and access checks** so the right users see and change the right data.
- We resolved a big set of **TypeScript/build errors**, which helps deployments succeed more consistently.
- We improved **admin tools** and **chat stability**, especially around unread messages and profile lookups.
- Net result: this week was mainly about **stability, migration completion, and reducing production risk**.

## Snapshot
- **Total commits:** 173
- **Feature/fix commits (non-merge):** 75
- **Merge commits:** 98 (mostly PR integrations)

## What changed this week (high level)
1. **Profile/storage migration and hardening**
   - Continued migration away from Azure-oriented assumptions toward Supabase-backed profile and storage flows.
   - Improved profile image/document URL generation, including support for private bucket access and signed URL redirects.

2. **API reliability and route consistency**
   - Repeated fixes across `/api/user`, `/api/property`, admin endpoints, and proxy/fallback behavior.
   - Added/fixed property route capabilities (including PUT support and photo endpoints).
   - Strengthened route behavior for edge cases like no-body proxy statuses and safer fallback handling.

3. **Auth and security posture improvements**
   - Hardened auth checks and access controls in several API and profile write paths.
   - Improved OAuth callback typing/handling and related user resolution paths.

4. **TypeScript/build stabilization**
   - Large batch of type fixes (JWT payloads, route handler signatures, nullable fields, chat timestamps, seller/user typing).
   - Addressed Next.js 16/App Router route export and param typing issues to keep builds green.

5. **Admin and chat quality fixes**
   - Stabilized admin user data handling and error behavior (notably around 403 and payload normalization).
   - Fixed chat read/message typing and unread lookup/auth context issues.

## Representative commit trail
- `1f606e0` — Migrate profile storage from Azure API to Supabase.
- `d8e90fe` — Complete profile migration cutover for user lookups.
- `a88c0f5` — Harden API access controls and complete phase cleanup fixes.
- `49efe11` / `910f09a` / `84b1cab` — Next.js 16 and route export/type fixes.
- `1842728` / `4960cfe` — Private Supabase bucket document/image retrieval fixes.
- `d570fc5` / `3ad2c8f` / `75c0664` — Property API improvements (PUT support, response shape, photo routes).

## Overall direction
This was a **stability + migration completion week**: the team closed critical migration gaps, reduced API and storage regressions, tightened auth/access behavior, and resolved many compile-time type issues to support more reliable releases.
