import { UnauthorizedError } from '../errors.js';
import authService from '../modules/auth/service.js';

export const SESSION_COOKIE_NAME = 'iem_session';

/**
 * Authentication middleware that verifies session token and populates req.user.
 */
export async function authenticate(req, res, next) {
  try {
    // 1. Try reading cookie (signed or unsigned)
    let token = req.cookies?.[SESSION_COOKIE_NAME] || req.signedCookies?.[SESSION_COOKIE_NAME];

    // 2. Fallback to Authorization: Bearer <token> header
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      throw new UnauthorizedError('Authentication required. Please sign in.');
    }

    const sessionData = await authService.validateSession(token);
    if (!sessionData) {
      // Clear stale cookie
      res.clearCookie(SESSION_COOKIE_NAME, {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
      });
      throw new UnauthorizedError('Session has expired or is invalid. Please sign in again.');
    }

    req.user = sessionData.user;
    req.session = sessionData.session;
    req.sessionToken = token;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication: populates req.user if session valid, but doesn't block if absent.
 */
export async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME] || req.signedCookies?.[SESSION_COOKIE_NAME];
    if (token) {
      const sessionData = await authService.validateSession(token);
      if (sessionData) {
        req.user = sessionData.user;
        req.session = sessionData.session;
        req.sessionToken = token;
      }
    }
    next();
  } catch {
    next();
  }
}

export default authenticate;
