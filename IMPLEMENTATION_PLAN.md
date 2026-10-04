# Implementation Plan — UEM Admission Management System

> Derived from `product.md`. Approved decisions:
> - **Payment gateway:** mock only for now (real gateway plugs into the interface later)
> - **Email provider:** deferred (console/log stub behind a `mailer` interface)
> - **LLM provider:** Ollama or NVIDIA — interface designed for both; built in Phase 6
> - **Database:** MongoDB Atlas (credentials supplied during implementation; live in `.env`, git-ignored)
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
   ├─ .env.example             MONGODB_URI (Atlas SRV), PORT, CLIENT_ORIGIN, secrets
   ├─ package.json             type: module, node --test scripts
   └─ src/
      ├─ index.js              connect MongoDB, start server
      ├─ app.js                helmet, CORS (client origin), JSON, cookie-parser, routes, error handler
      ├─ config.js · errors.js
      ├─ middleware/errorHandler.js
      ├─ routes/               health route (+ placeholder mounts)
      └─ models/               8 models (Phase 1)
```

## Phase 1 — Data layer (this run) — 8 Mongoose models

Per product.md §6 (business rules) and §8 (data model). Storage-level rules in schema;
workflow rules live in services (later phases).

### 1. User
- Unique email, unique full phone (country code + 10 digits)
- `passwordHash` — bcrypt, `select: false`
- `role` enum `applicant|admin`, default `applicant`; never accepted from request bodies
- Lockout counters: `failedLoginAttempts`, `lockedUntil` (5 failures → 15 min, assumption 8)
- Consent flag + timestamp (captured at registration, product.md §10)

### 2. Otp
- `purpose` enum `verify-email | password-reset`
- Only a **hash** of the code stored
- TTL index on expiry: 10 min (verify) / 15 min (reset)
- Attempt counter with limit

### 3. Session
- Only a **hash** of the cookie token
- TTL index (2 hours, assumption 8)
- Deleting the row = instant logout (FR3)

### 4. AuditLog
- actor, action, target, detail, timestamp (NFR 4.2.5)

### 5. Course
- name, level (UG/PG), duration, entrance type, `academicYear` (fees/criteria never hard-coded — product.md §3)
- eligibility % (10th / 12th / PCM / graduation — all optional)
- semester fees array
- booking amounts `{ appearing, passed }` — `null` where unpublished (6 B.Tech rows)
- `applicationFee` default 0 (assumption: no mandatory application fee)

### 6. Application (one per applicant — unique partial index on `applicant`)
All §8 groups **embedded**:
- course + stream (exactly one — [CHANGE] vs SRS 3 ranked preferences)
- candidate: fullName (≤100, in full), gender (M/F), dob, email, mobile (10 digits)
- address: present (R) + permanent (R unless `sameAsPresent`)
- family: father / mother / guardian (name R for all; guardian office address + monthly income R)
- citizenship: `isForeign`; foreign-only fields conditional
- admission test: name, year, registrationNo, rank
- academics: 10th + 12th (with `class12Status: Appearing|Passed` replacing "0 if not declared"),
  12th subject marks (hidden for BBA/MBA), degree block (R for PG), post-graduate block (optional)
- other details: category (`General|OBC|SC|ST|EWS`), bloodGroup, religion, activities (≤250),
  **aadhaarNo / guardianPan — encrypted at rest, masked (last 4) getter**, `abcId` (R)
- antiRagging referenceNo (R before submission)
- documents map: 7 slots — `marksheet10`, `marksheet12`, `graduationMarksheet` (PG),
  `idProof`, `photograph`, `antiRaggingUndertaking`, `categoryCertificate` (R if non-General);
  PDF/JPG/PNG only, ≤ 5 MB, one per slot
- workflow: status enum incl. `Draft` and `AdmissionConfirmed` [ASSUMPTION],
  `referenceNo` (unique, assigned on submit), `draftSavedAt`, `submittedAt`, `statusChangedAt`,
  `decision { by, at, reason }` (reason mandatory on reject)
- Schema-level: percentages 0–100, name ≤100, mobile 10 digits, gender enum, status enum

### 7. Payment
- application ref, `kind` enum (application/admission)
- line items; `amount === sum(items)` validator
- `method`: `online | NEFT | DD`; offline **requires** UTR/DD reference
- gateway transaction reference only — no card data (IR-5.2)
- status enum, `receiptNo`, non-negative money

### 8. Notification
- user ref, type, message, deep link, read flag

## Verification (this run)

- `server/tests/models.test.js` (`node --test`): percentage bounds, name/mobile/gender/status
  enums, document slot type/size limits, amount==sum(items), offline-reference requirement,
  unique + TTL index behaviour. Connects to `MONGODB_URI` (Atlas — dev/test DB) when set;
  skips cleanly with a clear message if unset.
- `server/tests/health.test.js` (Supertest): `GET /api/health` → 200; error shape
  `{ error: { code, message, details } }`.
- Client: `npm run dev` serves placeholder page; proxy reaches `/api/health`.
- Connectivity probe in `index.js` before tests once Atlas credentials are provided.

## Git
- `git init` on request; `main` always working, `dev` integrates, `feature/<module>-<what>` branches (product.md §13).

---

# Later phases (reference roadmap)

| Phase | Content | Owner | product.md step |
|---|---|---|---|
| 2 | Auth backend + UI (register, OTP, login/lockout, logout, forgot/reset, RBAC, seed scripts) | A | 4–5 |
| 3 | Applications + documents (form steps, drafts, preview, submit/lock, uploads, correction flow) | B | 6 |
| 4 | Payments (mock gateway, webhook + status re-check, receipts, offline NEFT/DD) + notifications (log mailer) | C | 7 |
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
