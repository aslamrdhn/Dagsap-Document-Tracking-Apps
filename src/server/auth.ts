import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'dagsap-super-secret-key-2026';

export function generateToken(payload: any, expiresIn: string = '24h') {
  return jwt.sign(payload, SECRET_KEY, { expiresIn: expiresIn as any });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    return null;
  }
}
