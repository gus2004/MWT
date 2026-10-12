import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import prisma from '../../prisma.config';

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

export async function authRequired(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  const token = header.split(' ')[1];

  let payload: { sub: string; roles?: string[] };
  try {
    payload = jwt.verify(token, getJwtSecret()) as { sub: string; roles?: string[] };
  } catch {
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }

  try {
    // La sesión solo es válida si el usuario sigue existiendo y está ACTIVO.
    // Se refrescan roles desde la BD para no depender del JWT (coexistencia
    // usuario + proceso: desactivar la cuenta o quitar el rol bloquea el acceso).
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.sub },
      select: {
        esta_activo: true,
        roles: { include: { rol: { select: { nombre: true } } } },
      },
    });

    if (!usuario) {
      return res.status(401).json({ message: 'Cuenta no encontrada' });
    }

    if (!usuario.esta_activo) {
      return res.status(401).json({ message: 'Tu cuenta está inactiva. Contacta al administrador.' });
    }

    req.user = {
      id: payload.sub,
      roles: usuario.roles.map((r) => r.rol.nombre),
    };
    return next();
  } catch (error) {
    console.error('[auth] Error validando sesión contra BD:', error);
    return res.status(500).json({ message: 'Error interno al validar la autenticación' });
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