import crypto from 'crypto';

/**
 * Securely hashes a plain-text password using PBKDF2 with a unique cryptographic salt.
 * @param {string} password 
 * @returns {string} Salt and hash formatted as "salt:hash"
 */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifies a plain-text password against a stored "salt:hash" string using constant-time comparison.
 * @param {string} password 
 * @param {string} storedHash 
 * @returns {boolean}
 */
export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, originalHash] = storedHash.split(':');
  const computedHash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  
  const originalBuf = Buffer.from(originalHash, 'hex');
  const computedBuf = Buffer.from(computedHash, 'hex');
  
  if (originalBuf.length !== computedBuf.length) {
    return false;
  }
  return crypto.timingSafeEqual(originalBuf, computedBuf);
}
