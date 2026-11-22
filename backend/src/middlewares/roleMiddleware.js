/**
 * Role-Based Access Control (RBAC) middleware.
 * Ensures the authenticated user has one of the allowed roles.
 * @param {string[]} allowedRoles - e.g. ['ADMIN'] or ['FACULTY', 'ADMIN']
 */
export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        errorCode: 'UNAUTHENTICATED',
      });
    }

    const userRole = (req.user.role || '').toUpperCase();
    const upperAllowed = allowedRoles.map((r) => r.toUpperCase());

    if (!upperAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Role '${userRole}' is not authorized for this resource. Required: [${upperAllowed.join(', ')}]`,
        errorCode: 'FORBIDDEN',
      });
    }

    next();
  };
}
