import { ForbiddenError, UnauthorizedError } from '../errors.js';

/**
 * Enforce role-based access control.
 * Deny-by-default: protected endpoints require valid user session and explicit role match.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Access forbidden: this action requires one of the following roles: [${allowedRoles.join(', ')}]`)
      );
    }

    next();
  };
}

export const requireAdmin = requireRole('admin');
export const requireApplicant = requireRole('applicant');

export default {
  requireRole,
  requireAdmin,
  requireApplicant,
};
