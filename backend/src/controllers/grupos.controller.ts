import { Request, Response } from 'express';
import * as service from '../services/grupos.service';

const P2002_MESSAGE = 'Ya existe un registro con ese valor, verifica los datos';

function handleError(res: Response, err: any, fallback = 'Ocurrió un error') {
  if (err?.code === 'P2002') return res.status(409).json({ message: P2002_MESSAGE });
  return res.status(400).json({ message: err?.message || fallback });
}

export async function postCrearGrupo(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const operadorId = String(req.body.usuario_id || req.headers['x-usuario-id'] || '');
    if (!operadorId) return res.status(400).json({ message: 'usuario_id es requerido en body para auditoría' });

    const created = await service.crearGrupo(evento_id, req.body, operadorId);
    return res.status(201).json(created);
  } catch (err: any) {
    return handleError(res, err, 'No se pudo crear el grupo');
  }
}

export async function getListarGrupos(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const items = await service.listarGrupos(evento_id);
    return res.status(200).json({ items });
  } catch (err: any) {
    return handleError(res, err, 'No se pudieron listar los grupos');
  }
}

export async function patchEditarGrupo(req: Request, res: Response) {
  try {
    const { evento_id, grupo_id } = req.params;
    const updated = await service.editarGrupo(evento_id, grupo_id, req.body);
    return res.status(200).json(updated);
  } catch (err: any) {
    return handleError(res, err, 'No se pudo editar el grupo');
  }
}

export async function deleteGrupo(req: Request, res: Response) {
  try {
    const { evento_id, grupo_id } = req.params;
    const result = await service.eliminarGrupo(evento_id, grupo_id);
    return res.status(200).json(result);
  } catch (err: any) {
    return handleError(res, err, 'No se pudo eliminar el grupo');
  }
}

export async function patchClasificacionCompletada(req: Request, res: Response) {
  try {
    const { grupo_id } = req.params;
    const result = await service.marcarClasificacionCompletada(grupo_id);
    return res.status(200).json(result);
  } catch (err: any) {
    return handleError(res, err, 'No se pudo marcar la clasificación como completada');
  }
}

export async function patchHeatCompletado(req: Request, res: Response) {
  try {
    const { grupo_id } = req.params;
    const { numero_heat } = req.body;
    const result = await service.marcarHeatCompletado(grupo_id, Number(numero_heat));
    return res.status(200).json(result);
  } catch (err: any) {
    return handleError(res, err, 'No se pudo marcar el heat como completado');
  }
}
