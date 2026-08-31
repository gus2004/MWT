import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import {
  listEntity,
  createEntity,
  updateEntity,
  removeEntity,
  detailEntity,
} from '../services/mantenimiento-crud.service';

export async function listCrud(req: Request, res: Response) {
  try {
    const query = typeof req.query?.estado === 'string' ? { estado: req.query.estado } : undefined;
    const items = await listEntity(req.params.entity, query);
    return res.status(200).json({ items });
  } catch (err: any) {
    return res.status(400).json({ message: err?.message || 'No se pudo listar la entidad.' });
  }
}

export async function getCrudDetail(req: Request, res: Response) {
  try {
    const item = await detailEntity(req.params.entity, req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Detalle no disponible para esta entidad.' });
    }
    return res.status(200).json(item);
  } catch (err: any) {
    return res.status(400).json({ message: err?.message || 'No se pudo obtener el detalle.' });
  }
}

export function puedeGestionarRoles(req: AuthRequest): boolean {
  return (req.user?.roles || []).some((r) => r === 'ADMIN');
}

export async function createCrud(req: AuthRequest, res: Response) {
  try {
    const body = req.body || {};
    if (req.params.entity === 'usuarios' && body.roles !== undefined && !puedeGestionarRoles(req)) {
      return res.status(403).json({ message: 'Solo el administrador puede asignar roles.' });
    }
    const created = await createEntity(req.params.entity, body, req.user?.id || '');
    return res.status(201).json(created);
  } catch (err: any) {
    return res.status(400).json({ message: err?.message || 'No se pudo crear el registro.' });
  }
}

export async function updateCrud(req: AuthRequest, res: Response) {
  try {
    const body = req.body || {};
    if (req.params.entity === 'usuarios' && body.roles !== undefined && !puedeGestionarRoles(req)) {
      return res.status(403).json({ message: 'Solo el administrador puede cambiar roles.' });
    }
    const updated = await updateEntity(req.params.entity, req.params.id, body, req.user?.id || '');
    return res.status(200).json(updated);
  } catch (err: any) {
    return res.status(400).json({ message: err?.message || 'No se pudo actualizar el registro.' });
  }
}

export async function deleteCrud(req: AuthRequest, res: Response) {
  try {
    const removed = await removeEntity(req.params.entity, req.params.id, req.user?.id || '');
    return res.status(200).json({ ok: true, ...removed });
  } catch (err: any) {
    return res.status(400).json({ message: err?.message || 'No se pudo eliminar el registro.' });
  }
}