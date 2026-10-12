import crypto from 'crypto';
import bcrypt from 'bcrypt';
import config from '../../config.js';
import {
  BadRequestError,
  UnauthorizedError,
  TooManyRequestsError,
  ConflictError,
  NotFoundError,
} from '../../errors.js';
import { getSupabaseClient } from '../../db/supabase.js';

// Salt rounds for password hashing
const SALT_ROUNDS = 10;

// In-memory data store for testing and when Supabase credentials are not configured
const inMemoryStore = {
  users: new Map(), // id -> user
  usersByEmail: new Map(), // email -> id
  usersByPhone: new Map(), // countryCode+mobile -> id
  otps: new Map(), // id -> otp
  sessions: new Map(), // token_hash -> session
  auditLogs: [],
};

// Reset in-memory store helper (useful for isolated unit/integration tests)
export function resetAuthStore() {
  inMemoryStore.users.clear();
  inMemoryStore.usersByEmail.clear();
  inMemoryStore.usersByPhone.clear();
  inMemoryStore.otps.clear();
  inMemoryStore.sessions.clear();
  inMemoryStore.auditLogs = [];
}

/**
 * Set user role in in-memory store (for testing/seeding)
 */
export function setInMemoryUserRole(userId, role) {
  const user = inMemoryStore.users.get(userId);
  if (user) {
    user.role = role;
  }
}

/**
 * Hash an OTP code with token secret
 */
export function hashOtp(otpCode) {
  return crypto
    .createHash('sha256')
    .update(`${otpCode}:${config.auth.tokenSecret}`)
    .digest('hex');
}

/**
 * Hash a session token with token secret
 */
export function hashSessionToken(token) {
  return crypto
    .createHash('sha256')
    .update(`${token}:${config.auth.tokenSecret}`)
    .digest('hex');
}

/**
 * Generate a 6-digit numeric OTP string
 */
export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Sanitize user object to never leak password_hash
 */
export function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, passwordHash, ...safeUser } = user;
  return {
    id: safeUser.id,
    fullName: safeUser.full_name || safeUser.fullName,
    email: safeUser.email,
    countryCode: safeUser.country_code || safeUser.countryCode || '+91',
    mobile: safeUser.mobile,
    role: safeUser.role || 'applicant',
    isVerified: Boolean(safeUser.is_verified ?? safeUser.isVerified),
    consent: Boolean(safeUser.consent),
    createdAt: safeUser.created_at || safeUser.createdAt,
    updatedAt: safeUser.updated_at || safeUser.updatedAt,
  };
}

export class AuthService {
  /**
   * Register a new applicant
   */
  async register({ fullName, email, mobile, countryCode = '+91', password, consent }) {
    const normalizedEmail = email.trim().toLowerCase();
    const cleanMobile = mobile.trim();
    const cleanCountryCode = countryCode.trim();

    const client = getSupabaseClient();

    if (client) {
      // Check existing email
      const { data: existingEmail } = await client
        .from('users')
        .select('id')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (existingEmail) {
        throw new ConflictError('An account with this email address already exists');
      }

      // Check existing phone
      const { data: existingPhone } = await client
        .from('users')
        .select('id')
        .eq('country_code', cleanCountryCode)
        .eq('mobile', cleanMobile)
        .maybeSingle();

      if (existingPhone) {
        throw new ConflictError('An account with this mobile number already exists');
      }

      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const { data: newUser, error: insertError } = await client
        .from('users')
        .insert({
          full_name: fullName.trim(),
          email: normalizedEmail,
          country_code: cleanCountryCode,
          mobile: cleanMobile,
          password_hash: passwordHash,
          role: 'applicant', // Force default role
          is_verified: false,
          consent: Boolean(consent),
        })
        .select()
        .single();

      if (insertError) {
        throw new BadRequestError(`Registration failed: ${insertError.message}`);
      }

      // Generate & store OTP
      const otpCode = generateOtpCode();
      const otpHash = hashOtp(otpCode);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      await client.from('otps').insert({
        user_id: newUser.id,
        otp_hash: otpHash,
        purpose: 'verification',
        expires_at: expiresAt,
      });

      return {
        user: sanitizeUser(newUser),
        otpCode: config.nodeEnv === 'development' || config.nodeEnv === 'test' ? otpCode : undefined,
      };
    }

    // --- In-memory Store Fallback ---
    if (inMemoryStore.usersByEmail.has(normalizedEmail)) {
      throw new ConflictError('An account with this email address already exists');
    }
    const phoneKey = `${cleanCountryCode}:${cleanMobile}`;
    if (inMemoryStore.usersByPhone.has(phoneKey)) {
      throw new ConflictError('An account with this mobile number already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    const newUser = {
      id: userId,
      full_name: fullName.trim(),
      email: normalizedEmail,
      country_code: cleanCountryCode,
      mobile: cleanMobile,
      password_hash: passwordHash,
      role: 'applicant',
      is_verified: false,
      failed_login_attempts: 0,
      locked_until: null,
      consent: Boolean(consent),
      created_at: now,
      updated_at: now,
    };

    inMemoryStore.users.set(userId, newUser);
    inMemoryStore.usersByEmail.set(normalizedEmail, userId);
    inMemoryStore.usersByPhone.set(phoneKey, userId);

    // Create OTP
    const otpCode = generateOtpCode();
    const otpId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    inMemoryStore.otps.set(otpId, {
      id: otpId,
      user_id: userId,
      otp_hash: hashOtp(otpCode),
      purpose: 'verification',
      attempts: 0,
      expires_at: expiresAt,
      created_at: now,
    });

    return {
      user: sanitizeUser(newUser),
      otpCode: config.nodeEnv === 'development' || config.nodeEnv === 'test' ? otpCode : undefined,
    };
  }

  /**
   * Verify email OTP
   */
  async verifyOtp({ email, otp }) {
    if (!email || !otp) {
      throw new BadRequestError('Email and OTP code are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    const expectedHash = hashOtp(cleanOtp);
    const now = new Date();

    const client = getSupabaseClient();

    if (client) {
      const { data: user } = await client
        .from('users')
        .select('id, is_verified')
        .eq('email', normalizedEmail)
        .maybeSingle();

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const { data: activeOtps } = await client
        .from('otps')
        .select('*')
        .eq('user_id', user.id)
        .eq('purpose', 'verification')
        .gt('expires_at', now.toISOString())
        .order('created_at', { ascending: false });

      const otpRecord = activeOtps?.[0];
      if (!otpRecord) {
        throw new BadRequestError('OTP has expired or does not exist. Please request a new one.');
      }

      if (otpRecord.attempts >= 5) {
        throw new BadRequestError('Too many invalid attempts. Please request a new OTP.');
      }

      if (otpRecord.otp_hash !== expectedHash) {
        await client
          .from('otps')
          .update({ attempts: otpRecord.attempts + 1 })
          .eq('id', otpRecord.id);
        throw new BadRequestError('Invalid OTP code. Please check and try again.');
      }

      // Mark verified
      await client.from('users').update({ is_verified: true, updated_at: now.toISOString() }).eq('id', user.id);
      // Consume OTP
      await client.from('otps').delete().eq('id', otpRecord.id);

      return { success: true, message: 'Account verified successfully' };
    }

    // In-memory fallback
    const userId = inMemoryStore.usersByEmail.get(normalizedEmail);
    if (!userId) {
      throw new NotFoundError('User not found');
    }

    const user = inMemoryStore.users.get(userId);
    const matchingOtp = Array.from(inMemoryStore.otps.values())
      .filter((o) => o.user_id === userId && o.purpose === 'verification' && new Date(o.expires_at) > now)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

    if (!matchingOtp) {
      throw new BadRequestError('OTP has expired or does not exist. Please request a new one.');
    }

    if (matchingOtp.attempts >= 5) {
      throw new BadRequestError('Too many invalid attempts. Please request a new OTP.');
    }

    if (matchingOtp.otp_hash !== expectedHash) {
      matchingOtp.attempts += 1;
      throw new BadRequestError('Invalid OTP code. Please check and try again.');
    }

    user.is_verified = true;
    user.updated_at = now.toISOString();
    inMemoryStore.otps.delete(matchingOtp.id);

    return { success: true, message: 'Account verified successfully' };
  }

  /**
   * Resend verification OTP
   */
  async resendOtp({ email }) {
    if (!email) {
      throw new BadRequestError('Email is required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const now = new Date().toISOString();
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const client = getSupabaseClient();
    if (client) {
      const { data: user } = await client.from('users').select('id, is_verified').eq('email', normalizedEmail).maybeSingle();
      if (!user) {
        throw new NotFoundError('No account found with this email');
      }

      // Invalidate old verification OTPs
      await client.from('otps').delete().eq('user_id', user.id).eq('purpose', 'verification');

      // Create new OTP
      await client.from('otps').insert({
        user_id: user.id,
        otp_hash: hashOtp(otpCode),
        purpose: 'verification',
        expires_at: expiresAt,
      });

      return {
        success: true,
        message: 'A new OTP has been sent to your email',
        otpCode: config.nodeEnv === 'development' || config.nodeEnv === 'test' ? otpCode : undefined,
      };
    }

    // In-memory fallback
    const userId = inMemoryStore.usersByEmail.get(normalizedEmail);
    if (!userId) {
      throw new NotFoundError('No account found with this email');
    }

    // Clean old
    for (const [id, o] of inMemoryStore.otps.entries()) {
      if (o.user_id === userId && o.purpose === 'verification') {
        inMemoryStore.otps.delete(id);
      }
    }

    const otpId = crypto.randomUUID();
    inMemoryStore.otps.set(otpId, {
      id: otpId,
      user_id: userId,
      otp_hash: hashOtp(otpCode),
      purpose: 'verification',
      attempts: 0,
      expires_at: expiresAt,
      created_at: now,
    });

    return {
      success: true,
      message: 'A new OTP has been sent to your email',
      otpCode: config.nodeEnv === 'development' || config.nodeEnv === 'test' ? otpCode : undefined,
    };
  }

  /**
   * Authenticate user with email or mobile + password
   */
  async login({ identifier, password }) {
    if (!identifier || !password) {
      throw new BadRequestError('Email/mobile and password are required');
    }

    const cleanId = identifier.trim();
    const isEmail = cleanId.includes('@');
    const now = new Date();

    const client = getSupabaseClient();

    if (client) {
      const query = client.from('users').select('*');
      if (isEmail) {
        query.eq('email', cleanId.toLowerCase());
      } else {
        query.eq('mobile', cleanId);
      }
      const { data: user } = await query.maybeSingle();

      if (!user) {
        throw new UnauthorizedError('Invalid email/mobile or password');
      }

      // Lockout check
      if (user.locked_until && new Date(user.locked_until) > now) {
        const remainingMinutes = Math.ceil((new Date(user.locked_until).getTime() - now.getTime()) / 60000);
        throw new TooManyRequestsError(
          `Account is temporarily locked due to 5 consecutive failed attempts. Please try again after ${remainingMinutes} minute(s).`
        );
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        const nextAttempts = (user.failed_login_attempts || 0) + 1;
        const updates = { failed_login_attempts: nextAttempts };

        if (nextAttempts >= config.auth.lockoutAttempts) {
          updates.locked_until = new Date(now.getTime() + config.auth.lockoutDurationMinutes * 60 * 1000).toISOString();
        }

        await client.from('users').update(updates).eq('id', user.id);
        throw new UnauthorizedError('Invalid email/mobile or password');
      }

      // Reset login counters on success
      await client
        .from('users')
        .update({
          failed_login_attempts: 0,
          locked_until: null,
          updated_at: now.toISOString(),
        })
        .eq('id', user.id);

      // Create session
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashSessionToken(rawToken);
      const sessionExpiry = new Date(now.getTime() + config.auth.sessionMaxAgeMs).toISOString();

      await client.from('sessions').insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: sessionExpiry,
      });

      return {
        token: rawToken,
        user: sanitizeUser(user),
      };
    }

    // In-memory fallback
    let user = null;
    if (isEmail) {
      const uid = inMemoryStore.usersByEmail.get(cleanId.toLowerCase());
      if (uid) user = inMemoryStore.users.get(uid);
    } else {
      // Find by mobile
      for (const u of inMemoryStore.users.values()) {
        if (u.mobile === cleanId) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      throw new UnauthorizedError('Invalid email/mobile or password');
    }

    // Check lockout
    if (user.locked_until && new Date(user.locked_until) > now) {
      const remainingMinutes = Math.ceil((new Date(user.locked_until).getTime() - now.getTime()) / 60000);
      throw new TooManyRequestsError(
        `Account is temporarily locked due to 5 consecutive failed attempts. Please try again after ${remainingMinutes} minute(s).`
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      user.failed_login_attempts = (user.failed_login_attempts || 0) + 1;
      if (user.failed_login_attempts >= config.auth.lockoutAttempts) {
        user.locked_until = new Date(now.getTime() + config.auth.lockoutDurationMinutes * 60 * 1000).toISOString();
      }
      throw new UnauthorizedError('Invalid email/mobile or password');
    }

    // Successful login: reset counters
    user.failed_login_attempts = 0;
    user.locked_until = null;
    user.updated_at = now.toISOString();

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashSessionToken(rawToken);
    const sessionExpiry = new Date(now.getTime() + config.auth.sessionMaxAgeMs).toISOString();

    inMemoryStore.sessions.set(tokenHash, {
      id: crypto.randomUUID(),
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: sessionExpiry,
      created_at: now.toISOString(),
    });

    return {
      token: rawToken,
      user: sanitizeUser(user),
    };
  }

  /**
   * Terminate active session immediately (FR3)
   */
  async logout(token) {
    if (!token) return { success: true };

    const tokenHash = hashSessionToken(token);
    const client = getSupabaseClient();

    if (client) {
      await client.from('sessions').delete().eq('token_hash', tokenHash);
      return { success: true };
    }

    // In-memory fallback
    inMemoryStore.sessions.delete(tokenHash);
    return { success: true };
  }

  /**
   * Validate session token from cookie/header and return authenticated user
   */
  async validateSession(token) {
    if (!token) return null;

    const tokenHash = hashSessionToken(token);
    const now = new Date();
    const client = getSupabaseClient();

    if (client) {
      const { data: session } = await client
        .from('sessions')
        .select('*')
        .eq('token_hash', tokenHash)
        .gt('expires_at', now.toISOString())
        .maybeSingle();

      if (!session) return null;

      const { data: user } = await client
        .from('users')
        .select('*')
        .eq('id', session.user_id)
        .maybeSingle();

      if (!user) return null;

      return {
        user: sanitizeUser(user),
        session,
      };
    }

    // In-memory fallback
    const session = inMemoryStore.sessions.get(tokenHash);
    if (!session || new Date(session.expires_at) <= now) {
      if (session) inMemoryStore.sessions.delete(tokenHash);
      return null;
    }

    const user = inMemoryStore.users.get(session.user_id);
    if (!user) return null;

    return {
      user: sanitizeUser(user),
      session,
    };
  }

  /**
   * Forgot password: send 15-minute reset OTP
   */
  async forgotPassword({ email }) {
    if (!email) {
      throw new BadRequestError('Email address is required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const otpCode = generateOtpCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const client = getSupabaseClient();
    if (client) {
      const { data: user } = await client.from('users').select('id').eq('email', normalizedEmail).maybeSingle();
      if (!user) {
        // Neutral response to prevent account enumeration
        return {
          success: true,
          message: 'If an account exists with this email, a password reset code has been sent.',
        };
      }

      // Invalidate old password reset OTPs
      await client.from('otps').delete().eq('user_id', user.id).eq('purpose', 'password_reset');

      await client.from('otps').insert({
        user_id: user.id,
        otp_hash: hashOtp(otpCode),
        purpose: 'password_reset',
        expires_at: expiresAt,
      });

      return {
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.',
        otpCode: config.nodeEnv === 'development' || config.nodeEnv === 'test' ? otpCode : undefined,
      };
    }

    // In-memory fallback
    const userId = inMemoryStore.usersByEmail.get(normalizedEmail);
    if (!userId) {
      return {
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.',
      };
    }

    // Invalidate old
    for (const [id, o] of inMemoryStore.otps.entries()) {
      if (o.user_id === userId && o.purpose === 'password_reset') {
        inMemoryStore.otps.delete(id);
      }
    }

    const otpId = crypto.randomUUID();
    inMemoryStore.otps.set(otpId, {
      id: otpId,
      user_id: userId,
      otp_hash: hashOtp(otpCode),
      purpose: 'password_reset',
      attempts: 0,
      expires_at: expiresAt,
      created_at: now,
    });

    return {
      success: true,
      message: 'If an account exists with this email, a password reset code has been sent.',
      otpCode: config.nodeEnv === 'development' || config.nodeEnv === 'test' ? otpCode : undefined,
    };
  }

  /**
   * Reset password with OTP and revoke all existing sessions
   */
  async resetPassword({ email, otp, newPassword }) {
    if (!email || !otp || !newPassword) {
      throw new BadRequestError('Email, reset code, and new password are required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const cleanOtp = otp.trim();
    const expectedHash = hashOtp(cleanOtp);
    const now = new Date();

    const client = getSupabaseClient();
    if (client) {
      const { data: user } = await client.from('users').select('id').eq('email', normalizedEmail).maybeSingle();
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const { data: activeOtps } = await client
        .from('otps')
        .select('*')
        .eq('user_id', user.id)
        .eq('purpose', 'password_reset')
        .gt('expires_at', now.toISOString())
        .order('created_at', { ascending: false });

      const otpRecord = activeOtps?.[0];
      if (!otpRecord) {
        throw new BadRequestError('Reset code has expired or does not exist');
      }

      if (otpRecord.attempts >= 5) {
        throw new BadRequestError('Too many invalid attempts. Please request a new reset code.');
      }

      if (otpRecord.otp_hash !== expectedHash) {
        await client.from('otps').update({ attempts: otpRecord.attempts + 1 }).eq('id', otpRecord.id);
        throw new BadRequestError('Invalid reset code');
      }

      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

      // Update password
      await client
        .from('users')
        .update({
          password_hash: passwordHash,
          failed_login_attempts: 0,
          locked_until: null,
          updated_at: now.toISOString(),
        })
        .eq('id', user.id);

      // Revoke all existing sessions for this user
      await client.from('sessions').delete().eq('user_id', user.id);

      // Delete used OTP
      await client.from('otps').delete().eq('id', otpRecord.id);

      return { success: true, message: 'Password has been reset successfully. Please log in.' };
    }

    // In-memory fallback
    const userId = inMemoryStore.usersByEmail.get(normalizedEmail);
    if (!userId) {
      throw new NotFoundError('User not found');
    }

    const user = inMemoryStore.users.get(userId);
    const matchingOtp = Array.from(inMemoryStore.otps.values())
      .filter((o) => o.user_id === userId && o.purpose === 'password_reset' && new Date(o.expires_at) > now)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];

    if (!matchingOtp) {
      throw new BadRequestError('Reset code has expired or does not exist');
    }

    if (matchingOtp.attempts >= 5) {
      throw new BadRequestError('Too many invalid attempts. Please request a new reset code.');
    }

    if (matchingOtp.otp_hash !== expectedHash) {
      matchingOtp.attempts += 1;
      throw new BadRequestError('Invalid reset code');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.password_hash = passwordHash;
    user.failed_login_attempts = 0;
    user.locked_until = null;
    user.updated_at = now.toISOString();

    // Revoke all sessions
    for (const [tokenHash, session] of inMemoryStore.sessions.entries()) {
      if (session.user_id === userId) {
        inMemoryStore.sessions.delete(tokenHash);
      }
    }

    inMemoryStore.otps.delete(matchingOtp.id);

    return { success: true, message: 'Password has been reset successfully. Please log in.' };
  }
}

export const authService = new AuthService();
export default authService;
