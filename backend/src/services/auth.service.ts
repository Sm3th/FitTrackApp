import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

const JWT_SECRET: jwt.Secret =
  (process.env.JWT_SECRET as jwt.Secret) || 'your-secret-key-change-in-production';
// `expiresIn` may be a string or number according to SignOptions
type ExpiresIn = jwt.SignOptions['expiresIn'];
const JWT_EXPIRE: ExpiresIn = (process.env.JWT_EXPIRE as ExpiresIn) || '7d';

export class AuthService {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  generateToken(payload: JWTPayload): string {
    // `jwt.sign` is overloaded and TypeScript can struggle to pick the
    // correct signature when the secret or options are untyped.  Make
    // sure we use the proper `jwt.Secret` type for the key and a
    // strongly‑typed `SignOptions` object here so the overload resolution
    // succeeds without errors.
    const options: jwt.SignOptions = { expiresIn: JWT_EXPIRE };
    return jwt.sign(payload, JWT_SECRET, options);
  }

  verifyToken(token: string): JWTPayload {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  }
}

export const authService = new AuthService();
