import { Request, Response } from 'express';
import * as clasificacionService from '../services/clasificaciones.service';

export async function listClasificaciones(req: Request, res: Response) {
  try {
    const items = await clasificacionService.listClasificaciones({
      campeonatoId: typeof req.query.campeonatoId === 'string' ? req.query.campeonatoId : undefined,
      categoriaId: typeof req.query.categoriaId === 'string' ? req.query.categoriaId : undefined,
    });

    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(500).json({ message: error.message || 'Error obteniendo clasificaciones.' });
  }
}

export async function createClasificacion(req: Request, res: Response) {
  try {
    const { piloto_id, categoria_id, campeonato_id, puntos_total, posicion } = req.body;
    const data = await clasificacionService.createClasificacion({
      piloto_id,
      categoria_id,
      campeonato_id,
      puntos_total: Number.isFinite(Number(puntos_total)) ? Number(puntos_total) : 0,
      posicion: posicion === undefined || posicion === null || posicion === '' ? null : Number(posicion),
    });

    return res.status(201).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error creando clasificación.' });
  }
}

export async function updateClasificacion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { piloto_id, categoria_id, campeonato_id, puntos_total, posicion } = req.body;
    const data = await clasificacionService.updateClasificacion(id, {
      ...(piloto_id ? { piloto_id } : {}),
      ...(categoria_id ? { categoria_id } : {}),
      ...(campeonato_id ? { campeonato_id } : {}),
      ...(puntos_total !== undefined ? { puntos_total: Number(puntos_total) } : {}),
      ...(posicion !== undefined ? { posicion: posicion === null || posicion === '' ? null : Number(posicion) } : {}),
    });

    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error actualizando clasificación.' });
  }
}

export async function deleteClasificacion(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await clasificacionService.deleteClasificacion(id);
    return res.status(204).send();
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'Error eliminando clasificación.' });
  }
}

export async function getPilotosGrupo(req: Request, res: Response) {
  try {
    const { grupo_id } = req.params;
    const evento_id = typeof req.query.evento_id === 'string' ? req.query.evento_id : undefined;
    const items = await clasificacionService.getPilotosForGrupo(grupo_id, evento_id);
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'No fue posible obtener pilotos del grupo.' });
  }
}

export async function postTiempoGrupo(req: Request, res: Response) {
  try {
    const { grupo_id } = req.params;
    const { inscripcion_id, vuelta_1, vuelta_2 } = req.body;
    if (!inscripcion_id) return res.status(400).json({ message: 'inscripcion_id es requerido.' });

    const result = await clasificacionService.saveClasificacionTiempo(grupo_id, inscripcion_id, vuelta_1 ?? null, vuelta_2 ?? null);
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'No fue posible guardar tiempo de clasificación.' });
  }
}

export async function postTiempoEventoCategoria(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const { categoria_id, inscripcion_id, vuelta_1, vuelta_2 } = req.body;
    if (!evento_id) return res.status(400).json({ message: 'evento_id es requerido.' });
    if (!categoria_id) return res.status(400).json({ message: 'categoria_id es requerido.' });
    if (!inscripcion_id) return res.status(400).json({ message: 'inscripcion_id es requerido.' });

    const result = await clasificacionService.saveClasificacionTiempoEvento(
      evento_id,
      categoria_id,
      inscripcion_id,
      vuelta_1 ?? null,
      vuelta_2 ?? null,
    );
    return res.status(201).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'No fue posible guardar el tiempo de clasificación.' });
  }
}

export async function getParrillaEventoCategoria(req: Request, res: Response) {
  try {
    const { evento_id } = req.params;
    const categoriaId = typeof req.query.categoria_id === 'string' ? req.query.categoria_id : '';
    if (!evento_id) return res.status(400).json({ message: 'evento_id es requerido.' });
    if (!categoriaId) return res.status(400).json({ message: 'categoria_id es requerido.' });

    const items = await clasificacionService.getParrillaEventoCategoria(evento_id, categoriaId);
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'No fue posible obtener la parrilla del evento.' });
  }
}

export async function getParrilla(req: Request, res: Response) {
  try {
    const { grupo_id } = req.params;
    const items = await clasificacionService.getParrillaGrupo(grupo_id);
    return res.status(200).json({ items });
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'No fue posible obtener la parrilla.' });
  }
}

export async function patchCompletarGrupo(req: Request, res: Response) {
  try {
    const { grupo_id } = req.params;
    const result = await clasificacionService.completarClasificacion(grupo_id);
    return res.status(200).json(result);
  } catch (error: any) {
    return res.status(400).json({ message: error.message || 'No fue posible completar la clasificación.' });
  }
}
