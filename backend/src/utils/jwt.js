import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'campusslot-jwt-production-secret-key-2026';
const JWT_EXPIRES_IN = '7d';

/**
 * Generates a signed JSON Web Token containing authenticated user claims.
 * @param {Object} user - { id, email, role, name, department }
 * @returns {string} Signed JWT token
 */
export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      department: user.department || 'General',
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verifies a JSON Web Token and decodes payload claims.
 * @param {string} token 
 * @returns {Object} Decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
