import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import { resetAuthStore } from '../src/modules/auth/service.js';

describe('Phase 2 — Authentication & Access Control Tests', () => {
  beforeEach(() => {
    resetAuthStore();
  });

  describe('1. Account Registration & Email OTP Generation', () => {
    it('should register a new applicant, issue default applicant role, and generate an OTP', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Subhashree Bose',
          email: 'subhashree@example.com',
          countryCode: '+91',
          mobile: '9876543211',
          password: 'Password@123',
          consent: true,
        });

      assert.equal(res.status, 201);
      assert.equal(res.body.success, true);
      assert.equal(res.body.user.role, 'applicant');
      assert.equal(res.body.user.isVerified, false);
      assert.equal(res.body.user.email, 'subhashree@example.com');
      assert.ok(res.body.otpCode, 'OTP code should be generated');
      assert.equal(res.body.otpCode.length, 6);
    });

    it('should reject registration if email is already taken', async () => {
      const payload = {
        fullName: 'First User',
        email: 'duplicate@example.com',
        countryCode: '+91',
        mobile: '9876543212',
        password: 'Password@123',
        consent: true,
      };

      const res1 = await request(app).post('/api/auth/register').send(payload);
      assert.equal(res1.status, 201);

      const res2 = await request(app).post('/api/auth/register').send({
        ...payload,
        mobile: '9876543213', // different phone, duplicate email
      });
      assert.equal(res2.status, 409);
      assert.equal(res2.body.error.code, 'CONFLICT');
    });

    it('should verify OTP and mark user account as verified', async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Tanmoy Roy',
          email: 'tanmoy@example.com',
          countryCode: '+91',
          mobile: '9876543214',
          password: 'Password@123',
          consent: true,
        });

      const otp = reg.body.otpCode;

      // Bad OTP attempt
      const badVerify = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'tanmoy@example.com', otp: '000000' });
      assert.equal(badVerify.status, 400);

      // Correct OTP attempt
      const goodVerify = await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'tanmoy@example.com', otp });

      assert.equal(goodVerify.status, 200);
      assert.equal(goodVerify.body.success, true);
    });

    it('should resend OTP when requested', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Priya Das',
          email: 'priya@example.com',
          countryCode: '+91',
          mobile: '9876543215',
          password: 'Password@123',
          consent: true,
        });

      const resend = await request(app)
        .post('/api/auth/resend-otp')
        .send({ email: 'priya@example.com' });

      assert.equal(resend.status, 200);
      assert.ok(resend.body.otpCode);
    });
  });

  describe('2. Failed Login Lockout (5 attempts -> 15 min lock)', () => {
    it('should enforce account lockout after 5 consecutive failed login attempts', async () => {
      // 1. Create applicant
      await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Debanjan Ghosh',
          email: 'debanjan@example.com',
          countryCode: '+91',
          mobile: '9876543216',
          password: 'CorrectPassword@1',
          consent: true,
        });

      // 2. Perform 4 wrong password attempts (returns 401)
      for (let i = 1; i <= 4; i++) {
        const res = await request(app)
          .post('/api/auth/login')
          .send({ identifier: 'debanjan@example.com', password: 'WrongPassword@1' });
        assert.equal(res.status, 401);
        assert.equal(res.body.error.code, 'UNAUTHORIZED');
      }

      // 3. 5th wrong attempt triggers lockout threshold
      const fifthRes = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'debanjan@example.com', password: 'WrongPassword@1' });
      assert.equal(fifthRes.status, 401);

      // 4. 6th attempt (even with CORRECT password) must be rejected with 429 TOO_MANY_REQUESTS
      const lockedRes = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'debanjan@example.com', password: 'CorrectPassword@1' });

      assert.equal(lockedRes.status, 429);
      assert.equal(lockedRes.body.error.code, 'TOO_MANY_REQUESTS');
      assert.ok(lockedRes.body.error.message.includes('temporarily locked'));
    });
  });

  describe('3. Session Row Creation & Immediate Revocation on Logout', () => {
    it('should create session cookie on login, allow access to /me, and revoke session instantly on logout', async () => {
      // 1. Register & verify
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Ananya Mitra',
          email: 'ananya@example.com',
          countryCode: '+91',
          mobile: '9876543217',
          password: 'Password@123',
          consent: true,
        });
      await request(app)
        .post('/api/auth/verify-otp')
        .send({ email: 'ananya@example.com', otp: reg.body.otpCode });

      // 2. Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'ananya@example.com', password: 'Password@123' });

      assert.equal(loginRes.status, 200);
      assert.ok(loginRes.headers['set-cookie'], 'Set-Cookie header must be present');
      const cookie = loginRes.headers['set-cookie'][0];
      assert.ok(cookie.includes('iem_session='));
      assert.ok(cookie.includes('HttpOnly'));
      assert.ok(cookie.includes('SameSite=Strict'));

      // 3. Access protected /api/auth/me
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [cookie]);

      assert.equal(meRes.status, 200);
      assert.equal(meRes.body.user.email, 'ananya@example.com');
      assert.equal(meRes.body.user.role, 'applicant');

      // 4. Logout (destroys session row)
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [cookie]);

      assert.equal(logoutRes.status, 200);
      assert.equal(logoutRes.body.success, true);

      // 5. Subsequent access to /api/auth/me with old cookie must fail with 401 UNAUTHORIZED
      const meAfterLogout = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [cookie]);

      assert.equal(meAfterLogout.status, 401);
      assert.equal(meAfterLogout.body.error.code, 'UNAUTHORIZED');
    });
  });

  describe('4. RBAC Route Protection (Deny-by-default & Admin checks)', () => {
    it('should deny unauthenticated requests to protected admin routes with 401', async () => {
      const res = await request(app).get('/api/admin/ping');
      assert.equal(res.status, 401);
      assert.equal(res.body.error.code, 'UNAUTHORIZED');
    });

    it('should forbid applicants from accessing admin-only routes with 403', async () => {
      // Create and login as applicant
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Applicant User',
          email: 'applicant@example.com',
          countryCode: '+91',
          mobile: '9876543218',
          password: 'Password@123',
          consent: true,
        });

      const login = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'applicant@example.com', password: 'Password@123' });

      const cookie = login.headers['set-cookie'][0];

      // Attempt to access admin route
      const adminRes = await request(app)
        .get('/api/admin/ping')
        .set('Cookie', [cookie]);

      assert.equal(adminRes.status, 403);
      assert.equal(adminRes.body.error.code, 'FORBIDDEN');
      assert.ok(adminRes.body.error.message.includes('admin'));
    });

    it('should permit admin users to access admin routes with 200', async () => {
      const reg = await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Office Admin',
          email: 'admin.user@iem.edu.in',
          countryCode: '+91',
          mobile: '9876543219',
          password: 'AdminPassword@123',
          consent: true,
        });

      // Elevate user role to admin in store
      const { setInMemoryUserRole } = await import('../src/modules/auth/service.js');
      setInMemoryUserRole(reg.body.user.id, 'admin');

      // Login as admin
      const login = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'admin.user@iem.edu.in', password: 'AdminPassword@123' });

      assert.equal(login.status, 200);
      assert.equal(login.body.user.role, 'admin');

      const cookie = login.headers['set-cookie'][0];

      // Access admin endpoint
      const adminRes = await request(app)
        .get('/api/admin/ping')
        .set('Cookie', [cookie]);

      assert.equal(adminRes.status, 200);
      assert.equal(adminRes.body.status, 'ok');
      assert.equal(adminRes.body.role, 'admin');
    });
  });

  describe('5. Password Reset Workflow', () => {
    it('should issue reset code and update password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          fullName: 'Reset Tester',
          email: 'reset@example.com',
          countryCode: '+91',
          mobile: '9876543220',
          password: 'OldPassword@1',
          consent: true,
        });

      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'reset@example.com' });

      assert.equal(forgotRes.status, 200);
      const resetCode = forgotRes.body.otpCode;
      assert.ok(resetCode);

      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: 'reset@example.com',
          otp: resetCode,
          newPassword: 'NewPassword@2',
        });

      assert.equal(resetRes.status, 200);

      // Now login with new password
      const loginNew = await request(app)
        .post('/api/auth/login')
        .send({ identifier: 'reset@example.com', password: 'NewPassword@2' });
      assert.equal(loginNew.status, 200);
    });
  });
});
