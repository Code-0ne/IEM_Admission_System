import express from 'express';
import { userRegistrationSchema, passwordSchema } from '../../db/validators.js';
import { BadRequestError } from '../../errors.js';
import authService from './service.js';
import { authenticate, SESSION_COOKIE_NAME } from '../../middleware/auth.js';
import config from '../../config.js';

export const authRouter = express.Router();

/**
 * Helper to set secure session cookie
 */
function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'strict',
    maxAge: config.auth.sessionMaxAgeMs,
    path: '/',
  });
}

/**
 * POST /api/auth/register
 */
authRouter.post('/register', async (req, res, next) => {
  try {
    const validatedData = userRegistrationSchema.parse(req.body);
    const result = await authService.register(validatedData);

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Enter the OTP sent to your email to verify.',
      user: result.user,
      otpCode: result.otpCode, // Available in dev/test environments
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/verify-otp
 */
authRouter.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      throw new BadRequestError('Email and OTP code are required');
    }

    const result = await authService.verifyOtp({ email, otp });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/resend-otp
 */
authRouter.post('/resend-otp', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new BadRequestError('Email is required');
    }

    const result = await authService.resendOtp({ email });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 */
authRouter.post('/login', async (req, res, next) => {
  try {
    const { identifier, password } = req.body;
    if (!identifier || !password) {
      throw new BadRequestError('Email/mobile and password are required');
    }

    const result = await authService.login({ identifier, password });
    setSessionCookie(res, result.token);

    res.status(200).json({
      success: true,
      message: 'Signed in successfully',
      user: result.user,
      token: result.token, // Return token for API clients / testing
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 */
authRouter.post('/logout', async (req, res, next) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME] || req.signedCookies?.[SESSION_COOKIE_NAME];
    await authService.logout(token);

    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    res.status(200).json({
      success: true,
      message: 'Signed out successfully',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/auth/me
 */
authRouter.get('/me', authenticate, async (req, res) => {
  res.status(200).json({
    user: req.user,
  });
});

/**
 * POST /api/auth/forgot-password
 */
authRouter.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      throw new BadRequestError('Email is required');
    }

    const result = await authService.forgotPassword({ email });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/reset-password
 */
authRouter.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      throw new BadRequestError('Email, reset code, and new password are required');
    }

    // Validate password complexity
    passwordSchema.parse(newPassword);

    const result = await authService.resetPassword({ email, otp, newPassword });

    // Ensure session cookie is cleared after password reset
    res.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'strict',
      path: '/',
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export default authRouter;
