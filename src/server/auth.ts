import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'dagsap-super-secret-key-2026';
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET || 'dagsap-super-refresh-secret-key-2026';

/**
 * Generate a new JWT access token for the user.
 * @param payload - The data payload to sign into the JWT (e.g., userId and role).
 * @param expiresIn - Expiration time expressed as string (e.g., '15m'). Defaults to '15m'.
 * @returns {string} The signed JWT access token string.
 */
export function generateToken(payload: any, expiresIn: string = '15m') {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: expiresIn as any });
}

/**
 * Generate a new JWT refresh token for the user.
 * @param payload - The data payload to sign into the JWT (e.g., userId).
 * @param expiresIn - Expiration time expressed as string (e.g., '7d'). Defaults to '7d'.
 * @returns {string} The signed JWT refresh token string.
 */
export function generateRefreshToken(payload: any, expiresIn: string = '7d') {
  return jwt.sign(payload, REFRESH_SECRET_KEY, { expiresIn: expiresIn as any });
}

/**
 * Verify an incoming JWT access token.
 * @param token - The JWT string to verify.
 * @returns {any | null} The decoded payload if valid, otherwise null.
 */
export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    return null;
  }
}

/**
 * Verify an incoming JWT refresh token.
 * @param token - The JWT string to verify.
 * @returns {any | null} The decoded payload if valid, otherwise null.
 */
export function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, REFRESH_SECRET_KEY);
  } catch (err) {
    return null;
  }
}
