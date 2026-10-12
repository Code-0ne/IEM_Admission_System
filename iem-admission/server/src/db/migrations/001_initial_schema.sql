-- =============================================================================
-- Migration: 001_initial_schema.sql
-- UEM Admission Management System - Primary PostgreSQL Schema (Supabase)
-- Defined strictly per db_implementation.md and product.md
-- =============================================================================

-- Enable pgcrypto / uuid generation if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- 0. Application Number Sequence & Generator Function
-- -----------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS application_no_seq START WITH 1 INCREMENT BY 1;

CREATE OR REPLACE FUNCTION generate_application_no()
RETURNS TEXT AS $$
BEGIN
  RETURN 'UEM-' || EXTRACT(YEAR FROM NOW())::TEXT || '-' || LPAD(nextval('application_no_seq')::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- -----------------------------------------------------------------------------
-- 1. Users Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
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

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- -----------------------------------------------------------------------------
-- 2. OTPs Table (Email verification & password reset)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  purpose VARCHAR(20) NOT NULL CHECK (purpose IN ('verification', 'password_reset')),
  attempts INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otps_user_purpose ON otps(user_id, purpose);

-- -----------------------------------------------------------------------------
-- 3. Sessions Table (Server-side hashed session tokens)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token_hash);

-- -----------------------------------------------------------------------------
-- 4. Courses Table (Dynamic catalogue per academic year)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS courses (
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

CREATE INDEX IF NOT EXISTS idx_courses_year_level ON courses(academic_year, level);

-- -----------------------------------------------------------------------------
-- 5. Applications Table (1 per applicant)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id),
  application_no VARCHAR(20) UNIQUE,
  course_id UUID REFERENCES courses(id),
  stream VARCHAR(100),

  -- Candidate details
  full_name VARCHAR(100),
  gender CHAR(1) CHECK (gender IN ('M', 'F')),
  dob DATE,
  email VARCHAR(255),
  mobile VARCHAR(15),

  -- Address blocks (JSONB)
  present_address JSONB,
  permanent_address JSONB,
  same_as_present BOOLEAN DEFAULT FALSE,

  -- Family blocks (JSONB)
  father JSONB,
  mother JSONB,
  guardian JSONB,

  -- Citizenship details
  is_foreign BOOLEAN DEFAULT FALSE,
  citizenship_details JSONB,

  -- Admission test details
  admission_test JSONB,

  -- Academic records (JSONB)
  tenth JSONB,
  twelfth JSONB,
  twelfth_subjects JSONB,
  class12_status VARCHAR(20) CHECK (class12_status IN ('Appearing', 'Passed')),
  degree JSONB,
  post_graduate JSONB,

  -- Other information
  category VARCHAR(20) DEFAULT 'General' CHECK (category IN ('General', 'OBC', 'SC', 'ST', 'EWS')),
  blood_group VARCHAR(5),
  religion VARCHAR(50),
  activities VARCHAR(250),
  aadhaar_no_encrypted TEXT,
  guardian_pan_encrypted TEXT,
  abc_id VARCHAR(50),

  -- Workflow lifecycle
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

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_course ON applications(course_id);
CREATE INDEX IF NOT EXISTS idx_applications_app_no ON applications(application_no);
CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id);

-- -----------------------------------------------------------------------------
-- 6. Application Documents Table (Metadata linking to GridFS files)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS application_documents (
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

CREATE INDEX IF NOT EXISTS idx_app_documents_app ON application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_app_documents_gridfs ON application_documents(gridfs_file_id);

-- -----------------------------------------------------------------------------
-- 7. Payments Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
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

CREATE INDEX IF NOT EXISTS idx_payments_application ON payments(application_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_number);

-- -----------------------------------------------------------------------------
-- 8. Notifications Table
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  deep_link VARCHAR(500),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- -----------------------------------------------------------------------------
-- 9. Audit Logs Table (Administrative accountability)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id UUID,
  detail JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
