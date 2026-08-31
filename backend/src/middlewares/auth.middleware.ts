import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    roles: string[];
  };
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET no está definido en .env');
  return secret;
}

export function authRequired(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = jwt.verify(token, getJwtSecret()) as { sub: string; roles?: string[] };
    req.user = { id: payload.sub, roles: payload.roles || [] };
    return next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
}

// Alias used by some modules that import authMiddleware directly.
export const authMiddleware = authRequired;

export function requireRoles(...allowed: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const roles = req.user?.roles || [];
    const ok = roles.some((r) => allowed.includes(r));
    if (!ok) return res.status(403).json({ message: 'No autorizado' });
    return next();
  };
}