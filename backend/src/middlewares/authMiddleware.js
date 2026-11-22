import jwt from 'jsonwebtoken';
import jwksRsa from 'jwks-rsa';
import { config } from '../config/aws.js';
import { userRepository } from '../repositories/userRepository.js';

let jwksClient = null;
if (config.aws.cognito.userPoolId && config.aws.cognito.region) {
  jwksClient = jwksRsa({
    jwksUri: `https://cognito-idp.${config.aws.cognito.region}.amazonaws.com/${config.aws.cognito.userPoolId}/.well-known/jwks.json`,
    cache: true,
    rateLimit: true,
  });
}

function getKey(header, callback) {
  if (!jwksClient) {
    return callback(new Error('Cognito JWKS not configured'));
  }
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey ? key.getPublicKey() : key.rsaPublicKey;
    callback(null, signingKey);
  });
}

/**
 * Authentication middleware.
 * Verifies Cognito JWT in production or resolves user from auth headers in local mode.
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // 1. If Cognito token is provided and configured
    if (authHeader && authHeader.startsWith('Bearer ') && config.aws.cognito.userPoolId && !authHeader.includes('mock-jwt-')) {
      const token = authHeader.substring(7);
      return jwt.verify(token, getKey, { algorithms: ['RS256'] }, async (err, decoded) => {
        if (err) {
          return res.status(401).json({ success: false, error: 'Invalid or expired token', errorCode: 'AUTH_FAILED' });
        }
        req.user = {
          id: decoded.sub || decoded.username,
          email: decoded.email || '',
          name: decoded.name || decoded['cognito:username'] || 'User',
          role: (decoded['custom:role'] || decoded['cognito:groups']?.[0] || 'STUDENT').toUpperCase(),
          department: decoded['custom:department'] || 'General',
        };
        next();
      });
    }

    // 2. Local development / Mock auth fallback
    // Headers can specify x-user-id, x-user-role, x-user-email, x-user-name
    const headerUserId = req.headers['x-user-id'];
    const headerUserRole = req.headers['x-user-role'];
    const headerUserEmail = req.headers['x-user-email'];
    const headerUserName = req.headers['x-user-name'];

    if (headerUserId) {
      const existingUser = await userRepository.getById(String(headerUserId));
      req.user = {
        id: String(headerUserId),
        email: headerUserEmail || existingUser?.email || `${headerUserId}@campusslot.edu`,
        name: headerUserName || existingUser?.name || `Demo ${headerUserRole || 'User'}`,
        role: String(headerUserRole || existingUser?.role || 'STUDENT').toUpperCase(),
        department: existingUser?.department || 'Computer Science',
      };
      return next();
    }

    // 3. Fallback to mock bearer token: "Bearer mock-jwt-student-1" etc.
    if (authHeader && authHeader.startsWith('Bearer mock-jwt-')) {
      const parts = authHeader.replace('Bearer mock-jwt-', '').split('-');
      const role = (parts[0] || 'STUDENT').toUpperCase();
      const id = authHeader.replace('Bearer mock-jwt-', 'user-');
      req.user = {
        id,
        email: `${id}@campusslot.edu`,
        name: `${role.charAt(0) + role.slice(1).toLowerCase()} User`,
        role,
        department: 'School of Engineering',
      };
      return next();
    }

    // Default mock demo user for rapid local API testing if no header is supplied
    req.user = {
      id: 'demo-student-01',
      email: 'alex.student@campusslot.edu',
      name: 'Alex Johnson',
      role: 'STUDENT',
      department: 'Computer Science',
    };
    next();
  } catch (error) {
    next(error);
  }
}
