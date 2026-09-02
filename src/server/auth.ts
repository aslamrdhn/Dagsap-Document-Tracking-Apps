import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'dagsap-super-secret-key-2026';
const REFRESH_SECRET_KEY = process.env.JWT_REFRESH_SECRET || 'dagsap-super-refresh-secret-key-2026';

export function generateToken(payload: any, expiresIn: string = '15m') {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: expiresIn as any });
}

export function generateRefreshToken(payload: any, expiresIn: string = '7d') {
  return jwt.sign(payload, REFRESH_SECRET_KEY, { expiresIn: expiresIn as any });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, REFRESH_SECRET_KEY);
  } catch (err) {
    return null;
  }
}
