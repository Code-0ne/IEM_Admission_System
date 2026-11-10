import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  userRegistrationSchema,
  documentUploadSchema,
  percentageSchema,
  paymentSchema,
  applicationStatusSchema,
  isValidApplicationNumber,
  ALLOWED_DOCUMENT_SLOTS,
  MAX_DOCUMENT_FILE_SIZE,
} from '../src/db/validators.js';
import { probeSupabase } from '../src/db/supabase.js';
import { probeGridFS } from '../src/db/gridfs.js';
import { getInitialSchemaSQL } from '../src/db/migrate.js';

describe('Domain Model & Constraint Tests', () => {
  describe('User & Registration Constraints', () => {
    it('should validate correct user registration payload', () => {
      const valid = userRegistrationSchema.safeParse({
        fullName: 'Aritra Sen',
        email: 'aritra@example.com',
        countryCode: '+91',
        mobile: '9876543210',
        password: 'Password@123',
        consent: true,
      });
      assert.equal(valid.success, true);
    });

    it('should reject names exceeding 100 characters', () => {
      const invalid = userRegistrationSchema.safeParse({
        fullName: 'A'.repeat(101),
        email: 'test@example.com',
        mobile: '9876543210',
        password: 'Password@123',
        consent: true,
      });
      assert.equal(invalid.success, false);
      assert.ok(invalid.error.issues.some((i) => i.path.includes('fullName')));
    });

    it('should reject invalid mobile numbers (must be exactly 10 digits)', () => {
      const short = userRegistrationSchema.safeParse({
        fullName: 'Test User',
        email: 'test@example.com',
        mobile: '123456789', // 9 digits
        password: 'Password@123',
        consent: true,
      });
      assert.equal(short.success, false);

      const alpha = userRegistrationSchema.safeParse({
        fullName: 'Test User',
        email: 'test@example.com',
        mobile: '98765abcde',
        password: 'Password@123',
        consent: true,
      });
      assert.equal(alpha.success, false);
    });

    it('should reject weak passwords without required complexity', () => {
      // Missing uppercase
      assert.equal(
        userRegistrationSchema.safeParse({
          fullName: 'Test User',
          email: 'test@example.com',
          mobile: '9876543210',
          password: 'password@123',
          consent: true,
        }).success,
        false
      );

      // Missing special character
      assert.equal(
        userRegistrationSchema.safeParse({
          fullName: 'Test User',
          email: 'test@example.com',
          mobile: '9876543210',
          password: 'Password123',
          consent: true,
        }).success,
        false
      );

      // Shorter than 8 chars
      assert.equal(
        userRegistrationSchema.safeParse({
          fullName: 'Test User',
          email: 'test@example.com',
          mobile: '9876543210',
          password: 'Pass@1',
          consent: true,
        }).success,
        false
      );
    });
  });

  describe('Percentage & Academic Constraints', () => {
    it('should accept percentages between 0 and 100', () => {
      assert.equal(percentageSchema.safeParse(0).success, true);
      assert.equal(percentageSchema.safeParse(85.5).success, true);
      assert.equal(percentageSchema.safeParse(100).success, true);
    });

    it('should reject percentages below 0 or above 100', () => {
      assert.equal(percentageSchema.safeParse(-1).success, false);
      assert.equal(percentageSchema.safeParse(100.01).success, false);
    });
  });

  describe('Document Slot & Upload Constraints', () => {
    it('should accept valid slots with size <= 5 MB and valid MIME types', () => {
      for (const slot of ALLOWED_DOCUMENT_SLOTS) {
        const valid = documentUploadSchema.safeParse({
          slot,
          mimeType: 'application/pdf',
          fileSize: 1024 * 500, // 500 KB
        });
        assert.equal(valid.success, true, `Failed on slot ${slot}`);
      }
    });

    it('should reject files exceeding 5 MB (5242880 bytes)', () => {
      const invalid = documentUploadSchema.safeParse({
        slot: 'marksheet10',
        mimeType: 'application/pdf',
        fileSize: MAX_DOCUMENT_FILE_SIZE + 1,
      });
      assert.equal(invalid.success, false);
      assert.ok(invalid.error.issues.some((i) => i.path.includes('fileSize')));
    });

    it('should reject disallowed MIME types', () => {
      const invalid = documentUploadSchema.safeParse({
        slot: 'marksheet10',
        mimeType: 'application/x-msdownload',
        fileSize: 1024,
      });
      assert.equal(invalid.success, false);
    });
  });

  describe('Payment Calculation & Offline Verification Constraints', () => {
    it('should accept payment when amount exactly equals the sum of line items', () => {
      const valid = paymentSchema.safeParse({
        kind: 'admission',
        amount: 57500,
        lineItems: [
          { label: 'Booking Amount', amount: 50000 },
          { label: 'Uniform', amount: 6500 },
          { label: 'Medical fitness report', amount: 1000 },
        ],
        method: 'online',
      });
      assert.equal(valid.success, true);
    });

    it('should reject payment if amount does not match the sum of line items', () => {
      const invalid = paymentSchema.safeParse({
        kind: 'admission',
        amount: 50000, // Incorrect, sum is 57500
        lineItems: [
          { label: 'Booking Amount', amount: 50000 },
          { label: 'Uniform', amount: 6500 },
          { label: 'Medical fitness report', amount: 1000 },
        ],
        method: 'online',
      });
      assert.equal(invalid.success, false);
      assert.ok(invalid.error.issues.some((i) => i.path.includes('amount')));
    });

    it('should require offlineReference for NEFT and DD payments', () => {
      const withoutRef = paymentSchema.safeParse({
        kind: 'admission',
        amount: 50000,
        lineItems: [{ label: 'Booking Amount', amount: 50000 }],
        method: 'NEFT',
        offlineReference: '',
      });
      assert.equal(withoutRef.success, false);
      assert.ok(withoutRef.error.issues.some((i) => i.path.includes('offlineReference')));

      const withRef = paymentSchema.safeParse({
        kind: 'admission',
        amount: 50000,
        lineItems: [{ label: 'Booking Amount', amount: 50000 }],
        method: 'NEFT',
        offlineReference: 'AXISB0000123456789',
      });
      assert.equal(withRef.success, true);
    });
  });

  describe('Application Workflow & Numbering Constraints', () => {
    it('should validate the sequential application number format (UEM-YYYY-NNNNN)', () => {
      assert.equal(isValidApplicationNumber('UEM-2026-00001'), true);
      assert.equal(isValidApplicationNumber('UEM-2026-99999'), true);
      assert.equal(isValidApplicationNumber('UEM-26-001'), false);
      assert.equal(isValidApplicationNumber('APP-2026-00001'), false);
    });

    it('should validate official application status lifecycle enums', () => {
      const allowed = [
        'Draft',
        'Submitted',
        'UnderReview',
        'CorrectionRequested',
        'Approved',
        'Rejected',
        'AdmissionConfirmed',
      ];
      for (const status of allowed) {
        assert.equal(applicationStatusSchema.safeParse(status).success, true);
      }
      assert.equal(applicationStatusSchema.safeParse('Pending').success, false);
      assert.equal(applicationStatusSchema.safeParse('Cancelled').success, false);
    });
  });

  describe('Database Schema Definition Verification', () => {
    it('migration script should define all 9 tables and sequence', () => {
      const sql = getInitialSchemaSQL();
      assert.ok(sql.includes('CREATE SEQUENCE IF NOT EXISTS application_no_seq'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS users'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS otps'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS sessions'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS courses'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS applications'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS application_documents'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS payments'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS notifications'));
      assert.ok(sql.includes('CREATE TABLE IF NOT EXISTS audit_logs'));
    });
  });

  describe('Database Connector Probes (Environment Agnostic)', () => {
    it('probeSupabase should handle unconfigured environment without crashing', async () => {
      const result = await probeSupabase();
      assert.ok(typeof result.ok === 'boolean');
      assert.ok(typeof result.message === 'string');
      if (!result.configured) {
        assert.equal(result.ok, false);
        assert.ok(result.message.includes('missing') || result.message.includes('not configured'));
      }
    });

    it('probeGridFS should handle unconfigured environment without crashing', async () => {
      const result = await probeGridFS();
      assert.ok(typeof result.ok === 'boolean');
      assert.ok(typeof result.message === 'string');
      if (!result.configured) {
        assert.equal(result.ok, false);
        assert.ok(result.message.includes('missing') || result.message.includes('not configured'));
      }
    });
  });
});
