import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'dev-only-jwt-secret-do-not-use-in-production' : null);

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required in production');
}

// Non-null assertion is safe here because we throw above if JWT_SECRET is null
const SECRET = JWT_SECRET as string;

export interface JWTPayload {
  userId: string;
  email: string;
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}
