# Implementation Plan — UEM Admission Management System

> Derived from `product.md`. Approved decisions:
> - **Payment gateway:** mock only for now (real gateway plugs into the interface later)
> - **Email provider:** deferred (console/log stub behind a `mailer` interface)
> - **LLM provider:** Ollama or NVIDIA — interface designed for both; built in Phase 6
> - **Primary database:** Supabase (PostgreSQL) for all structured data (credentials in `.env`, git-ignored)
> - **File storage:** MongoDB GridFS exclusively for uploaded documents (credentials in `.env`, git-ignored)
> - **Scope of this run:** Phases 0–1 only (scaffold + data layer)

---

## Phase 0 — Scaffold (this run)

```
iem-admission/
├─ README.md
├─ client/                     React + Vite
│  ├─ vite.config.js           proxy /api → :5000
│  └─ src/
│     ├─ main.jsx · App.jsx · router
│     └─ api/http.js           axios instance (withCredentials, normalized errors)
└─ server/                     Express
   ├─ .env.example             SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, MONGODB_URI, PORT, CLIENT_ORIGIN, secrets
   ├─ package.json             type: module, node --test scripts
   └─ src/
      ├─ index.js              connect Supabase + MongoDB GridFS, start server
      ├─ app.js                helmet, CORS (client origin), JSON, cookie-parser, routes, error handler
      ├─ config.js · errors.js
      ├─ db/
      │  ├─ supabase.js        Supabase client initialisation
      │  └─ gridfs.js          MongoDB GridFS connection and helpers
      ├─ middleware/errorHandler.js
      ├─ routes/               health route (+ placeholder mounts)
      └─ modules/              per-module routes and services (later phases)
```

## Phase 1 — Data layer (this run) — Supabase tables + MongoDB GridFS

Per product.md §6 (business rules) and §8 (data model). Storage-level rules enforced via
PostgreSQL constraints and CHECK clauses; workflow rules live in services (later phases).
File uploads stored exclusively in MongoDB GridFS.

### 1. User (Supabase table: `users`)
- Unique email, unique full phone (country code + 10 digits)
- `password_hash` — bcrypt, never returned in queries by default
- `role` enum `applicant|admin`, default `applicant`; never accepted from request bodies
- Lockout counters: `failed_login_attempts`, `locked_until` (5 failures → 15 min, assumption 8)
- Consent flag + timestamp (captured at registration, product.md §10)

### 2. Otp (Supabase table: `otps`)
- `purpose` enum `verify-email | password-reset`
- Only a **hash** of the code stored
- Expiry timestamp: 10 min (verify) / 15 min (reset); cleaned up by scheduled job
- Attempt counter with limit

### 3. Session (Supabase table: `sessions`)
- Only a **hash** of the cookie token
- Expiry timestamp (2 hours, assumption 8)
- Deleting the row = instant logout (FR3)

### 4. AuditLog (Supabase table: `audit_logs`)
- actor, action, target, detail, timestamp (NFR 4.2.5)

### 5. Course (Supabase table: `courses`)
- name, level (UG/PG), duration, entrance type, `academic_year` (fees/criteria never hard-coded — product.md §3)
- eligibility % (10th / 12th / PCM / graduation — all optional)
- semester fees (JSONB array)
- booking amounts `{ appearing, passed }` — `null` where unpublished (6 B.Tech rows)
- `application_fee` default 0 (assumption: no mandatory application fee)

### 6. Application (Supabase table: `applications` — one per applicant, unique on `user_id`)
All §8 groups stored as columns or JSONB:
- course ref + stream (exactly one — [CHANGE] vs SRS 3 ranked preferences)
- candidate: full_name (≤100, in full), gender (M/F), dob, email, mobile (10 digits)
- address: present (R) + permanent (R unless `same_as_present`) — JSONB
- family: father / mother / guardian (name R for all; guardian office address + monthly income R) — JSONB
- citizenship: `is_foreign`; foreign-only fields conditional — JSONB
- admission test: name, year, registration_no, rank — JSONB
- academics: 10th + 12th (with `class12_status: Appearing|Passed` replacing "0 if not declared"),
  12th subject marks (hidden for BBA/MBA), degree block (R for PG), post-graduate block (optional) — JSONB
- other details: category (`General|OBC|SC|ST|EWS`), blood_group, religion, activities (≤250),
  **aadhaar_no / guardian_pan — encrypted at rest, masked (last 4) in read operations**, `abc_id` (R)
- workflow: status enum incl. `Draft` and `AdmissionConfirmed` [ASSUMPTION],
  `application_no` (unique, auto-generated on submit as `UEM-YYYY-NNNNN` using PostgreSQL sequence),
  `draft_saved_at`, `submitted_at`, `status_changed_at`,
  `decision { by, at, reason }` (reason mandatory on reject)
- `flagged_sections` JSONB array for correction flow
- Schema-level: percentages 0–100, name ≤100, mobile 10 digits, gender enum, status enum (all via CHECK constraints)

### 6a. ApplicationDocument (Supabase table: `application_documents`)
- Links application to GridFS file: `gridfs_file_id`, `slot`, `mime_type`, `file_size`, `original_filename`
- 6 slots: `marksheet10`, `marksheet12`, `graduationMarksheet` (PG),
  `idProof`, `photograph`, `categoryCertificate` (R if non-General)
- PDF/JPG/PNG only, ≤ 5 MB, one per slot (unique constraint on application_id + slot)
- `upload_status`: uploaded | verified | flagged
- `admin_comment`, `verified_by`, `verified_at`

### 6b. File storage (MongoDB GridFS)
- All uploaded document binary data stored in GridFS (`fs.files` + `fs.chunks`)
- Custom metadata per file: `applicationId`, `slot`, `uploadedBy`
- Files streamed to/from GridFS; never held in memory or stored on the local filesystem

### 7. Payment (Supabase table: `payments`)
- application ref, `kind` enum (application/admission)
- line items; `amount === sum(items)` validator
- `method`: `online | NEFT | DD`; offline **requires** UTR/DD reference
- gateway transaction reference only — no card data (IR-5.2)
- status enum, `receiptNo`, non-negative money

### 8. Notification (Supabase table: `notifications`)
- user ref, type, message, deep link, read flag

## Verification (this run)

- `server/tests/models.test.js` (`node --test`): percentage bounds, name/mobile/gender/status
  enums, document slot type/size limits, amount==sum(items), offline-reference requirement,
  unique constraint behaviour. Connects to Supabase (dev/test project) and MongoDB (for GridFS)
  when credentials are set in `.env`; skips cleanly with a clear message if unset.
- `server/tests/health.test.js` (Supertest): `GET /api/health` → 200; error shape
  `{ error: { code, message, details } }`.
- Client: `npm run dev` serves placeholder page; proxy reaches `/api/health`.
- Connectivity probe in `index.js` for both Supabase and MongoDB GridFS before tests once credentials are provided.

## Git
- `git init` on request; `main` always working, `dev` integrates, `feature/<module>-<what>` branches (product.md §13).

---

# Later phases (reference roadmap)

| Phase | Content | Owner | product.md step |
|---|---|---|---|
| 2 | Auth backend + UI (register, OTP, login/lockout, logout, forgot/reset, RBAC, seed scripts) — Supabase for user/session/otp tables | A | 4–5 |
| 3 | Applications + documents (form steps, drafts, preview, submit/lock with application number generation, uploads to GridFS, correction flow) | B | 6 |
| 4 | Payments (mock gateway, webhook + status re-check, receipts, offline NEFT/DD) + notifications (log mailer) — Supabase for payments/notifications tables | C | 7 |
| 5 | Admin review (consolidated view, filters, verify/flag, decisions, dashboard, CSV/PDF export) | A | 8 |
| 6 | AI assistant behind feature flag (chat, recommender, doc pre-check, status explainer, admin insights) via Ollama/NVIDIA interface | C | 9 |
| 7 | Hardening: FR-traceable tests, security pass, UAT, accessibility, docs | all | 10 |

## Open questions carried from product.md §15 (won't block Phases 0–1)
- Uniform ₹6,500 + medical ₹1,000: extra on top of booking, or part of semester-1 fee?
- Email only or SMS too?
- Courses with no published booking amount: how charged?
- Unseen middle of the existing form + dropdown option lists
- Degree block mandatory for UG? (asterisk in screenshot)
- Aadhaar/PAN collection — legal/faculty confirmation 
- Application fee existence (conflicting third-party claims)
- Portal replaces vs sits in front of the existing form
