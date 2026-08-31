import { Request, Response } from 'express';
import * as service from '../services/evento-panel.service';

const P2002_MESSAGE = 'Ya existe un registro con ese valor, verifica los datos';

function handleError(res: Response, err: any, fallback = 'Ocurrió un error') {
  if (err?.code === 'P2002') return res.status(409).json({ message: P2002_MESSAGE });
  return res.status(400).json({ message: err?.message || fallback });
}

export async function getResumen(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const data = await service.getResumen(evento_id);
    return res.status(200).json(data);
  } catch (err: any) {
    return handleError(res, err, 'No se pudo obtener el resumen del evento');
  }
}

export async function patchDatos(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const operadorId = String(req.body.usuario_id || req.body.operadorId || req.headers['x-usuario-id'] || '');
    if (!operadorId) return res.status(400).json({ message: 'usuario_id es requerido en el body para auditoría.' });

    const data = await service.updateDatos(evento_id, req.body, operadorId);
    return res.status(200).json(data);
  } catch (err: any) {
    return handleError(res, err, 'No se pudo actualizar los datos del evento');
  }
}

export async function getInscripciones(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const categoria_id = typeof req.query.categoria_id === 'string' ? req.query.categoria_id : undefined;
    const items = await service.listInscripciones(evento_id, categoria_id);
    return res.status(200).json({ items });
  } catch (err: any) {
    return handleError(res, err, 'No se pudieron listar las inscripciones');
  }
}

export async function getClasificaciones(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const items = await service.listClasificaciones(evento_id);
    return res.status(200).json({ items });
  } catch (err: any) {
    return handleError(res, err, 'No se pudieron listar las clasificaciones');
  }
}

export async function getResultados(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const items = await service.listResultados(evento_id);
    return res.status(200).json({ items });
  } catch (err: any) {
    return handleError(res, err, 'No se pudieron listar los resultados');
  }
}
