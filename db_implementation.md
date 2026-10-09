# UEM Admission Management System: Implementation Guide

> **Institute of Engineering & Management, Kolkata (IEM–UEM Group)**
> Software Engineering Lab project, Team 7 "Adminatrix"
> Stack: **React + Vite, Node.js + Express, Supabase (PostgreSQL), MongoDB GridFS**

This document describes the implementation details, database schemas, API contracts, and setup instructions derived from the product design in `product.md`.

---

## 1. Architecture overview

```
┌──────────────────────────────────┐
│     React + Vite (Client)        │
│     Applicant & Admin SPA        │
└──────────┬───────────────────────┘
           │ HTTPS / REST (JSON)
┌──────────▼───────────────────────┐
│     Node.js + Express (API)      │
│  ┌─────┬─────┬─────┬─────┬────┐ │
│  │Auth │App  │Doc  │Pay  │Admin│ │
│  │     │Mgmt │Mgmt │     │    │ │
│  ├─────┴─────┴─────┴─────┴────┤ │
│  │   AI Assistant │ Notifier   │ │
│  └─────────────────────────────┘ │
└──────┬──────────────┬────────────┘
       │              │
┌──────▼──────┐ ┌─────▼──────────┐
│  Supabase   │ │ MongoDB GridFS │
│ (PostgreSQL)│ │ (File Storage) │
│             │ │                │
│ users       │ │ fs.files       │
│ sessions    │ │ fs.chunks      │
│ otps        │ │                │
│ courses     │ └────────────────┘
│ applications│
│ app_documents│
│ payments    │
│ notifications│
│ audit_logs  │
└─────────────┘
```

**Supabase (PostgreSQL)** — primary database for all structured/relational data.
**MongoDB GridFS** — exclusively for uploaded binary files (PDF, JPG, PNG documents).

---

## 2. Database schemas

### 2.1 Supabase (PostgreSQL) tables

#### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  country_code VARCHAR(5) NOT NULL DEFAULT '+91',
  mobile CHAR(10) NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'applicant' CHECK (role IN ('applicant', 'admin')),
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  consent BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (country_code, mobile)
);
```

#### otps
```sql
CREATE TABLE otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('verification', 'password_reset')),
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_otps_user_purpose ON otps(user_id, purpose);
```

#### sessions
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
```

#### courses
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year VARCHAR(9) NOT NULL,
  level VARCHAR(10) NOT NULL CHECK (level IN ('UG', 'PG')),
  name VARCHAR(100) NOT NULL,
  stream VARCHAR(100) NOT NULL,
  duration_years INT NOT NULL,
  entrance_type VARCHAR(20) NOT NULL,
  min_10th_percent NUMERIC(5,2),
  min_12th_percent NUMERIC(5,2),
  min_pcm_percent NUMERIC(5,2),
  min_graduation_percent NUMERIC(5,2),
  semester_fees JSONB NOT NULL,
  booking_amount_appearing NUMERIC(10,2),
  booking_amount_passed NUMERIC(10,2),
  application_fee NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (academic_year, name, stream)
);
```

#### applications
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  application_no VARCHAR(20) UNIQUE,
  course_id UUID REFERENCES courses(id),
  stream VARCHAR(100),

  -- Candidate
  full_name VARCHAR(100),
  gender CHAR(1) CHECK (gender IN ('M', 'F')),
  dob DATE,
  email VARCHAR(255),
  mobile VARCHAR(15),

  -- Address (JSONB for present and permanent)
  present_address JSONB,
  permanent_address JSONB,
  same_as_present BOOLEAN DEFAULT FALSE,

  -- Family
  father JSONB,
  mother JSONB,
  guardian JSONB,

  -- Citizenship
  is_foreign BOOLEAN DEFAULT FALSE,
  citizenship_details JSONB,

  -- Admission test
  admission_test JSONB,

  -- Academics
  tenth JSONB,
  twelfth JSONB,
  twelfth_subjects JSONB,
  class12_status VARCHAR(20) CHECK (class12_status IN ('Appearing', 'Passed')),
  degree JSONB,
  post_graduate JSONB,

  -- Other details
  category VARCHAR(20) DEFAULT 'General' CHECK (category IN ('General', 'OBC', 'SC', 'ST', 'EWS')),
  blood_group VARCHAR(5),
  religion VARCHAR(50),
  activities VARCHAR(250),
  aadhaar_no_encrypted TEXT,
  guardian_pan_encrypted TEXT,
  abc_id VARCHAR(50),

  -- Workflow
  status VARCHAR(30) NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Submitted', 'UnderReview', 'CorrectionRequested', 'Approved', 'Rejected', 'AdmissionConfirmed')),
  draft_saved_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  status_changed_at TIMESTAMPTZ,
  decision_by UUID REFERENCES users(id),
  decision_at TIMESTAMPTZ,
  decision_reason TEXT,
  flagged_sections JSONB DEFAULT '[]',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_course ON applications(course_id);
CREATE INDEX idx_applications_app_no ON applications(application_no);
```

#### application_documents
```sql
CREATE TABLE application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  slot VARCHAR(50) NOT NULL CHECK (slot IN (
    'marksheet10', 'marksheet12', 'graduationMarksheet',
    'idProof', 'photograph', 'categoryCertificate'
  )),
  gridfs_file_id VARCHAR(50) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(20) NOT NULL CHECK (mime_type IN ('application/pdf', 'image/jpeg', 'image/png')),
  file_size INT NOT NULL CHECK (file_size <= 5242880),
  upload_status VARCHAR(20) NOT NULL DEFAULT 'uploaded' CHECK (upload_status IN ('uploaded', 'verified', 'flagged')),
  admin_comment TEXT,
  verified_by UUID REFERENCES users(id),
  verified_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, slot)
);
```

#### payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id),
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('application', 'admission')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  line_items JSONB NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('online', 'NEFT', 'DD')),
  gateway_order_id VARCHAR(100),
  gateway_payment_id VARCHAR(100),
  offline_reference VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'success', 'failed')),
  receipt_number VARCHAR(50) UNIQUE,
  recorded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_application ON payments(application_id);
CREATE INDEX idx_payments_status ON payments(status);
```

#### notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  deep_link VARCHAR(500),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
```

#### audit_logs
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
```

### 2.2 MongoDB GridFS collections

MongoDB is used **only** for file storage via GridFS. Two collections are created automatically:

- **fs.files** — file metadata (filename, contentType, uploadDate, length, custom metadata)
- **fs.chunks** — binary chunks of the file data

Custom metadata stored per file:
```json
{
  "applicationId": "uuid-from-supabase",
  "slot": "marksheet10",
  "uploadedBy": "uuid-of-user"
}
```

---

## 3. Application number generation

On form submission, the system generates a unique application number in the format:

```
UEM-<YEAR>-<SEQ>
```

Example: `UEM-2026-00001`, `UEM-2026-00002`, ...

### Implementation

```sql
CREATE SEQUENCE application_no_seq START 1;

-- Called within the submit transaction:
-- application_no = 'UEM-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(nextval('application_no_seq')::TEXT, 5, '0')
```

The application number is:
- Generated **server-side only** during the submit transaction
- Returned to the applicant immediately after successful submission
- Included in the confirmation email notification
- Used as the primary human-readable identifier for all correspondence

---

## 4. Document upload flow (MongoDB GridFS)

```
Applicant selects file
        │
        ▼
Client validates (type, size) ──► reject if invalid
        │
        ▼
POST /api/applications/me/documents/:slot
        │
        ▼
Server validates (mime type, size ≤ 5MB)
        │
        ▼
Stream file to MongoDB GridFS
        │
        ▼
Store metadata in Supabase (application_documents table)
  - gridfs_file_id
  - slot, mime_type, file_size, original_filename
        │
        ▼
Return confirmation with document ID
```

### File retrieval
```
GET /api/applications/me/documents/:slot/download
  or
GET /api/admin/applications/:id/documents/:slot/download
        │
        ▼
Look up gridfs_file_id from Supabase
        │
        ▼
Stream file from MongoDB GridFS to response
```

### File deletion
```
DELETE /api/applications/me/documents/:slot
        │
        ▼
Delete from MongoDB GridFS (by gridfs_file_id)
        │
        ▼
Delete metadata row from Supabase
```

---

## 5. Server setup and connections

### Environment variables (.env)
```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# MongoDB (GridFS only)
MONGODB_URI=mongodb://localhost:27017/iem_admission_files

# Session
SESSION_SECRET=your-session-secret
SESSION_MAX_AGE_MS=7200000

# Payment gateway
PAYMENT_GATEWAY_KEY=your-key
PAYMENT_GATEWAY_SECRET=your-secret

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@iem.edu.in
SMTP_PASS=your-password

# LLM
LLM_API_KEY=your-key
LLM_API_URL=https://api.openai.com/v1

# App
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173
```

### Database initialisation (server/src/db/supabase.js)
```javascript
const { createClient } = require('@supabase/supabase-js');
const config = require('../config');

const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey);

module.exports = supabase;
```

### GridFS initialisation (server/src/db/gridfs.js)
```javascript
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const config = require('../config');

let bucket;

async function connectGridFS() {
  await mongoose.connect(config.mongodbUri);
  bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'fs' });
  return bucket;
}

function getBucket() {
  if (!bucket) throw new Error('GridFS not initialised');
  return bucket;
}

module.exports = { connectGridFS, getBucket };
```

### Server entry point (server/src/index.js)
```javascript
const app = require('./app');
const { connectGridFS } = require('./db/gridfs');
const config = require('./config');

async function start() {
  await connectGridFS();
  console.log('MongoDB GridFS connected');

  app.listen(config.port, () => {
    console.log(`API server running on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
```

---

## 6. Project structure

```
iem-admission/
├─ README.md
├─ client/                          React (Vite)
│  ├─ vite.config.js                proxies /api → :5000
│  ├─ package.json
│  └─ src/
│     ├─ api/http.js                shared axios instance
│     ├─ features/
│     │  ├─ auth/                   login, register, OTP, forgot password
│     │  ├─ application/            multi-step form, draft, preview, submit
│     │  ├─ documents/              upload slots, progress, confirmation
│     │  ├─ payment/                fee display, gateway redirect, receipt
│     │  ├─ admin/                  application list, review, dashboard
│     │  ├─ notifications/          inbox, read/unread
│     │  └─ ai/                     chatbox, course recommender
│     ├─ components/                shared UI components
│     ├─ hooks/                     custom React hooks
│     └─ App.jsx
├─ server/                          Express API
│  ├─ .env.example
│  ├─ package.json
│  └─ src/
│     ├─ app.js                     express app setup
│     ├─ index.js                   entry point (connects DBs, starts server)
│     ├─ config.js                  env vars
│     ├─ errors.js                  custom error classes
│     ├─ db/
│     │  ├─ supabase.js             Supabase client
│     │  ├─ gridfs.js               MongoDB GridFS connection
│     │  └─ migrations/             SQL migration files
│     ├─ middleware/
│     │  ├─ auth.js                 session check
│     │  ├─ rbac.js                 role check
│     │  └─ errorHandler.js         global error handler
│     └─ modules/
│        ├─ auth/
│        │  ├─ routes.js
│        │  └─ service.js
│        ├─ application/
│        │  ├─ routes.js
│        │  └─ service.js           (includes application number generation)
│        ├─ documents/
│        │  ├─ routes.js
│        │  └─ service.js           (GridFS upload/download/delete)
│        ├─ payment/
│        │  ├─ routes.js
│        │  └─ service.js
│        ├─ admin/
│        │  ├─ routes.js
│        │  └─ service.js
│        ├─ ai/
│        │  ├─ routes.js
│        │  └─ service.js
│        └─ notifications/
│           ├─ routes.js
│           └─ service.js
└─ tests/
   ├─ health.test.js
   ├─ auth.test.js
   ├─ application.test.js
   ├─ documents.test.js
   └─ payment.test.js
```

---

## 7. API endpoints

All routes are under `/api`, JSON only, errors shaped as `{ error: { code, message, details } }`.

| Module | Endpoint | Method | Who | Description |
|---|---|---|---|---|
| Auth | `/auth/register` | POST | public | Register with name, email, mobile, password, consent |
| | `/auth/verify-otp` | POST | public | Verify email OTP |
| | `/auth/resend-otp` | POST | public | Resend verification OTP |
| | `/auth/login` | POST | public | Login by email or mobile + password |
| | `/auth/logout` | POST | any | End session immediately |
| | `/auth/me` | GET | any | Get current user |
| | `/auth/forgot-password` | POST | public | Send password reset OTP |
| | `/auth/reset-password` | POST | public | Reset password with OTP |
| Courses | `/courses` | GET | any | List available courses and fees |
| Application | `/applications/me` | GET | applicant | Get current application (draft or submitted) |
| | `/applications/me` | PUT | applicant | Save draft |
| | `/applications/me/preview` | GET | applicant | Read-only preview |
| | `/applications/me/submit` | POST | applicant | Submit and lock; **generates application number** |
| Documents | `/applications/me/documents/:slot` | POST | applicant | Upload document to GridFS |
| | `/applications/me/documents/:slot` | DELETE | applicant | Delete document from GridFS |
| | `/applications/me/documents/:slot/download` | GET | applicant | Download document from GridFS |
| Payment | `/payments` | POST | applicant | Create payment order |
| | `/payments/webhook` | POST | gateway | Payment gateway webhook |
| | `/payments/:id/status` | GET | applicant | Check payment status |
| | `/payments/:id/receipt` | GET | applicant | Download receipt PDF |
| Notifications | `/notifications` | GET | applicant | List notifications |
| | `/notifications/:id/read` | PATCH | applicant | Mark as read |
| Admin | `/admin/applications` | GET | admin | List/filter/paginate applications |
| | `/admin/applications/:id` | GET | admin | Consolidated application view |
| | `/admin/applications/:id/documents/:slot` | PATCH | admin | Verify/flag document |
| | `/admin/applications/:id/documents/:slot/download` | GET | admin | Download applicant document from GridFS |
| | `/admin/applications/:id/decision` | POST | admin | Approve/reject (reason required for reject) |
| | `/admin/applications/:id/request-correction` | POST | admin | Request correction on flagged sections |
| | `/admin/payments/:id/record-offline` | POST | admin | Record NEFT/DD payment |
| | `/admin/dashboard` | GET | admin | Dashboard stats |
| | `/admin/export` | GET | admin | Export CSV/PDF |
| AI | `/ai/chat` | POST | applicant | Chat with AI assistant |
| | `/ai/recommend-courses` | POST | applicant | Get course recommendations |
| | `/ai/check-document` | POST | applicant | AI document quality pre-check |
| | `/ai/status-explanation` | GET | applicant | Plain-language status explanation |
| | `/admin/ai/insights` | GET | admin | AI trend insights |

---

## 8. Document slots

| Slot name | Required | Condition |
|---|---|---|
| `marksheet10` | Yes | Always |
| `marksheet12` | Yes | Always |
| `graduationMarksheet` | Yes | PG programmes only |
| `idProof` | Yes | Always |
| `photograph` | Yes | Always |
| `categoryCertificate` | Yes | When category is not General |

---

## 9. Application status lifecycle

```
[*] --> Draft
Draft --> Submitted: Applicant submits (application no. generated)
Submitted --> UnderReview: Admin opens for review
UnderReview --> CorrectionRequested: Admin flags an issue
CorrectionRequested --> Submitted: Applicant fixes and resubmits
UnderReview --> Approved: Admin approves
UnderReview --> Rejected: Admin rejects (reason required)
Approved --> AdmissionConfirmed: Booking amount paid
Rejected --> [*]
AdmissionConfirmed --> [*]
```

---

## 10. Key implementation notes

1. **Supabase is the single source of truth** for all structured data. All business logic queries go through the Supabase JS client or direct PostgreSQL connection.

2. **MongoDB is used exclusively for GridFS file storage.** No application data, user data, or business logic data is stored in MongoDB. The only MongoDB collections are `fs.files` and `fs.chunks`.

3. **Application number** (`UEM-YYYY-NNNNN`) is generated atomically during the submit transaction using a PostgreSQL sequence. It is never generated client-side.

4. **File uploads** are streamed directly to GridFS. The `gridfs_file_id` is stored in the `application_documents` table in Supabase to link files to applications.

5. **Transactions**: Critical operations (submit, payment confirmation, status changes) use Supabase/PostgreSQL transactions to ensure atomicity.

6. **No anti-ragging data** is collected or stored by this system. The anti-ragging undertaking is handled externally and is outside the scope of this admission portal.

---

## 11. Dependencies

### Server (package.json)
```json
{
  "dependencies": {
    "express": "^4.18",
    "@supabase/supabase-js": "^2.x",
    "mongoose": "^8.x",
    "bcrypt": "^5.x",
    "zod": "^3.x",
    "cookie-parser": "^1.x",
    "helmet": "^7.x",
    "cors": "^2.x",
    "nodemailer": "^6.x",
    "multer": "^1.x",
    "uuid": "^9.x"
  },
  "devDependencies": {
    "supertest": "^6.x"
  }
}
```

### Client (package.json)
```json
{
  "dependencies": {
    "react": "^18.x",
    "react-dom": "^18.x",
    "react-router-dom": "^6.x",
    "axios": "^1.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x"
  }
}
```

---

## 12. Setup instructions

1. **Clone the repository** and install dependencies:
   ```bash
   cd iem-admission
   cd server && npm install
   cd ../client && npm install
   ```

2. **Set up Supabase:**
   - Create a project at [supabase.com](https://supabase.com)
   - Run the SQL migrations from `server/src/db/migrations/` in the Supabase SQL editor
   - Copy the project URL and keys to `.env`

3. **Set up MongoDB (for GridFS):**
   - Install MongoDB locally or use MongoDB Atlas
   - Set `MONGODB_URI` in `.env`

4. **Configure environment:**
   - Copy `server/.env.example` to `server/.env`
   - Fill in all required values

5. **Seed admin user:**
   ```bash
   cd server && node src/scripts/seed-admin.js
   ```

6. **Start development:**
   ```bash
   # Terminal 1: API server
   cd server && npm run dev

   # Terminal 2: React client
   cd client && npm run dev
   ```

7. **Run tests:**
   ```bash
   cd server && node --test
   ```
