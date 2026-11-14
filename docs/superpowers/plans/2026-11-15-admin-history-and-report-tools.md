# Admin history, report download, and improvement prompt

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restrict history to admins (`/auth/admin`), let non-admins reopen their report and download/copy an improvement prompt, and give admins a dashboard to view/manage all analyses.

**Architecture:** Stateless admin sessions via signed cookies (HMAC over `username:expiry` using the existing pepper). Admin routes are protected server-side. Public `/history` redirects. Report page gains two client-side actions: print-to-PDF download and clipboard copy of a generated improvement prompt.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind, existing Drizzle/Postgres, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-15-admin-history-and-report-tools-design.md`

## Global Constraints

- Admin credentials come only from env: `ADMIN_USERNAME`, `ADMIN_PASSWORD` (required in production; optional in dev/test with defaults).
- Admin cookie `ra_admin` is HttpOnly, SameSite=lax, Secure in production, 8-hour expiry.
- Password comparison uses `timingSafeEqual`.
- Non-admin never sees the history list; `/history` redirects.
- Report download uses browser print (`window.print`) with `@media print` CSS.
- Copy prompt uses `navigator.clipboard` with a textarea fallback.
- All new admin endpoints return 401 without a valid session.

## Review Focus

- Admin session tampering (expired/forged cookie) must be rejected.
- Non-admin must not reach `/admin` or admin APIs.
- Report print must not leak interactive controls into the printed output.
- Copy-prompt must not include secrets or PII beyond analysis results.
- E2E flows must be updated for the new access model.

---

### Task 1: Admin session helper and env

**Files:**

- Create: `src/lib/auth/admin.ts`, `tests/unit/admin-session.test.ts`
- Modify: `src/lib/env.ts`

**Interfaces:**

- Produces: `createAdminSession(username: string): string`, `verifyAdminSession(cookie: string | undefined): boolean`, `getCurrentAdmin(): Promise<string | null>`.
- Consumes: `getServerEnv()` (extended with `ADMIN_USERNAME`, `ADMIN_PASSWORD`).

- [ ] **Step 1: Write failing test** `tests/unit/admin-session.test.ts` verifying a created session verifies, an expired/tampered cookie fails, and `verifyAdminSession(undefined)` is false.
- [ ] **Step 2: Run** `npm test -- tests/unit/admin-session.test.ts` → FAIL.
- [ ] **Step 3: Implement** `src/lib/auth/admin.ts` using HMAC-SHA256 over `username:expiry` with `CLIENT_TOKEN_PEPPER`, 8-hour expiry, `timingSafeEqual`. Extend `env.ts` with `ADMIN_USERNAME` (default `admin`) and `ADMIN_PASSWORD` (default `change-me` in non-production only).
- [ ] **Step 4: Run** tests + typecheck → PASS.
- [ ] **Step 5: Commit** `feat: add admin session helper`.

### Task 2: Admin login/logout routes and page

**Files:**

- Create: `src/app/auth/admin/page.tsx`, `src/app/api/auth/admin/login/route.ts`, `src/app/api/auth/admin/logout/route.ts`, `src/lib/api/admin-auth-handler.ts`, `tests/integration/admin-auth.test.ts`
- Modify: `src/lib/auth/server.ts` (add `getCurrentAdmin` re-export).

**Interfaces:**

- Consumes: `createAdminSession`, `verifyAdminSession`, `getServerEnv`.
- Produces: `handleAdminLogin(request, deps)`, `handleAdminLogout()`.

- [ ] **Step 1: Write failing integration tests** for successful login (sets `ra_admin` cookie), wrong password (401, no cookie), logout (clears cookie).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** login handler comparing credentials with `timingSafeEqual`, logout clearing cookie, page with form.
- [ ] **Step 4: Run** tests + build → PASS.
- [ ] **Step 5: Commit** `feat: add admin login and logout`.

### Task 3: Admin analyses API

**Files:**

- Create: `src/lib/api/admin-handlers.ts`, `src/app/api/admin/analyses/route.ts`, `src/app/api/admin/analyses/[id]/route.ts`, `tests/integration/admin-analyses.test.ts`

**Interfaces:**

- Consumes: `getCurrentAdmin`, `listAnalysesForClient` (reused as "all"), `getAnalysisForClient` (admin bypass), `deleteAnalysisForClient`.
- Produces: `handleAdminListAnalyses`, `handleAdminGetAnalysis`, `handleAdminDeleteAnalysis`.

- [ ] **Step 1: Write failing tests** (401 without session; 200 list all; 200 get any; 200 delete).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** handlers that verify admin session first, then use a new `listAllAnalyses(db)` query and `getAnalysisById(db, id)` (no client filter).
- [ ] **Step 4: Add query helpers** `listAllAnalyses`, `getAnalysisById` to `src/lib/db/queries.ts`.
- [ ] **Step 5: Run** tests + typecheck → PASS.
- [ ] **Step 6: Commit** `feat: add admin analyses API`.

### Task 4: Admin dashboard and report view

**Files:**

- Create: `src/app/admin/page.tsx`, `src/app/admin/analyses/[id]/page.tsx`, `src/components/admin-dashboard.tsx`
- Modify: `src/components/site-header.tsx` (conditional Admin link)

**Interfaces:**

- Consumes: admin API, shared report rendering (extract `AnalysisReportView` component).

- [ ] **Step 1: Extract** report rendering from `src/app/analysis/[id]/page.tsx` into `src/components/analysis-report-view.tsx` accepting `analysis`.
- [ ] **Step 2: Implement** admin dashboard (table + delete) and admin report page.
- [ ] **Step 3: Update** site header to show Admin link when `getCurrentAdmin()` is set.
- [ ] **Step 4: Run** build → PASS.
- [ ] **Step 5: Commit** `feat: add admin dashboard and report view`.

### Task 5: Public access changes and report tools

**Files:**

- Modify: `src/app/history/page.tsx` (redirect), `src/components/site-header.tsx` (remove Riwayat link), `src/app/analysis/[id]/page.tsx` (add download + copy prompt buttons), `src/components/analysis-report-view.tsx`
- Create: `src/components/download-report-button.tsx`, `src/components/copy-improvement-prompt-button.tsx`, `src/lib/ai/improvement-prompt.ts`, `tests/unit/improvement-prompt.test.ts`
- Modify: `src/app/globals.css` (`@media print`).

**Interfaces:**

- Produces: `buildImprovementPrompt(analysis): string`.

- [ ] **Step 1: Write failing test** for `buildImprovementPrompt` containing score, gaps, recommendations.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** prompt builder + buttons + print CSS + redirects.
- [ ] **Step 4: Run** tests + build → PASS.
- [ ] **Step 5: Commit** `feat: add report download and improvement prompt`.

### Task 6: Update E2E and docs

**Files:**

- Modify: `tests/e2e/analyze.spec.ts`, `tests/e2e/guards.spec.ts`, `README.md`, `.env.example`

- [ ] **Step 1: Update E2E** to admin login flow for history; keep anonymous report flow; add download/copy button presence checks.
- [ ] **Step 2: Run** `npm run test:e2e` → PASS.
- [ ] **Step 3: Update README** with admin env vars and new routes.
- [ ] **Step 4: Run** full verification → PASS.
- [ ] **Step 5: Commit** `test: update e2e for admin history and report tools`.

---

## Execution

Native execution in this session.
