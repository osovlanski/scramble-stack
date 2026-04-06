import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import logger from '../core/logger';

export interface AuthRequest extends Request {
  userId: string;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.slice(7);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    logger.fail('JWT_SECRET is not set');
    res.status(500).json({ success: false, message: 'Server misconfiguration' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as { userId: string };
    (req as AuthRequest).userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}
